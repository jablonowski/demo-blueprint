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
  const result = slots.score(FIXTURE, 'D');
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
  const result = slots.score(FIXTURE, 'D');
  const header = result.slots.find((s) => s.selector === 'dsb-header');
  assert.equal(header.verdict, 'used', 'dsb-header is in a template: `` string, not an .html file');
});

// ─── Reimplementation, which carries the falsifier ───────────────────────────

test('a native select in place of the dropdown is a reimplementation', () => {
  const result = slots.score(FIXTURE, 'D');
  const dropdown = result.slots.find((s) => s.selector === 'dsb-dropdown');
  assert.equal(dropdown.verdict, 'reimplemented');
  assert.equal(dropdown.defensible, true, 'slot 13 is pre-registered as the defensible one');
});

test('one defensible reimplementation does not trigger the falsifier', () => {
  // The fixture reimplements only slot 13. The falsifier needs two indefensible ones.
  assert.equal(slots.score(FIXTURE, 'D').falsifierTriggered, false);
});

test('the checks are not applied to an arm that had no library', () => {
  // The eight checks are all about the library's API. Arm A declaring its own FooterColumn
  // with a title field is correct for arm A, and the first version scored it as a failure.
  const result = checks.score(BAD, 'A');
  assert.equal(result.applicable, false);
  assert.equal(result.na, result.of);
  assert.equal(result.failed, 0);
});

test('the falsifier is not evaluated for an arm that had no library', () => {
  // Arm A hand-builds all thirteen because there is nothing to decline. Printing FALSIFIER
  // against the baseline would make the control look like a failure of the thing it is the
  // control for.
  const result = slots.score(FIXTURE, 'A');
  assert.equal(result.falsifierTriggered, null);
  assert.equal(result.hadLibrary, false);
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

// ─── Hallucinated API ────────────────────────────────────────────────────────

const api = require('../api');

test('an attribute the component does not declare is a hallucination', () => {
  const result = api.score(FIXTURE);
  const bad = result.detail.unknownProps.find((p) => p.attribute === 'color');
  assert.ok(bad, 'dsb-tag has variant and size, not color');
  assert.equal(bad.selector, 'dsb-tag');
});

test('a native DOM event on a component is not a hallucination', () => {
  // The first version of this scorer reported twelve of these in the pilot, every one a
  // (click) on a dsb-button. A scorer that invents the finding is worse than no scorer.
  const result = api.score(FIXTURE);
  assert.ok(!result.detail.unknownProps.some((p) => p.attribute === 'click'));
  assert.ok(!result.detail.unknownProps.some((p) => p.attribute === 'disabled'),
    'disabled is a real prop on dsb-button');
});

test('an import the package does not export is a hallucination', () => {
  const result = api.score(FIXTURE);
  assert.ok(result.detail.unknownImports.some((i) => i.name === 'DsbButtonComponent'),
    'the Dsb prefix does not exist');
});

test('a type export that is not a component is not a hallucination', () => {
  // contracts.json lists 16 components. The package also exports FooterColumn, NavItem,
  // TagVariant, DropdownOption and ColumnDefDirective, and checking imports against the
  // component list alone reported all seven of the pilot's valid type imports as invented.
  const result = api.score(FIXTURE);
  for (const name of ['TagComponent', 'FooterColumn']) {
    assert.ok(!result.detail.unknownImports.some((i) => i.name === name), `${name} is exported`);
  }
});

test('an attribute value containing > does not end the tag early', () => {
  const tags = api.openingTags('<dsb-button [disabled]="a > b" variant="primary">x</dsb-button>', 'dsb-button');
  assert.deepEqual(tags[0].attrs, ['disabled', 'variant']);
});

// ─── The nine checks, proven in both directions ──────────────────────────────

const checks = require('../checks');
const BAD = path.join(__dirname, 'fixture', 'bad');

test('every check fails on a fixture built to fail it', () => {
  // A scorer that only ever returns pass is indistinguishable from one that is broken.
  const by = Object.fromEntries(checks.score(BAD, 'D').results.map((r) => [r.id, r]));

  assert.equal(by['9.1'].verdict, 'fail', 'DsbHeaderComponent does not exist');
  assert.equal(by['9.2'].verdict, 'fail', 'let-row without ="row" binds the cell value');
  assert.equal(by['9.3'].verdict, 'fail', 'content projected into a slotless dsb-header');
  assert.equal(by['9.4'].verdict, 'fail', 'FooterColumn declared with title instead of heading');
  assert.equal(by['9.5'].verdict, 'fail', 'title input and [modal-title] slot together');
  assert.equal(by['9.7'].verdict, 'fail', 'dsb-dropdown inside the right-edge profile menu');
  assert.equal(by['standalone'].verdict, 'fail', 'components used without being imported');
});

test('9.6 fails when a split footer has no flex:1', () => {
  const by = Object.fromEntries(checks.score(BAD, 'D').results.map((r) => [r.id, r]));
  assert.equal(by['9.6'].verdict, 'fail');
});

test('a check reports na rather than pass when the thing was never built', () => {
  // Never built and got right are different results, and collapsing them would let an arm
  // score well by omitting work.
  const empty = path.join(__dirname, 'fixture', 'empty');
  require('fs').mkdirSync(empty, { recursive: true });
  const by = Object.fromEntries(checks.score(empty, 'D').results.map((r) => [r.id, r]));
  assert.equal(by['9.2'].verdict, 'na');
  assert.equal(by['9.3'].verdict, 'na');
  assert.equal(by['standalone'].verdict, 'na');
});
