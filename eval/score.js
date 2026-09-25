#!/usr/bin/env node
'use strict';

/**
 * Reduce one archived run to a row.
 *
 *   node score.js D 1
 *   node score.js --all
 *
 * Reads eval/runs/<arm>-<n>/ and the matching eval/results/<arm>-<n>.json, and writes
 * eval/results/<arm>-<n>.score.json. Every arm is reduced by the same code, and the code is
 * committed, so the reduction is reviewable rather than remembered.
 *
 * All eight. Build and accessibility run in the run directory at generation time, because
 * that is where node_modules and the build output are; this reads what they wrote. If
 * either is missing it reports unavailable rather than clean — a measurement that did not
 * happen must not read as a pass.
 */

const fs = require('fs');
const path = require('path');

const EVAL = __dirname;
// Runs are grouped by model: the same arm on two models is two conditions, and flattening
// them would make one overwrite the other.
const MODEL = process.env.MODEL || 'opus-5-5';
const SLUG = MODEL.replace(/^claude-/, '').replace(/-?20\d{6}$/, '');
const RUNS = path.join(EVAL, 'runs', SLUG);
const RESULTS = path.join(EVAL, 'results', SLUG);

const slots = require('./scorers/slots');
const rawValues = require('./scorers/raw-values');
const tiers = require('./scorers/tiers');
const api = require('./scorers/api');
const checks = require('./scorers/checks');
const conformance = require('./scorers/conformance');
const { voidReason } = require('./scorers/void');

const readIfPresent = (file) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;

function scoreRun(arm, run) {
  const dir = path.join(RUNS, `${arm}-${run}`);
  if (!fs.existsSync(dir)) throw new Error(`no archived run at ${dir}`);

  const appRoot = path.join(dir, 'src');
  const harnessFile = path.join(RESULTS, `${arm}-${run}.json`);
  const harness = fs.existsSync(harnessFile)
    ? JSON.parse(fs.readFileSync(harnessFile, 'utf8'))
    : null;

  // A run the API cut off is not a run. C-1 was aborted by a 429 at turn 22 and this
  // function cheerfully reduced the half-built application to `slots 10/13, checks 5/8,
  // BROKEN` — a row that reads as arm C underperforming rather than as no observation at
  // all. Same for a run that was denied a tool the arm is defined by: that is how the
  // first D pilot was nearly recorded as a weak D instead of a clean C.
  //
  // Scoring must refuse both. A measurement that did not happen may not look like a bad
  // measurement.
  const voided = voidReason(harness);
  if (voided) {
    return {
      arm, run: Number(run),
      scoredAt: new Date().toISOString().slice(0, 19) + 'Z',
      model: harness && harness.model,
      void: voided,
      cost: harness && harness.result && {
        usd: harness.result.total_cost_usd,
        turns: harness.result.num_turns,
      },
    };
  }

  const adoption = slots.score(appRoot, arm);
  const raw = rawValues.score(appRoot);
  const tier = tiers.score(appRoot);
  const hallucinations = api.score(appRoot);
  const nine = checks.score(appRoot, arm);
  const conform = conformance.score(appRoot);
  const build = readIfPresent(path.join(dir, 'build.json'));
  const a11y = readIfPresent(path.join(dir, 'a11y.json'));

  return {
    arm,
    run: Number(run),
    scoredAt: new Date().toISOString().slice(0, 19) + 'Z',
    model: harness && harness.model,
    isolation: harness && harness.isolation,
    s0Sha: harness && harness.s0Sha,
    denialsIgnored: harness.scoring && harness.scoring.ignoreDenials
      ? { tools: [...new Set(((harness.result || {}).permission_denials || []).map((d) => d.tool_name))],
          why: harness.scoring.why }
      : undefined,
    overlaySha: harness && harness.overlaySha,

    covered: {
      slotsUsed: adoption.used,
      slotsOf: adoption.of,
      reimplemented: adoption.reimplemented,
      absent: adoption.absent,
      hadLibrary: adoption.hadLibrary,
      falsifierTriggered: adoption.falsifierTriggered,
      hallucinatedApi: hallucinations.total,
      hallucinatedProps: hallucinations.unknownProps,
      hallucinatedImports: hallucinations.unknownImports,
    },

    gap: {
      rawValues: raw.total,
      chromatic: raw.chromatic,
      dimensional: raw.dimensional,
      declaredLocalTokens: raw.declared,
      breakpoints: raw.breakpoints,
      tierCrossings: tier.crossings,
      tier1: tier.tier1,
      tier3: tier.tier3,
    },

    // Not "did it use tokens" — that is tiers — but "are the values it settled on the
    // system's values". The A pilot declared a disciplined seventy-property token layer in
    // the zinc palette, and every metric above read that as good behaviour.
    conformance: {
      authored: conform.authored,
      matched: conform.matched,
      divergent: conform.divergent,
      novel: conform.novel,
      rate: conform.rate,
      colour: conform.byKind.colour,
      length: conform.byKind.length,
      byOrigin: conform.byOrigin,
      reference: conform.reference.source + '@' + conform.reference.version,
      tolerances: conform.tolerances,
    },

    tokens: {
      decisionsUsed: tier.decisionsUsed,
      imports: tier.tokenImports,
      importedPublicSurface: tier.importedPublicSurface,
    },

    checks: { applicable: nine.applicable, passed: nine.passed, failed: nine.failed,
              na: nine.na, of: nine.of },

    a11y: a11y && (a11y.available
      ? { total: a11y.total, critical: a11y.critical, serious: a11y.serious,
          moderate: a11y.moderate, minor: a11y.minor }
      : { unavailable: a11y.reason }),

    build: build || { unavailable: 'build.json not written for this run' },

    cost: harness && {
      inputTokensTotal: harness.inputTokensTotal,
      outputTokens: harness.outputTokens,
      usd: harness.result && harness.result.total_cost_usd,
      durationMs: harness.result && harness.result.duration_api_ms,
      turns: harness.result && harness.result.num_turns,
      permissionDenials: harness.result && harness.result.permission_denials,
    },

    detail: {
      slots: adoption.slots,
      rawValues: raw.detail,
      tiers: tier.detail,
      hallucinations: hallucinations.detail,
      checks: nine.results,
      conformance: conform.detail,
      a11yPages: a11y && a11y.pages,
    },
  };
}

