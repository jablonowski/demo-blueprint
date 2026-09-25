#!/usr/bin/env node
'use strict';

/**
 * Cut the captured Figma payload down to what an arm is entitled to see.
 *
 * The capture had to be taken through the whole-file fallback, because the /nodes endpoint
 * is rate-limited for days on this plan. A whole-file payload carries all three canvases:
 *
 *   [CANVAS] "🧩 Components"                 — the design system's own component library
 *   [CANVAS] "🎯 Design Tokens (reference)"  — the token scale, drawn
 *   [CANVAS] "🖥 Demo"                        — the four screens S0 describes
 *
 * Serving that whole thing would hand arm A the component library it is defined by not
 * having, and hand every arm a token reference that only C and D are supposed to reach.
 * It is the llms.client.txt problem again, in a different file. So the payload is pruned to
 * the node that was asked for, which is also what the live /nodes call would have returned.
 *
 * The output format is the server's own: NAME, GLOBAL_VARS, ELEMENTS, NODES. The first
 * three are shared tables that the node tree references by id, so they are garbage
 * collected against the retained subtree rather than copied wholesale — an unreferenced
 * `EL-` template from the Components canvas still carries its text and its layout.
 *
 *   node scripts/prune-figma-capture.js
 */

const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'reference', 'figma');
const CAPTURE = path.join(DIR, 'capture.json');
const OUT = path.join(DIR, 'served.json');

/** S0 writes 22-11104; the payload writes #22:11104. One node, two spellings. */
const normalise = (id) => String(id).trim().replace(/-/g, ':');

const indentOf = (line) => line.match(/^\s*/)[0].length;

/** The three sections, split apart. */
function sections(text) {
  const lines = text.split('\n');
  const at = (name) => lines.findIndex((l) => l.trim() === name);
  const gv = at('GLOBAL_VARS:');
  const el = at('ELEMENTS:');
  const nd = at('NODES:');
  if (gv < 0 || el < 0 || nd < 0) throw new Error('payload is not in the expected NAME/GLOBAL_VARS/ELEMENTS/NODES shape');
  return {
    head: lines.slice(0, gv),
    globalVars: lines.slice(gv + 1, el),
    elements: lines.slice(el + 1, nd),
    nodes: lines.slice(nd + 1),
  };
}

/** The block a top-level key opens, up to the next key at the same or lower indent. */
function blocks(lines) {
  const out = new Map();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() || indentOf(line) !== 0) continue;
    const key = line.replace(/:\s*$/, '').trim();
    let j = i + 1;
    while (j < lines.length && (!lines[j].trim() || indentOf(lines[j]) > 0)) j++;
    out.set(key, lines.slice(i, j));
    i = j - 1;
  }
  return out;
}

/** The subtree rooted at the node carrying this id. */
function subtree(nodeLines, nodeId) {
  const marker = '#' + nodeId;
  const start = nodeLines.findIndex((l) => l.includes(marker));
  if (start < 0) return null;
  const base = indentOf(nodeLines[start]);
  let end = start + 1;
  while (end < nodeLines.length && (!nodeLines[end].trim() || indentOf(nodeLines[end]) > base)) end++;
  // Re-anchored to column zero, as a scoped response would arrive.
  return nodeLines.slice(start, end).map((l) => (l.length >= base ? l.slice(base) : l));
}

/** Every GLOBAL_VARS / ELEMENTS id the given lines mention. */
const idsIn = (lines) =>
  new Set((lines.join('\n').match(/\b(?:EL|fill|layout|style|effect|stroke|text)[-_][0-9a-f]{6,}\b/g) || []));

function main() {
  const capture = JSON.parse(fs.readFileSync(CAPTURE, 'utf8'));
  const served = {
    source: path.basename(CAPTURE),
    server: capture.server,
    fileKey: capture.fileKey,
    capturedAt: capture.capturedAt,
    prunedAt: new Date().toISOString().slice(0, 19) + 'Z',
    note:
      'Pruned from the capture by scripts/prune-figma-capture.js and served by ' +
      'scripts/figma-cache-mcp.js. Each entry is the subtree for one node, with the shared ' +
      'tables garbage collected against it, so no arm can see the Components canvas or the ' +
      'token reference canvas through this channel.',
    tools: capture.tools,
    nodes: {},
  };

  for (const [asked, entry] of Object.entries(capture.responses)) {
    if (!entry.result) { console.log(`  ${asked.padEnd(10)} skipped — nothing captured`); continue; }

    const text = (entry.result.content || []).map((c) => c.text).filter(Boolean).join('\n');
    const { head, globalVars, elements, nodes } = sections(text);

    const id = normalise(asked);
    const slice = subtree(nodes, id);
    if (!slice) { console.error(`  ${asked.padEnd(10)} node ${id} is not in the captured payload`); process.exitCode = 2; continue; }

    // Garbage collect the shared tables: start from the subtree's references, then follow
    // references out of each retained definition until nothing new appears.
    const elementBlocks = blocks(elements);
    const varBlocks = blocks(globalVars);
    const wanted = idsIn(slice);
    for (let changed = true; changed; ) {
      changed = false;
      for (const id of [...wanted]) {
        const block = elementBlocks.get(id) || varBlocks.get(id);
        if (!block) continue;
        for (const ref of idsIn(block)) if (!wanted.has(ref)) { wanted.add(ref); changed = true; }
      }
    }

    const keep = (map) => [...map.entries()].filter(([k]) => wanted.has(k)).flatMap(([, v]) => v);
    const keptVars = keep(varBlocks);
    const keptElements = keep(elementBlocks);

    const rebuilt = [
      ...head,
      'GLOBAL_VARS:', ...keptVars,
      '', 'ELEMENTS:', ...keptElements,
      '', 'NODES:', ...slice,
    ].join('\n');

    served.nodes[id] = {
      askedAs: asked,
      via: entry.via,
      nodesError: entry.nodesError,
      text: rebuilt,
    };

    console.log(
      `  ${asked.padEnd(10)} ${String(slice.length).padStart(4)} node lines, ` +
      `${keptVars.length} var lines (of ${globalVars.length}), ` +
      `${keptElements.length} element lines (of ${elements.length}) — ` +
      `${(rebuilt.length / 1024).toFixed(0)} kB of ${(text.length / 1024).toFixed(0)} kB`
    );

    for (const forbidden of ['🧩 Components', 'Design Tokens (reference)']) {
      if (rebuilt.includes(forbidden)) {
        console.error(`  REFUSING: "${forbidden}" survived the prune for ${asked}`);
        process.exitCode = 3;
      }
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(served, null, 1) + '\n');
  console.log('  →', OUT);
}

main();
