#!/usr/bin/env node
'use strict';

/**
 * Read a run's cost back out of the Claude Code session transcript.
 *
 * `run.sh` holds the agent's result in a shell variable and writes it after the measurement
 * counts. When the script died between the two, the application survived on disk and the
 * record did not — turns, tokens and cost went with the shell.
 *
 * They are not actually gone. Claude Code writes every session to
 * ~/.claude/projects/<cwd with slashes turned into dashes>/<session-id>.jsonl, and that
 * file carries per-message `usage` plus a `cost-state` line with `totalCostUSD` and
 * `modelUsage`. So the cost can be read back rather than estimated from a price list.
 *
 *   node scripts/transcript-usage.js <transcript.jsonl>
 *   node scripts/transcript-usage.js --calibrate <transcript.jsonl> <recorded-result.json>
 *
 * **Calibrate before trusting it.** Reading a number out of a log and putting it in a table
 * next to numbers that came from somewhere else is how two different quantities end up in
 * one column. The calibrate mode takes a run where both the transcript and the real record
 * exist, and prints them side by side. If they do not agree, the reconstruction is wrong
 * and the cell stays empty.
 */

const fs = require('fs');

function parse(file) {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  const out = {
    file,
    sessionId: null,
    model: null,
    lines: lines.length,
    assistantMessages: 0,
    userMessages: 0,
    inputTokens: 0,
    cacheCreation: 0,
    cacheRead: 0,
    outputTokens: 0,
    thinkingTokens: 0,
    totalCostUSD: null,
    totalDurationMs: null,
    totalApiDurationMs: null,
    startTime: null,
    hasUnknownModelCost: null,
    modelUsage: null,
  };

  for (const line of lines) {
    let j;
    try { j = JSON.parse(line); } catch { continue; }
    if (j.sessionId && !out.sessionId) out.sessionId = j.sessionId;

    if (j.type === 'assistant') {
      out.assistantMessages += 1;
      const m = j.message || {};
      if (m.model && !out.model) out.model = m.model;
      const u = m.usage;
      if (u) {
        out.inputTokens   += u.input_tokens || 0;
        out.cacheCreation += u.cache_creation_input_tokens || 0;
        out.cacheRead     += u.cache_read_input_tokens || 0;
        out.outputTokens  += u.output_tokens || 0;
        out.thinkingTokens += (u.output_tokens_details && u.output_tokens_details.thinking_tokens) || 0;
      }
    }
    if (j.type === 'user') out.userMessages += 1;

    // The session's own accounting, written once at the end.
    if (j.totalCostUSD !== undefined) {
      out.totalCostUSD = j.totalCostUSD;
      out.totalDurationMs = j.totalDuration ?? null;
      out.totalApiDurationMs = j.totalAPIDuration ?? null;
      out.startTime = j.startTime ?? null;
      out.hasUnknownModelCost = j.hasUnknownModelCost ?? null;
      out.modelUsage = j.modelUsage ?? null;
    }
  }

  out.inputTokensTotal = out.inputTokens + out.cacheCreation + out.cacheRead;
  return out;
}

function calibrate(transcript, recordFile) {
  const t = parse(transcript);
  const r = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
  const res = r.result || {};
  const u = res.usage || {};
  const recordedIn = (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0);

  const rows = [
    ['session id',   t.sessionId,          res.session_id],
    ['model',        t.model,              r.model],
    ['cost USD',     t.totalCostUSD,       res.total_cost_usd],
    ['output tokens', t.outputTokens,      u.output_tokens],
    ['input total',  t.inputTokensTotal,   recordedIn],
    ['turns',        t.assistantMessages,  res.num_turns],
  ];

  // A calibration against a run that never started compares zero with zero and reports
  // agreement. That is a check passing on emptiness, which is the failure this whole
  // project keeps finding, so it is refused rather than reported.
  if (!t.outputTokens && !res.total_cost_usd) {
    console.log('  VACUOUS — this run produced nothing (0 tokens, 0 cost) on both sides.');
    console.log('  Comparing zero with zero proves nothing. Calibrate against a run that ran.');
    return;
  }

  console.log('  ' + 'field'.padEnd(15) + 'from transcript'.padEnd(26) + 'from the record');
  console.log('  ' + '-'.repeat(72));
  for (const [name, a, b] of rows) {
    const missing = a === null || a === undefined || b === null || b === undefined;
    const mark = missing ? ' ?' : String(a) === String(b) ? ' ✓' : ' ✗';
    const left = String(a).length > 24 ? String(a).slice(0, 12) + '…' : String(a);
    const right = String(b).length > 24 ? String(b).slice(0, 12) + '…' : String(b);
    console.log('  ' + name.padEnd(15) + left.padEnd(26) + right + mark);
  }
  console.log('');
  console.log('  ✓ means the transcript reproduces the recorded value and can stand in for it.');
  console.log('  ✗ on cost or tokens means the reconstruction is wrong and the cell stays empty.');
  console.log('  ✗ on turns alone is expected if num_turns counts something other than assistant');
  console.log('    messages — then report the transcript count under its own name, never as turns.');
}

/** Calibrate across every run that has both a transcript and a record. */
function calibrateAll(projectsDir, resultsDir) {
  const path = require('path');
  let checked = 0, costAgrees = 0;
  for (const file of fs.readdirSync(resultsDir).filter((f) => f.endsWith('.json') && !f.includes('.score.'))) {
    const record = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
    const res = record.result || {};
    if (!res.session_id || !res.total_cost_usd) continue;

    let found = null;
    for (const dir of fs.readdirSync(projectsDir)) {
      const candidate = path.join(projectsDir, dir, res.session_id + '.jsonl');
      if (fs.existsSync(candidate)) { found = candidate; break; }
    }
    if (!found) { console.log('  ' + file.padEnd(12) + 'no transcript on disk'); continue; }

    const t = parse(found);
    const same = t.totalCostUSD === res.total_cost_usd;
    checked += 1; if (same) costAgrees += 1;
    console.log('  ' + file.replace('.json', '').padEnd(12) +
      'cost ' + String(t.totalCostUSD).padEnd(22) + 'vs ' + String(res.total_cost_usd).padEnd(22) +
      (same ? '✓' : '✗') +
      '   tokens ' + (t.outputTokens === (res.usage || {}).output_tokens ? '✓' : '✗'));
  }
  console.log('');
  console.log(`  cost reproduced exactly in ${costAgrees} of ${checked} runs that have both.`);
  if (checked && costAgrees === checked) {
    console.log('  Cost may be read from a transcript. Tokens and turns may not — they count');
    console.log('  sidechains and every API block, which the record does not.');
  }
}

const args = process.argv.slice(2);
if (args[0] === '--calibrate-all' && args.length === 3) { calibrateAll(args[1], args[2]); process.exit(0); }
if (args[0] === '--calibrate' && args.length === 3) calibrate(args[1], args[2]);
else if (args.length === 1) console.log(JSON.stringify(parse(args[0]), null, 2));
else {
  console.error('  Usage: node scripts/transcript-usage.js <transcript.jsonl>');
  console.error('         node scripts/transcript-usage.js --calibrate <transcript.jsonl> <result.json>');
  process.exit(2);
}
