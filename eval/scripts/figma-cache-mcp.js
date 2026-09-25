#!/usr/bin/env node
'use strict';

/**
 * The Figma channel, served from a recording.
 *
 * Every arm in this evaluation treats the Figma frames as the visual truth, and for one
 * round that was not true of any arm but the first: Figma's /nodes endpoint carries a
 * per-plan quota that a single run empties, with a retry-after of 4.6 days. Arm A saw the
 * design; B, C and D got a 429. Five arms, two conditions, one table — worthless.
 *
 * So the channel is a recording of the real server (`scripts/capture-figma.js`), pruned to
 * what each arm is entitled to (`scripts/prune-figma-capture.js`) and replayed here under
 * the same tool names and the same input schemas. An arm calls `get_figma_data` exactly as
 * it would live. What changes is that the answer is byte-identical across arms, across
 * rounds and across months, and costs nothing.
 *
 * The server identifies itself as `0.13.2+cached`. Not `0.13.2`, because that would be
 * false; not a banner announcing a cache, because an instruction to the agent about the
 * nature of its tools is a variable this experiment did not mean to introduce. The
 * arrangement is documented in PROTOCOL.md, which is where a reader looks.
 *
 * Every call is appended to $FIGMA_CACHE_LOG as JSON lines, which is how a run records
 * whether its arm actually used the design data and what it asked for — a question the
 * harness could not answer before, and guessed at with a probe.
 */

const fs = require('fs');
const path = require('path');

const SERVED = path.join(__dirname, '..', 'reference', 'figma', 'served.json');
const LOG = process.env.FIGMA_CACHE_LOG || '';
const INDENT_STEP = 2;

const served = JSON.parse(fs.readFileSync(SERVED, 'utf8'));

// The depth parameter is honoured by cutting the tree at a relative indent, which assumes
// the payload indents by two spaces per level. Asserted rather than believed: silently
// ignoring a parameter an agent passed is its own small lie.
const DEPTH_SUPPORTED = Object.values(served.nodes).every((n) => {
  const indents = n.text.split('\n').filter((l) => l.trim()).map((l) => l.match(/^\s*/)[0].length);
  return indents.every((i) => i % INDENT_STEP === 0);
});

const normalise = (id) => String(id).trim().replace(/-/g, ':');

function log(entry) {
  if (!LOG) return;
  try {
    fs.appendFileSync(LOG, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
  } catch { /* a log that cannot be written must not take the run with it */ }
}

function truncate(text, depth) {
  if (!depth || !DEPTH_SUPPORTED) return text;
  const lines = text.split('\n');
  const nodesAt = lines.findIndex((l) => l.trim() === 'NODES:');
  if (nodesAt < 0) return text;
  const head = lines.slice(0, nodesAt + 1);
  const body = lines.slice(nodesAt + 1)
    .filter((l) => !l.trim() || l.match(/^\s*/)[0].length <= (depth - 1) * INDENT_STEP);
  return [...head, ...body].join('\n');
}

const ok = (text) => ({ content: [{ type: 'text', text }] });
const fail = (text) => ({ content: [{ type: 'text', text }], isError: true });

function getFigmaData(args = {}) {
  const { fileKey, nodeId, depth } = args;

  if (fileKey && fileKey !== served.fileKey) {
    return fail(`Error fetching file: this session serves only file ${served.fileKey}.`);
  }

  // No nodeId means "the file". For this evaluation the file is the Demo canvas: the other
  // canvases hold the design system's own component library, which arm A is defined by not
  // having.
  const id = normalise(nodeId || '22:11104');
  const entry = served.nodes[id];
  if (!entry) {
    const available = Object.keys(served.nodes).join(', ');
    return fail(`Error fetching file: node ${id} is not part of this design. Available: ${available}.`);
  }

  return ok(truncate(entry.text, depth));
}

function downloadFigmaImages(args = {}) {
  // Rendered images are a separate Figma endpoint with a separate quota and were not
  // recorded. Saying so is the honest answer; pretending to have written files would put
  // paths into the generated app that point at nothing.
  return fail(
    'Error downloading images: image rendering is not available in this session. ' +
    'The design data from get_figma_data carries layout, styling and text content; ' +
    'build from that.'
  );
}

const TOOLS = {
  get_figma_data: getFigmaData,
  download_figma_images: downloadFigmaImages,
};

function handle(message) {
  const { id, method, params } = message;
  const reply = (result) => ({ jsonrpc: '2.0', id, result });

  if (method === 'initialize') {
    return reply({
      protocolVersion: (params && params.protocolVersion) || '2024-11-05',
      capabilities: { tools: {} },
      serverInfo: { name: 'Figma MCP Server', version: '0.13.2+cached' },
    });
  }

  if (method === 'tools/list') return reply({ tools: served.tools || [] });

  if (method === 'tools/call') {
    const name = params && params.name;
    const args = (params && params.arguments) || {};
    const tool = TOOLS[name];
    if (!tool) {
      log({ tool: name, args, ok: false, why: 'unknown tool' });
      return { jsonrpc: '2.0', id, error: { code: -32601, message: `Unknown tool: ${name}` } };
    }
    const result = tool(args);
    const bytes = JSON.stringify(result).length;
    log({ tool: name, args, ok: !result.isError, bytes });
    return reply(result);
  }

  if (method === 'ping') return reply({});
  if (typeof method === 'string' && method.startsWith('notifications/')) return null;

  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

let buffer = '';
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString();
  let nl;
  while ((nl = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, nl).trim();
    buffer = buffer.slice(nl + 1);
    if (!line) continue;
    let message;
    try { message = JSON.parse(line); } catch { continue; }
    let response;
    try { response = handle(message); }
    catch (error) {
      response = { jsonrpc: '2.0', id: message.id, error: { code: -32603, message: error.message } };
    }
    if (response && message.id !== undefined) process.stdout.write(JSON.stringify(response) + '\n');
  }
});
process.stdin.on('end', () => process.exit(0));
