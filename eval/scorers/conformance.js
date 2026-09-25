'use strict';

/**
 * Conformance: do the values the application committed to exist in the design system?
 *
 * This scorer exists because the A pilot broke the naive version of the thesis. With no
 * design system in the prompt, the agent did not scatter literals through the stylesheets.
 * It opened src/styles.scss with a design-system handbook comment and declared seventy
 * custom properties — a token layer of its own, internally disciplined, correctly layered.
 * Counting raw values said it had behaved well.
 *
 * It had not. The palette it declared is zinc: --color-foreground: #18181b, where the
 * system says #111111. Every one of those seventy names is a value the organisation now
 * owns twice, and the second copy is wrong in a way no eye catches in review and no build
 * catches at all. Discipline without a shared reference is a second design system.
 *
 * So the question this asks is not "did it use tokens" — tiers.js asks that — but "are the
 * values it settled on the system's values". Three verdicts, over every colour and length
 * the application authored in its own CSS, declared or scattered:
 *
 *   matched    the value exists in the design system. The drift is nominal: a rename away
 *              from conformance, and a find-and-replace fixes it
 *   divergent  no exact value, but one close enough to be indistinguishable on screen.
 *              The expensive class. It looks like the system, ships as the system, and
 *              will not move when the system moves
 *   novel      nothing near it. Either a genuine gap in the system — the honest outcome,
 *              and what arm D's no-coverage refusals produce — or a decision taken
 *              unilaterally
 *
 * Two judgements are baked in and both are arguable, so both are constants and every entry
 * carries its nearest reference value and the distance, for a reader who wants to re-judge:
 *
 *   COLOUR_TOLERANCE  24, Euclidean over sRGB. #18181b is 14.1 from #111111
 *   LENGTH_TOLERANCE  2px. 14px is 2 from the 12/16 steps of the spacing scale
 *
 * The reference is a committed snapshot of the published package (reference/ds-tokens.json),
 * not the repository next door, because the published package is what the arms installed.
 */

const rawValues = require('./raw-values');
const reference = require('../reference/ds-tokens.json');

const COLOUR_TOLERANCE = 24;
const LENGTH_TOLERANCE = 2;

const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;
const LENGTH = /(?<![\w-])(\d+(?:\.\d+)?)(px|rem|em)\b/g;
const ROOT_PX = 16;

// ─── Normalising a value to something comparable ─────────────────────────────

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

function channel(part) {
  const t = part.trim();
  if (t.endsWith('%')) return clamp(Math.round((parseFloat(t) / 100) * 255), 0, 255);
  return clamp(Math.round(parseFloat(t)), 0, 255);
}

function alpha(part) {
  if (part === undefined) return 1;
  const t = String(part).trim();
  return clamp(t.endsWith('%') ? parseFloat(t) / 100 : parseFloat(t), 0, 1);
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [r, g, b].map((v) => Math.round((v + m) * 255));
}

/** A colour literal as [r, g, b, a], or null if it is not one. */
function toRgba(value) {
  const v = String(value).trim().toLowerCase();

  if (v.startsWith('#')) {
    const hex = v.slice(1);
    const expand = (s) => parseInt(s.length === 1 ? s + s : s, 16);
    if (hex.length === 3 || hex.length === 4) {
      const p = hex.split('');
      return [expand(p[0]), expand(p[1]), expand(p[2]), p[3] ? expand(p[3]) / 255 : 1];
    }
    if (hex.length === 6 || hex.length === 8) {
      const p = hex.match(/../g);
      return [expand(p[0]), expand(p[1]), expand(p[2]), p[3] ? expand(p[3]) / 255 : 1];
    }
    return null;
  }

  const fn = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(v);
  if (!fn) return null;
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3) return null;

  if (fn[1].startsWith('rgb')) {
    return [channel(parts[0]), channel(parts[1]), channel(parts[2]), alpha(parts[3])];
  }
  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  if ([h, s, l].some(Number.isNaN)) return null;
  return [...hslToRgb(h, s, l), alpha(parts[3])];
}

/** A single length literal in px, or null. `10px 20px` is not a single length. */
function toPx(value) {
  const m = /^(\d+(?:\.\d+)?)(px|rem|em)$/.exec(String(value).trim());
  if (!m) return null;
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * ROOT_PX;
}

const rgbDistance = (a, b) =>
  Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);

// ─── The reference set ───────────────────────────────────────────────────────

/**
 * Every design scalar the system holds, attributed to the token that holds it.
 *
 * Composite values are mined rather than skipped: a shadow token carries a colour and two
 * lengths, and an application writing one of those has written a value the system owns.
 */
function buildReference(tokens) {
  const colours = [];
  const lengths = [];
  for (const [name, raw] of Object.entries(tokens)) {
    if (typeof raw !== 'string') continue;
    for (const m of raw.matchAll(COLOUR)) {
      const rgba = toRgba(m[0]);
      if (rgba) colours.push({ name, value: m[0], rgba });
    }
    for (const m of raw.matchAll(LENGTH)) {
      lengths.push({ name, value: m[0], px: toPx(m[0]) });
    }
  }
  return { colours, lengths };
}

