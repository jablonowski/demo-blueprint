#!/usr/bin/env node
'use strict';

/**
 * Does it build.
 *
 * Binary, and it gates everything else: an arm with immaculate token discipline in code
 * that never compiles has not won anything. A failed build is recorded as a failed run
 * rather than as a set of zeroes, so an arm's failure rate is visible instead of being
 * averaged into its scores.
 *
 * Runs where the application was generated, because that is where node_modules is.
 *
 *   node build.js <run-dir>
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(dir) {
  const started = Date.now();
  try {
    const out = execFileSync('npx', ['ng', 'build'], {
      cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10 * 60_000,
    });
    const bundle = /Initial total\s*\|\s*([\d.]+\s*[kM]B)/.exec(out);
    return { ok: true, durationMs: Date.now() - started, bundle: bundle && bundle[1].trim() };
  } catch (error) {
    const text = `${error.stdout || ''}${error.stderr || ''}`;
    const errors = [...text.matchAll(/^.*error (TS\d+|NG\d+).*$/gm)].map((m) => m[0].trim());
    return {
      ok: false,
      durationMs: Date.now() - started,
      errorCount: errors.length || null,
      errors: errors.slice(0, 20),
      tail: text.trim().split('\n').slice(-25).join('\n'),
    };
  }
}

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(path.join(dir, 'package.json'))) {
    console.error('  Usage: node build.js <run-dir>');
    process.exit(2);
  }
  const result = run(dir);
  process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  process.exit(result.ok ? 0 : 0); // the verdict is the JSON, not the exit code
}

module.exports = { run };
