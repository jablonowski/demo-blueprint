'use strict';

/**
 * Scorer tests.
 *
 * A scorer that reports a wrong number is worse than no scorer, because the number gets
 * into a table and then into a book. These run against a fixture built to contain every
 * shape that has already fooled a pattern once.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const FIXTURE = path.join(__dirname, 'fixture', 'app');
const slots = require('../slots');
const rawValues = require('../raw-values');
const tiers = require('../tiers');

// ─── The regression that started this ────────────────────────────────────────

test('a multi-line tag counts as used', () => {
  const result = slots.score(FIXTURE);
  const footer = result.slots.find((s) => s.selector === 'dsb-footer');
  assert.equal(footer.verdict, 'used', 'dsb-footer is written across three lines in the fixture');
});

test('dsb-list does not swallow dsb-list-item', () => {
  const { elements } = require('../lib/source');
  const source = '<dsb-list><dsb-list-item /><dsb-list-item /></dsb-list>';
  assert.equal(elements(source, 'dsb-list'), 1);
  assert.equal(elements(source, 'dsb-list-item'), 2);
});

test('a component used in an inline template counts', () => {
  const result = slots.score(FIXTURE);
  const header = result.slots.find((s) => s.selector === 'dsb-header');
  assert.equal(header.verdict, 'used', 'dsb-header is in a template: `` string, not an .html file');
});

// ─── Reimplementation, which carries the falsifier ───────────────────────────

test('a native select in place of the dropdown is a reimplementation', () => {
  const result = slots.score(FIXTURE);
  const dropdown = result.slots.find((s) => s.selector === 'dsb-dropdown');
  assert.equal(dropdown.verdict, 'reimplemented');
  assert.equal(dropdown.defensible, true, 'slot 13 is pre-registered as the defensible one');
});

test('one defensible reimplementation does not trigger the falsifier', () => {
  // The fixture reimplements only slot 13. The falsifier needs two indefensible ones.
  assert.equal(slots.score(FIXTURE).falsifierTriggered, false);
});

// ─── Raw values ──────────────────────────────────────────────────────────────

test('hex colours and lengths are counted, hairlines and zero are not', () => {
  const result = rawValues.score(FIXTURE);
  assert.equal(result.chromatic, 2, 'one hex and one rgba() in the fixture');
  assert.equal(result.dimensional, 1, '14px counts; 1px and 0 do not');
});

test('media query widths go to their own bucket', () => {
  const result = rawValues.score(FIXTURE);
  assert.equal(result.breakpoints, 1);
  assert.ok(
    !result.detail.dimensional.some((d) => d.value === '900px'),
    'a breakpoint must not also be counted as a raw value'
  );
});

test('values inside a comment are not counted', () => {
  const result = rawValues.score(FIXTURE);
  assert.ok(
    !result.detail.chromatic.some((c) => c.value === '#deadbe'),
    'the fixture mentions #deadbe only inside a CSS comment'
  );
});

// ─── Tiers ───────────────────────────────────────────────────────────────────

test('tier 1 and tier 3 in application code are both crossings', () => {
  const result = tiers.score(FIXTURE);
  assert.equal(result.tier1, 1);
  assert.equal(result.tier3, 1);
  assert.equal(result.crossings, 2);
});

test('decision tokens are counted distinctly, not per occurrence', () => {
  const result = tiers.score(FIXTURE);
  assert.equal(result.decisionsUsed, 2, 'the fixture uses two decisions, one of them twice');
});

test('a deep import is not the public surface', () => {
  const result = tiers.score(FIXTURE);
  assert.equal(result.importedPublicSurface, false);
  assert.deepEqual(result.tokenImports, ['@jablonowski/dsb-tokens/dist/css/variables.css']);
});
