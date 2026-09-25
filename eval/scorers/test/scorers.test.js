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
  assert.equal(result.chromatic, 3, 'one hex and one rgba() in the component, one in styles');
  assert.equal(result.dimensional, 2, '14px twice; 1px and 0 do not count');
});

test('a literal declared as a custom property is a local token, not a scattered value', () => {
  // Arm D asked the resolver, was refused, and gathered the gaps into named properties
  // "as token contributions to propose rather than scattered as literals". Counting that
  // identically to padding:14px buried in a rule measures the opposite of what happened.
  const result = rawValues.score(FIXTURE);
  assert.equal(result.declared, 2, '--app-chart-height and --app-accent');
  assert.ok(result.detail.declared.some((d) => d.value === '160px'));
  assert.ok(result.detail.declared.some((d) => d.value === '#ff00aa'));
  assert.ok(!result.detail.dimensional.some((d) => d.value === '160px'),
    'a declared value must not also be counted as scattered');
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

// ─── Conformance, proven in both directions ──────────────────────────────────

const conformance = require('../conformance');
const CONFORM = path.join(__dirname, 'fixture', 'conformance');

// A reference of two tokens, so the expected verdicts can be reasoned about by hand. The
// committed snapshot is exercised separately, below.
const TWO = conformance.buildReference({ '--t-ink': '#111111', '--t-space-3': '12px' });

test('a value the system holds is matched, not merely counted as raw', () => {
  const result = conformance.score(CONFORM, TWO);
  const exact = result.detail.matched.map((e) => e.value).sort();
  assert.deepEqual(exact, ['#111111', '#111111', '12px'],
    'the declared #111111, the one in the border shorthand, and the 12px');
});

test('a near miss is divergent and names what it nearly is', () => {
  // The finding the scorer exists for: internally disciplined, externally wrong.
  const result = conformance.score(CONFORM, TWO);
  const zinc = result.detail.divergent.find((e) => e.value === '#18181b');
  assert.ok(zinc, '#18181b is 14.07 from #111111 and must not read as conformant');
  assert.equal(zinc.nearest.name, '--t-ink');
  assert.equal(zinc.nearest.distance, 14.07);
  assert.ok(result.detail.divergent.some((e) => e.value === '14px'),
    '14px is 2 from the 12px step, inside the length tolerance');
});

test('a value nothing in the system is near is novel, not divergent', () => {
  // Arm D's no-coverage gaps land here, and calling them near misses would read the most
  // honest behaviour in the experiment as the least.
  const result = conformance.score(CONFORM, TWO);
  const values = result.detail.novel.map((e) => e.value).sort();
  assert.deepEqual(values, ['#ff00aa', '137px']);
});

test('conformance keeps the distinction between a declared token and a scattered literal', () => {
  const result = conformance.score(CONFORM, TWO);
  assert.equal(result.authored, 7, 'four declared, plus the border colour and two lengths');
  assert.deepEqual(result.byOrigin.declared, { matched: 2, divergent: 1, novel: 1 });
  assert.deepEqual(result.byOrigin.scattered, { matched: 1, divergent: 1, novel: 1 });
});

test('colour and length are reported apart', () => {
  const result = conformance.score(CONFORM, TWO);
  assert.equal(result.byKind.colour.authored, 4);
  assert.equal(result.byKind.length.authored, 3);
});

test('an application that authored nothing has a null rate, not a perfect one', () => {
  // Arm C wrote no values of its own. That is not 100% conformance, it is no occasion to
  // fail, and a 1.0 in that cell would be the flattering reading of an absence.
  const empty = path.join(__dirname, 'fixture', 'empty');
  require('fs').mkdirSync(empty, { recursive: true });
  const result = conformance.score(empty, TWO);
  assert.equal(result.authored, 0);
  assert.equal(result.rate, null);
});

test('colour notation does not change the verdict', () => {
  const white = conformance.buildReference({ '--t-paper': '#ffffff' });
  for (const spelling of ['#fff', '#ffffff', 'rgb(255, 255, 255)', 'rgb(255 255 255 / 1)', 'hsl(0 0% 100%)']) {
    assert.equal(conformance.classify(spelling, white).verdict, 'matched', spelling);
  }
  assert.equal(conformance.toPx('1rem'), 16, 'rem resolves against a 16px root');
  assert.equal(conformance.toPx('10px 20px'), null, 'a shorthand is not a single length');
});

test('a transparency is not matched to the opaque colour it is made of', () => {
  const ink = conformance.buildReference({ '--t-ink': '#111111' });
  assert.equal(conformance.classify('rgba(17, 17, 17, 0.4)', ink).verdict, 'novel');
});

test('the committed reference is the published package, and holds the values it should', () => {
  // If a snapshot is regenerated and the name derivation has drifted, every conformance
  // number silently changes. This pins the two ends of it.
  const snapshot = require('../../reference/ds-tokens.json');
  assert.equal(snapshot.source, '@jablonowski/dsb-tokens');
  assert.ok(snapshot.leafCount > 400, `only ${snapshot.leafCount} tokens in the snapshot`);
  assert.equal(snapshot.tokens['--ds-decisions-color-text-primary'], '#111111');
  assert.equal(conformance.classify('#18181b', conformance.REFERENCE).verdict, 'divergent',
    'zinc-950 against the real system');
  assert.equal(conformance.classify('#111111', conformance.REFERENCE).verdict, 'matched');
});

// ─── Refusing to score a run that did not happen ─────────────────────────────

const { voidReason } = require('../void');

test('a run the API aborted is void, not a bad run', () => {
  // C-1 was cut off by a 429 at turn 22 and scored as slots 10/13, checks 5/8, BROKEN —
  // a row that reads as arm C underperforming. It is no observation at all.
  const reason = voidReason({ result: { is_error: true, api_error_status: 429,
    result: "You've hit your session limit" } });
  assert.match(reason, /429/);
  assert.match(reason, /session limit/);
});

test('a run denied a tool its arm is defined by is void', () => {
  const reason = voidReason({ result: { permission_denials: [
    { tool_name: 'mcp__dsb-tokens__resolve_token' },
    { tool_name: 'mcp__dsb-tokens__resolve_token' }] } });
  assert.match(reason, /resolve_token/);
  assert.doesNotMatch(reason, /resolve_token.*resolve_token/, 'names are de-duplicated');
});

test('a run whose record explains its denials is scored', () => {
  // C-0: the denials are what make it an arm C run. The exception is in the record, not
  // inferred by the scorer, so it can be audited.
  const reason = voidReason({
    scoring: { ignoreDenials: true, why: 'reclassified' },
    result: { permission_denials: [{ tool_name: 'mcp__dsb-tokens__resolve_token' }] },
  });
  assert.equal(reason, null);
});

test('a clean run is not void, and a missing record is', () => {
  assert.equal(voidReason({ result: { is_error: false, permission_denials: [] } }), null);
  assert.match(voidReason(null), /no harness record/);
});

test('a run without a serviceable Figma channel is void', () => {
  // Eight runs passed a preflight that asserted the token was present, not that it worked.
  const reason = voidReason({ figma: { channel: 'cached', ok: false },
                              result: { is_error: false } });
  assert.match(reason, /visual truth/);
  assert.equal(voidReason({ figma: { channel: 'cached', ok: true, calls: 4 },
                            result: { is_error: false } }), null);
});

test('an arm that chose not to call Figma is a result, not a void', () => {
  // Zero calls with a working channel is the agent deciding it had enough. Discarding it
  // would throw away one of the more interesting observations for looking like a fault.
  assert.equal(voidReason({ figma: { channel: 'cached', ok: true, calls: 0 },
                            result: { is_error: false } }), null);
});
