'use strict';

/**
 * Raw design values in the CSS the application authored.
 *
 * The headline metric. Every literal here is a value that will not move when the decision
 * behind it moves — the UI Drift Tax at the moment it is incurred.
 *
 * Three things are excluded, and each exclusion is a claim that has to hold:
 *
 *   0 and 0-anything      no scale expresses nothing
 *   1px                   a hairline border is a rendering unit, not a design decision
 *   media query widths    the token set has no breakpoint scale, so there is nothing to
 *                         reach for. Counted separately rather than silently dropped: if a
 *                         breakpoint scale is ever added, this bucket becomes a finding
 */

const path = require('path');
const { stylesheets, stripCssComments } = require('./lib/source');

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\(\s*\d|\bhsla?\(\s*\d/g;
const LENGTH = /(?<![\w-])(\d+(?:\.\d+)?)(px|rem|em)\b/g;

function score(appRoot) {
  const chromatic = [];
  const dimensional = [];
  const breakpoints = [];

  for (const sheet of stylesheets(appRoot)) {
    const rel = path.relative(appRoot, sheet.file);
    const source = stripCssComments(sheet.source);

    // Media conditions first, so their lengths are attributed to the right bucket.
    const media = [];
    for (const m of source.matchAll(/@media[^{]+\{/g)) {
      for (const v of m[0].matchAll(LENGTH)) {
        breakpoints.push({ file: rel, value: v[0] });
        media.push(m.index + v.index);
      }
    }

    for (const m of source.matchAll(COLOUR)) {
      chromatic.push({ file: rel, line: lineOf(source, m.index), value: m[0] });
    }

    for (const m of source.matchAll(LENGTH)) {
      if (Number(m[1]) === 0) continue;
      if (m[0] === '1px') continue;
      if (media.includes(m.index)) continue;
      // A length inside a media condition, found by the second pass rather than the first.
      const before = source.slice(Math.max(0, m.index - 120), m.index);
      if (/@media[^{]*$/.test(before)) continue;
      dimensional.push({ file: rel, line: lineOf(source, m.index), value: m[0] });
    }
  }

  return {
    total: chromatic.length + dimensional.length,
    chromatic: chromatic.length,
    dimensional: dimensional.length,
    breakpoints: breakpoints.length,
    detail: { chromatic, dimensional, breakpoints },
  };
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

module.exports = { score };
