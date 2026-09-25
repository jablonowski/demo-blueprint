'use strict';

/**
 * Raw design values in the CSS the application authored.
 *
 * The headline metric. Every literal here is a value that will not move when the decision
 * behind it moves — the UI Drift Tax at the moment it is incurred.
 *
 * Not every literal is the same phenomenon, and the first version of this scorer said they
 * were. Arm D wrote:
 *
 *     :host {
 *       --app-chart-height: 160px;  /* no-coverage: chart plot area height *\/
 *     }
 *
 * having asked the resolver, been refused, and gathered the gaps into named local
 * properties "as token contributions to propose rather than scattered as literals". That
 * counted identically to `padding: 14px` buried in a rule, which is the opposite behaviour.
 *
 * So literals are separated by what they are doing:
 *
 *   scattered    a literal used directly in a declaration — the drift the metric is about
 *   declared     a literal as the value of a custom property — a local token, naming a gap
 *                rather than bypassing the system. Reported, never zero-rated: a local
 *                token is still a value the design system does not own
 *   breakpoints  media query widths. The token set has no breakpoint scale, so there is
 *                nothing to reach for; if one is ever added this bucket becomes a finding
 *
 * And two exclusions, each a claim that has to hold:
 *
 *   0 and 0-anything      no scale expresses nothing
 *   1px                   a hairline border is a rendering unit, not a design decision
 */

const path = require('path');
const { stylesheets, stripCssComments } = require('./lib/source');

// The function forms match to the closing paren, not just their prefix: the count is the
// same either way, but a truncated `rgba(0` cannot be compared against anything, and the
// conformance scorer reads these values.
const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;
const LENGTH = /(?<![\w-])(\d+(?:\.\d+)?)(px|rem|em)\b/g;

/** Is this literal the value of a custom property declaration? */
function isDeclaredToken(source, index) {
  const lineStart = source.lastIndexOf('\n', index) + 1;
  const line = source.slice(lineStart, index);
  return /(?:^|[;{])\s*--[\w-]+\s*:[^;]*$/.test(line);
}

function score(appRoot) {
  const chromatic = [];
  const dimensional = [];
  const declared = [];
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
      const entry = { file: rel, line: lineOf(source, m.index), value: m[0] };
      (isDeclaredToken(source, m.index) ? declared : chromatic).push(entry);
    }

    for (const m of source.matchAll(LENGTH)) {
      if (Number(m[1]) === 0) continue;
      if (m[0] === '1px') continue;
      if (media.includes(m.index)) continue;
      // A length inside a media condition, found by the second pass rather than the first.
      const before = source.slice(Math.max(0, m.index - 120), m.index);
      if (/@media[^{]*$/.test(before)) continue;
      const entry = { file: rel, line: lineOf(source, m.index), value: m[0] };
      (isDeclaredToken(source, m.index) ? declared : dimensional).push(entry);
    }
  }

  return {
    // The headline stays the scattered ones: those are the values that will not move when
    // the decision behind them moves.
    total: chromatic.length + dimensional.length,
    chromatic: chromatic.length,
    dimensional: dimensional.length,
    declared: declared.length,
    breakpoints: breakpoints.length,
    detail: { chromatic, dimensional, declared, breakpoints },
  };
}

const lineOf = (source, index) => source.slice(0, index).split('\n').length;

module.exports = { score };