const REFERENCE = buildReference(reference.tokens);

// ─── Classification ──────────────────────────────────────────────────────────

function classifyColour(rgba, ref) {
  let nearest = null;
  for (const candidate of ref.colours) {
    if (Math.abs(candidate.rgba[3] - rgba[3]) > 0.1) continue;
    const distance = rgbDistance(candidate.rgba, rgba);
    if (nearest === null || distance < nearest.distance) {
      nearest = { name: candidate.name, value: candidate.value, distance: Number(distance.toFixed(2)) };
    }
    if (distance === 0) break;
  }
  if (nearest && nearest.distance === 0) return { verdict: 'matched', nearest };
  if (nearest && nearest.distance <= COLOUR_TOLERANCE) return { verdict: 'divergent', nearest };
  return { verdict: 'novel', nearest };
}

function classifyLength(px, ref) {
  let nearest = null;
  for (const candidate of ref.lengths) {
    const distance = Math.abs(candidate.px - px);
    if (nearest === null || distance < nearest.distance) {
      nearest = { name: candidate.name, value: candidate.value, distance: Number(distance.toFixed(2)) };
    }
    if (distance === 0) break;
  }
  if (nearest && nearest.distance === 0) return { verdict: 'matched', nearest };
  if (nearest && nearest.distance <= LENGTH_TOLERANCE) return { verdict: 'divergent', nearest };
  return { verdict: 'novel', nearest };
}

function classify(value, ref) {
  const rgba = toRgba(value);
  if (rgba) return { kind: 'colour', ...classifyColour(rgba, ref) };
  const px = toPx(value);
  if (px !== null) return { kind: 'length', ...classifyLength(px, ref) };
  return { kind: 'unknown', verdict: 'novel', nearest: null };
}

// ─── The scorer ──────────────────────────────────────────────────────────────

function score(appRoot, ref = REFERENCE) {
  const raw = rawValues.score(appRoot).detail;

  // Breakpoints are excluded, as they are in raw-values: the token set holds no breakpoint
  // scale, so there is no reference to conform to and a finding here would be invented.
  const authored = [
    ...raw.chromatic.map((e) => ({ ...e, origin: 'scattered' })),
    ...raw.dimensional.map((e) => ({ ...e, origin: 'scattered' })),
    ...raw.declared.map((e) => ({ ...e, origin: 'declared' })),
  ];

  const buckets = { matched: [], divergent: [], novel: [] };
  for (const entry of authored) {
    const verdict = classify(entry.value, ref);
    buckets[verdict.verdict].push({
      file: entry.file,
      line: entry.line,
      value: entry.value,
      origin: entry.origin,
      kind: verdict.kind,
      nearest: verdict.nearest,
    });
  }

  const count = (bucket, origin) => bucket.filter((e) => e.origin === origin).length;

  const kindCounts = (kind) => {
    const of = (bucket) => buckets[bucket].filter((e) => e.kind === kind).length;
    const authoredOfKind = of('matched') + of('divergent') + of('novel');
    return {
      authored: authoredOfKind,
      matched: of('matched'),
      divergent: of('divergent'),
      novel: of('novel'),
      rate: authoredOfKind === 0 ? null : Number((of('matched') / authoredOfKind).toFixed(3)),
    };
  };

  return {
    authored: authored.length,
    matched: buckets.matched.length,
    divergent: buckets.divergent.length,
    novel: buckets.novel.length,
    // Null rather than 1 when nothing was authored: an application that wrote no values of
    // its own has not demonstrated conformance, it has had no occasion to fail.
    rate: authored.length === 0 ? null : Number((buckets.matched.length / authored.length).toFixed(3)),
    // Split by kind, because the two are not equally informative. The length reference is
    // dense — 223 scalars across spacing, sizing, radii, font sizes and layout widths — so
    // almost any plausible pixel value lands on one of them, and the scorer does not ask
    // whether the token it landed on is about the property it was used for. Colour is the
    // sharp signal. The looseness biases towards the application looking conformant, which
    // is the direction a claim about the design system should be wrong in.
    byKind: {
      colour: kindCounts('colour'),
      length: kindCounts('length'),
    },
    byOrigin: {
      declared: {
        matched: count(buckets.matched, 'declared'),
        divergent: count(buckets.divergent, 'declared'),
        novel: count(buckets.novel, 'declared'),
      },
      scattered: {
        matched: count(buckets.matched, 'scattered'),
        divergent: count(buckets.divergent, 'scattered'),
        novel: count(buckets.novel, 'scattered'),
      },
    },
    reference: {
      source: reference.source,
      version: reference.version,
      colours: ref.colours.length,
      lengths: ref.lengths.length,
    },
    tolerances: { colour: COLOUR_TOLERANCE, length: LENGTH_TOLERANCE },
    detail: buckets,
  };
}

module.exports = { score, toRgba, toPx, classify, buildReference, REFERENCE,
                   COLOUR_TOLERANCE, LENGTH_TOLERANCE };