function write(row) {
  fs.mkdirSync(RESULTS, { recursive: true });
  const out = path.join(RESULTS, `${row.arm}-${row.run}.score.json`);
  fs.writeFileSync(out, JSON.stringify(row, null, 2) + '\n');
  return out;
}

function line(r) {
  if (r.void) {
    return `${r.arm}-${r.run}`.padEnd(8) + 'VOID — ' + r.void +
      (r.cost && r.cost.usd ? `   ($${r.cost.usd.toFixed(2)} spent)` : '');
  }
  const c = r.covered, g = r.gap;
  return [
    `${r.arm}-${r.run}`.padEnd(8),
    `slots ${c.slotsUsed}/${c.slotsOf}`.padEnd(12),
    `reimpl ${c.reimplemented}`.padEnd(10),
    `raw ${g.rawValues}`.padEnd(8),
    `local ${g.declaredLocalTokens}`.padEnd(10),
    `crossings ${g.tierCrossings}`.padEnd(14),
    `decisions ${r.tokens.decisionsUsed}`.padEnd(15),
    (r.conformance.colour.authored
      ? `colour ${r.conformance.colour.matched}/${r.conformance.colour.authored}`
      : 'colour n/a').padEnd(14),
    `near ${r.conformance.divergent}`.padEnd(9),
    `api ${r.covered.hallucinatedApi}`.padEnd(8),
    (r.checks.applicable ? `checks ${r.checks.passed}/${r.checks.of}` : 'checks n/a').padEnd(12),
    (r.build && r.build.ok === true ? 'builds' : r.build && r.build.ok === false ? 'BROKEN' : 'build?').padEnd(8),
    r.cost && r.cost.usd ? `$${r.cost.usd.toFixed(2)}` : '',
    c.falsifierTriggered === true ? '  FALSIFIER' : '',
    r.denialsIgnored ? '  (denials ignored by record)' : '',
  ].join('');
}

const args = process.argv.slice(2);

if (args[0] === '--all') {
  const runs = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter((d) => /^[\w-]+-\d+$/.test(d)) : [];
  if (runs.length === 0) { console.error('  no archived runs in eval/runs'); process.exit(1); }
  for (const dir of runs.sort()) {
    const m = /^(.*)-(\d+)$/.exec(dir);
    try { const row = scoreRun(m[1], m[2]); write(row); console.log('  ' + line(row)); }
    catch (error) { console.log(`  ${dir.padEnd(8)}${error.message}`); }
  }
} else if (args.length === 2) {
  const row = scoreRun(args[0], args[1]);
  console.log('  ' + line(row));
  console.log('  → ' + write(row));
} else {
  console.error('  Usage: node score.js <arm> <run>   |   node score.js --all');
  console.error('  Model comes from $MODEL (currently ' + SLUG + ').');
  process.exit(1);
}
