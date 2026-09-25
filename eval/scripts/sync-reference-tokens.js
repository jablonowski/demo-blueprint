#!/usr/bin/env node
'use strict';

/**
 * Snapshot the design system's token values for the conformance scorer.
 *
 * The conformance scorer asks whether a value the application wrote exists in the design
 * system. That needs the system's values, and it has to be the same set every time a run
 * is scored — not whatever happens to be checked out in the sibling repository on the day
 * the scoring is run. So the values are committed here, and this script is how they move.
 *
 * The source is the published package, because the published package is what arms B, C and
 * D installed. The working tree next door is not the system the agents saw.
 *
 *   node scripts/sync-reference-tokens.js 1.0.10
 *
 * It refuses to write a snapshot it cannot corroborate. Every tier 2 name it derives from
 * the JSON must appear in the package's own public.css carrying the same value. The
 * derivation — path segments joined and kebab-cased behind `--ds-` — is an assumption about
 * a Style Dictionary transform, and an unchecked assumption inside a measuring instrument
 * is exactly how a confident wrong number gets into a table.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const PACKAGE = '@jablonowski/dsb-tokens';
const OUT = path.join(__dirname, '..', 'reference', 'ds-tokens.json');
const MIN_TIER2_CORROBORATED = 100;

const cssName = (parts) =>
  '--ds-' +
  parts.map((p) => p.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()).join('-');

function flatten(tree) {
  const out = [];
  (function walk(node, parts) {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'comment') continue;
      if (value && typeof value === 'object') walk(value, [...parts, key]);
      else out.push({ path: [...parts, key], name: cssName([...parts, key]), value });
    }
  })(tree, []);
  return out;
}

/** `--name: value;` pairs from a built stylesheet. References are skipped, not resolved. */
function declarationsIn(css) {
  const map = new Map();
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(m[1], m[2].trim());
  }
  return map;
}

function fetchPackage(version) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-tokens-'));
  const out = execFileSync('npm', ['pack', `${PACKAGE}@${version}`, '--pack-destination', tmp], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  const tarball = path.join(tmp, out.trim().split('\n').pop().trim());
  execFileSync('tar', ['-xzf', tarball, '-C', tmp]);
  return path.join(tmp, 'package');
}

function main() {
  const requested = process.argv[2] || 'latest';
  const root = fetchPackage(requested);

  const meta = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const tree = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'json', 'tokens.json'), 'utf8'));
  const publicCss = fs.readFileSync(path.join(root, 'dist', 'css', 'public.css'), 'utf8');

  const leaves = flatten(tree);
  const declared = declarationsIn(publicCss);

  // Corroboration. Tier 2 is emitted as literals in the public stylesheet, so every derived
  // tier 2 name must be there, with the value the JSON claims.
  const mismatched = [];
  let corroborated = 0;
  for (const leaf of leaves) {
    if (leaf.path[0] !== 'decisions') continue;
    const inCss = declared.get(leaf.name);
    if (inCss === undefined) mismatched.push({ name: leaf.name, reason: 'absent from public.css' });
    else if (inCss !== String(leaf.value))
      mismatched.push({ name: leaf.name, reason: `public.css says ${inCss}, json says ${leaf.value}` });
    else corroborated += 1;
  }

  if (mismatched.length > 0) {
    console.error(`  refusing to write: ${mismatched.length} derived names do not corroborate`);
    for (const m of mismatched.slice(0, 10)) console.error(`    ${m.name} — ${m.reason}`);
    process.exit(1);
  }
  if (corroborated < MIN_TIER2_CORROBORATED) {
    console.error(`  refusing to write: only ${corroborated} tier 2 names corroborated, expected at least ${MIN_TIER2_CORROBORATED}`);
    console.error('  the name derivation probably no longer matches the build');
    process.exit(1);
  }

  const tokens = {};
  for (const leaf of leaves) tokens[leaf.name] = leaf.value;

  const snapshot = {
    source: PACKAGE,
    version: meta.version,
    requested,
    generatedAt: new Date().toISOString().slice(0, 19) + 'Z',
    leafCount: leaves.length,
    tier2CorroboratedAgainstPublicCss: corroborated,
    note:
      'Written by scripts/sync-reference-tokens.js from the published package, which is what ' +
      'arms B, C and D installed. Do not edit by hand: the conformance scorer reads it, and a ' +
      'hand-edited reference makes every conformance number unfalsifiable.',
    tokens,
  };

  fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`  ${PACKAGE}@${meta.version} — ${leaves.length} tokens, ${corroborated} tier 2 corroborated`);
  console.log(`  → ${OUT}`);
}

main();
