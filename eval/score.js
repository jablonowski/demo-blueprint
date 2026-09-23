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
 * Four of the eight scorers are here. The nine checks, the API contract comparison, axe and
 * cost-per-accepted-screen are not written yet and are reported as pending rather than as
 * zero — a missing measurement must not read as a clean one.
 */

const fs = require('fs');
const path = require('path');

const EVAL = __dirname;
const RUNS = path.join(EVAL, 'runs');
const RESULTS = path.join(EVAL, 'results');

const slots = require('./scorers/slots');
const rawValues = require('./scorers/raw-values');
const tiers = require('./scorers/tiers');

function scoreRun(arm, run) {
  const dir = path.join(RUNS, `${arm}-${run}`);
  if (!fs.existsSync(dir)) throw new Error(`no archived run at ${dir}`);

  const appRoot = path.join(dir, 'src');
  const harnessFile = path.join(RESULTS, `${arm}-${run}.json`);
  const harness = fs.existsSync(harnessFile)
    ? JSON.parse(fs.readFileSync(harnessFile, 'utf8'))
    : null;

  const adoption = slots.score(appRoot);
  const raw = rawValues.score(appRoot);
  const tier = tiers.score(appRoot);

  return {
    arm,
    run: Number(run),
    scoredAt: new Date().toISOString().slice(0, 19) + 'Z',
    model: harness && harness.model,
    isolation: harness && harness.isolation,
    s0Sha: harness && harness.s0Sha,
    overlaySha: harness && harness.overlaySha,

    covered: {
      slotsUsed: adoption.used,
      slotsOf: adoption.of,
      reimplemented: adoption.reimplemented,
      absent: adoption.absent,
      falsifierTriggered: adoption.falsifierTriggered,
      hallucinatedApi: null,        // scorer 2, not written
    },

    gap: {
      rawValues: raw.total,
      chromatic: raw.chromatic,
      dimensional: raw.dimensional,
      breakpoints: raw.breakpoints,
      tierCrossings: tier.crossings,
      tier1: tier.tier1,
      tier3: tier.tier3,
    },

    tokens: {
      decisionsUsed: tier.decisionsUsed,
      imports: tier.tokenImports,
      importedPublicSurface: tier.importedPublicSurface,
    },

    checks: null,                   // scorer 3, not written
    a11y: null,                     // scorer 6, not written
    build: null,                    // scorer 7, not written

    cost: harness && {
      inputTokensTotal: harness.inputTokensTotal,
      outputTokens: harness.outputTokens,
      usd: harness.result && harness.result.total_cost_usd,
      durationMs: harness.result && harness.result.duration_api_ms,
      turns: harness.result && harness.result.num_turns,
      permissionDenials: harness.result && harness.result.permission_denials,
    },

    detail: { slots: adoption.slots, rawValues: raw.detail, tiers: tier.detail },
  };
}

function write(row) {
  fs.mkdirSync(RESULTS, { recursive: true });
  const out = path.join(RESULTS, `${row.arm}-${row.run}.score.json`);
  fs.writeFileSync(out, JSON.stringify(row, null, 2) + '\n');
  return out;
}

function line(r) {
  const c = r.covered, g = r.gap;
  return [
    `${r.arm}-${r.run}`.padEnd(8),
    `slots ${c.slotsUsed}/${c.slotsOf}`.padEnd(12),
    `reimpl ${c.reimplemented}`.padEnd(10),
    `raw ${g.rawValues}`.padEnd(9),
    `crossings ${g.tierCrossings}`.padEnd(14),
    `decisions ${r.tokens.decisionsUsed}`.padEnd(15),
    r.cost && r.cost.usd ? `$${r.cost.usd.toFixed(2)}` : '',
    c.falsifierTriggered ? '  FALSIFIER' : '',
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
  process.exit(1);
}
