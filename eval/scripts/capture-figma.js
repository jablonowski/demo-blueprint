#!/usr/bin/env node
'use strict';

/**
 * Record what the real Figma MCP server answers, once, so every arm can be given the same
 * answer forever.
 *
 * Why this exists. Figma's /nodes endpoint carries a per-plan quota, and a single arm's run
 * empties it: round 1 on 2026-09-24 gave arm A a working channel and arms B, C and D a
 * 429 with a retry-after of 4.6 days. That is not a runda, it is four different
 * experiments. It is also unfixable by waiting, because the next round would do it again.
 *
 * So the channel is cached, and the cache is a recording of the real server rather than an
 * imitation of it. `scripts/figma-cache-mcp.js` replays these responses under the same tool
 * names, so an arm calls `get_figma_data` exactly as it would live, and the only difference
 * is that the answer is byte-identical across arms and across months.
 *
 *   node scripts/capture-figma.js
 *
 * Run it from a machine that can reach api.figma.com, with FIGMA_API_KEY in ../.env.
 *
 * Two fetch paths, and which one was used is recorded per target rather than smoothed over:
 * with a nodeId the server calls /files/{key}/nodes (the quota-limited one, and what an arm
 * actually triggers); without one it calls /files/{key} (a different bucket, usually open).
 * A capture taken through the fallback carries the same content for the same subtree, but
 * it is not the same request, and a reader is entitled to know which it was.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Pinned. An unpinned server is an unrecorded variable, and this one shapes every byte the
// arms see.
const SERVER = 'figma-developer-mcp@0.13.2';

const EVAL = path.join(__dirname, '..');
const OUT = path.join(EVAL, 'reference', 'figma', 'capture.json');
const FILE_KEY = process.env.FIGMA_FILE || 'iJ92LuFOsPjO6avZ2anbwO';

// Exactly as S0 spells them, dashes and colons included: an arm copies these out of the
// document, so these are the strings the shim will be asked for.
const TARGETS = ['22-11104', '22:11448', '22:11492'];

/** Enough to tell two tokens apart in a log, not enough to be one. */
const fingerprint = (key) =>
  key ? `${key.slice(0, 9)}…${key.slice(-4)} (len ${key.length})` : '(none)';

/**
 * The credential, and an argument about where it comes from.
 *
 * The first version of this preferred the environment and fell back to .env. Mateusz's
 * shell exports a stale FIGMA_ACCESS_TOKEN from an old session, so a curl reading .env
 * returned 200 while this script, three minutes later, got `403 Token expired` from the
 * same file key. One credential with two possible values, resolved silently by precedence
 * order, is the npm-auth bug again in a new costume.
 *
 * So: no precedence. Every source is read, and if two of them disagree the run stops and
 * names both. A measuring instrument may not quietly pick which secret it liked.
 */
function apiKey() {
  const sources = [];
  for (const name of ['FIGMA_API_KEY', 'FIGMA_ACCESS_TOKEN']) {
    if (process.env[name]) sources.push({ from: `$${name}`, key: process.env[name] });
  }
  const envFile = path.join(EVAL, '..', '.env');
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
      const m = /^FIGMA_(API_KEY|ACCESS_TOKEN)=(.*)$/.exec(line.trim());
      if (m) sources.push({ from: `.env:FIGMA_${m[1]}`, key: m[2].trim().replace(/^["']|["']$/g, '') });
    }
  }

  if (sources.length === 0) return { key: null, sources };

  const distinct = [...new Set(sources.map((s) => s.key))];
  if (distinct.length > 1) {
    console.error('  Two different Figma tokens are visible and they disagree:');
    for (const s of sources) console.error(`    ${s.from.padEnd(26)} ${fingerprint(s.key)}`);
    console.error('\n  Refusing to guess. The one in .env is the recorded source; a stale export');
    console.error('  wins over it silently and produces a 403 that reads as expiry. Clear the');
    console.error('  environment for this shell and run again:\n');
    console.error('    unset FIGMA_ACCESS_TOKEN FIGMA_API_KEY && node scripts/capture-figma.js\n');
    process.exit(1);
  }

  return { key: distinct[0], sources };
}

/** A line-delimited JSON-RPC client over the server's stdio. */
function client(key) {
  const proc = spawn('npx', ['-y', SERVER, '--stdio'], {
    env: { ...process.env, FIGMA_API_KEY: key },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  let buffer = '';
  const pending = new Map();
  const stderr = [];

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString();
    let nl;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (message.id !== undefined && pending.has(message.id)) {
        const { resolve } = pending.get(message.id);
        pending.delete(message.id);
        resolve(message);
      }
    }
  });
  proc.stderr.on('data', (c) => stderr.push(c.toString()));

  let nextId = 1;
  const send = (method, params) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve });
      proc.stdin.write(payload);
      setTimeout(() => {
        if (pending.has(id)) { pending.delete(id); reject(new Error(`${method} timed out after 120s`)); }
      }, 120000);
    });
  };
  const notify = (method, params) =>
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');

  return { send, notify, stderr, close: () => proc.kill() };
}

