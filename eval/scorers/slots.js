'use strict';

/**
 * Component adoption.
 *
 * This scorer carries the falsifier — "arm D hand-implements more than one component the
 * library already provides" — so the thirteen slots and what counts as a reimplementation
 * are fixed in SCORERS.md and repeated here as data, not decided while reading a result.
 *
 * Each slot resolves to one of:
 *   used            the library component fills it
 *   reimplemented   the slot is filled by hand while the component was available
 *   absent          nothing fills it; the element was never built
 */

const { templates, elements, region } = require('./lib/source');

/** Arms that were given the component library, and could therefore decline to use it. */
const HAS_LIBRARY = new Set(['B', 'C', 'D']);

const SLOTS = [
  { id: 1,  slot: 'login — username field',    selector: 'dsb-input',    where: 'login',
    byHand: /<input(?=[\s/>])/ },
  { id: 2,  slot: 'login — password field',    selector: 'dsb-input',    where: 'login', nth: 2,
    byHand: /<input(?=[\s/>])[^>]*type=["']password/ },
  { id: 3,  slot: 'login — remember me',       selector: 'dsb-checkbox', where: 'login',
    byHand: /<input(?=[\s/>])[^>]*type=["']checkbox/ },
  { id: 4,  slot: 'login — submit',            selector: 'dsb-button',   where: 'login',
    byHand: /<button(?=[\s/>])/ },
  { id: 5,  slot: 'shell — header',            selector: 'dsb-header',   where: 'layout',
    byHand: /<header(?=[\s/>])/ },
  { id: 6,  slot: 'shell — footer',            selector: 'dsb-footer',   where: 'layout',
    byHand: /<footer(?=[\s/>])/ },
  { id: 7,  slot: 'shell — profile avatar',    selector: 'dsb-avatar',   where: 'layout',
    byHand: /<img(?=[\s/>])|avatar/i },
  { id: 8,  slot: 'users — page action',       selector: 'dsb-button',   where: 'users',
    byHand: /<button(?=[\s/>])/ },
  { id: 9,  slot: 'users — the table',         selector: 'dsb-table',    where: 'users',
    also: 'dsb-column', byHand: /<table(?=[\s/>])/ },
  { id: 10, slot: 'users — avatar cell',       selector: 'dsb-avatar',   where: 'users',
    byHand: /<img(?=[\s/>])/ },
  { id: 11, slot: 'users — role/status badge', selector: 'dsb-tag',      where: 'users',
    byHand: /class=["'][^"']*\b(tag|badge|chip|pill)\b/ },
  { id: 12, slot: 'dialogs — all four',        selector: 'dsb-modal',    where: 'users',
    byHand: /class=["'][^"']*\b(modal|dialog|overlay|backdrop)\b/ },
  // Pre-registered as the one defensible reimplementation: the original specification chose
  // a native select here for full-width styling.
  { id: 13, slot: 'edit/invite — role selector', selector: 'dsb-dropdown', where: 'users',
    byHand: /<select(?=[\s/>])/, defensible: true },
];

/**
 * @param appRoot  the generated src/
 * @param arm      which arm produced it. The falsifier asks whether an arm that HAD the
 *                 library chose not to use it; in A and A' there is nothing to decline, so
 *                 thirteen hand-built components are the definition of the arm rather than
 *                 a result. Evaluating it there would print FALSIFIER against the baseline.
 */
function score(appRoot, arm) {
  const files = templates(appRoot);
  const all = files.map((f) => f.source).join('\n');
  const byRegion = {};
  for (const f of files) {
    const r = region(f.file);
    byRegion[r] = (byRegion[r] || '') + '\n' + f.source;
  }

  const results = SLOTS.map((spec) => {
    const scoped = byRegion[spec.where] || '';
    // The region is a hint. A component used somewhere the path naming did not predict is
    // still a component used; the mismatch is reported rather than punished.
    const inRegion = elements(scoped, spec.selector);
    const anywhere = elements(all, spec.selector);
    const need = spec.nth || 1;

    let verdict, note;
    if (inRegion >= need) verdict = 'used';
    else if (anywhere >= need) { verdict = 'used'; note = `found outside the ${spec.where} templates`; }
    else if (spec.byHand.test(scoped) || spec.byHand.test(all)) verdict = 'reimplemented';
    else verdict = 'absent';

    if (verdict === 'used' && spec.also && elements(all, spec.also) === 0) {
      verdict = 'reimplemented';
      note = `${spec.selector} present but ${spec.also} missing`;
    }

    return { id: spec.id, slot: spec.slot, selector: spec.selector, verdict,
      ...(spec.defensible ? { defensible: true } : {}), ...(note ? { note } : {}) };
  });

  const reimplemented = results.filter((r) => r.verdict === 'reimplemented');
  const indefensible = reimplemented.filter((r) => !r.defensible);

  return {
    slots: results,
    used: results.filter((r) => r.verdict === 'used').length,
    reimplemented: reimplemented.length,
    absent: results.filter((r) => r.verdict === 'absent').length,
    of: SLOTS.length,
    // The falsifier, evaluated rather than eyeballed — and only where it means anything.
    hadLibrary: HAS_LIBRARY.has(arm),
    falsifierTriggered: HAS_LIBRARY.has(arm) ? indefensible.length > 1 : null,
  };
}

module.exports = { score, SLOTS };