/** Did this response come back as an error, and what did it say? */
function failure(message) {
  if (message.error) return message.error.message || JSON.stringify(message.error);
  const result = message.result;
  if (result && result.isError) {
    const text = (result.content || []).map((c) => c.text).filter(Boolean).join(' ');
    return text || 'isError with no text';
  }
  return null;
}

async function main() {
  const { key, sources } = apiKey();
  if (!key) {
    console.error('  No FIGMA_API_KEY in the environment or in ../.env');
    process.exit(1);
  }
  // Always printed, never inferred: which credential was in play is part of what the
  // capture is.
  console.log('  token: ', fingerprint(key), '— agreed by', sources.map((s) => s.from).join(', '));

  const mcp = client(key);
  const capture = {
    server: SERVER,
    fileKey: FILE_KEY,
    capturedAt: new Date().toISOString().slice(0, 19) + 'Z',
    // Deliberately not the token's fingerprint. A prefix and four trailing characters of a
    // live credential are not needed to verify a capture, and this file is public.
    tokenSource: sources.map((x) => x.from).join(', '),
    note:
      'Recorded from the real server by scripts/capture-figma.js and replayed by ' +
      'scripts/figma-cache-mcp.js. Do not edit by hand: an edited recording makes every ' +
      'arm\'s visual truth unverifiable.',
    tools: null,
    responses: {},
  };

  const init = await mcp.send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'dsb-eval-capture', version: '1.0.0' },
  });
  if (init.error) throw new Error('initialize failed: ' + JSON.stringify(init.error));
  console.log('  server:', JSON.stringify((init.result || {}).serverInfo || {}));
  mcp.notify('notifications/initialized', {});

  const tools = await mcp.send('tools/list', {});
  capture.tools = (tools.result || {}).tools || null;
  console.log('  tools: ', (capture.tools || []).map((t) => t.name).join(', '));

  let wholeFile = null;

  for (const nodeId of TARGETS) {
    const args = { fileKey: FILE_KEY, nodeId };
    const message = await mcp.send('tools/call', { name: 'get_figma_data', arguments: args });
    const error = failure(message);
    if (!error) {
      capture.responses[nodeId] = { via: 'nodes', arguments: args, result: message.result };
      const bytes = JSON.stringify(message.result).length;
      console.log(`  ${nodeId.padEnd(10)} ok via /nodes — ${(bytes / 1024).toFixed(0)} kB`);
      continue;
    }

    console.log(`  ${nodeId.padEnd(10)} /nodes refused: ${error.slice(0, 120)}`);

    if (wholeFile === null) {
      const whole = await mcp.send('tools/call',
        { name: 'get_figma_data', arguments: { fileKey: FILE_KEY } });
      const wholeError = failure(whole);
      if (wholeError) {
        console.error(`  whole-file fallback also refused: ${wholeError.slice(0, 200)}`);
        wholeFile = false;
      } else {
        wholeFile = whole.result;
        const bytes = JSON.stringify(wholeFile).length;
        console.log(`  whole file ok — ${(bytes / 1024).toFixed(0)} kB (fallback source)`);
      }
    }

    capture.responses[nodeId] = wholeFile
      ? { via: 'whole-file-fallback', arguments: args, nodesError: error, result: wholeFile }
      : { via: 'unavailable', arguments: args, nodesError: error, result: null };
  }

  mcp.close();

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(capture, null, 1) + '\n');

  const viaCounts = {};
  for (const r of Object.values(capture.responses)) viaCounts[r.via] = (viaCounts[r.via] || 0) + 1;
  console.log('  →', OUT, JSON.stringify(viaCounts));

  if (Object.values(capture.responses).some((r) => r.via === 'unavailable')) {
    console.error('  Some targets could not be captured at all. The shim would serve nothing for them.');
    process.exit(2);
  }
}

main().catch((error) => { console.error('  ' + error.message); process.exit(1); });
