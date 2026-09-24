'use strict';

/**
 * Hallucinated API references.
 *
 * An agent writing <dsb-button type="primary"> where the input is `variant` is the UI
 * hallucination claim made concrete: the code looks right, compiles in a loose enough
 * configuration, and renders a button that ignores half of what it was told.
 *
 * Checked against contracts.json, which is scorer input and reaches no arm.
 */

const fs = require('fs');
const path = require('path');
const { templates, elements, walk } = require('./lib/source');

const DS_ROOT = process.env.DSB_ROOT ||
  path.resolve(__dirname, '../../../design-system-blueprint/components');
const CONTRACTS = process.env.DSB_CONTRACTS || path.join(DS_ROOT, 'mcp', 'contracts.json');
const PUBLIC_API = path.join(DS_ROOT, 'src', 'public-api.ts');

/** Attributes Angular understands on any element, which no component has to declare. */
const UNIVERSAL = new Set([
  'class', 'id', 'style', 'title', 'hidden', 'role', 'tabindex', 'ngClass', 'ngStyle',
  'ngIf', 'ngFor', 'ngSwitch', 'formControlName', 'formControl', 'formGroup', 'ngModel',
  'ngModelChange', 'ngProjectAs', 'attr', 'aria',
]);

/**
 * Native DOM events, which bind to a component's host element like any other.
 *
 * The first version of this scorer reported twelve hallucinations in the pilot, every one
 * of them `(click)` on a dsb-button. Perfectly valid Angular, and a scorer that called it a
 * hallucination would have manufactured the finding the whole evaluation is looking for.
 */
const DOM_EVENTS = new Set([
  'click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'mouseover',
  'mousemove', 'contextmenu', 'wheel', 'scroll',
  'keydown', 'keyup', 'keypress', 'input', 'change', 'submit', 'reset',
  'focus', 'blur', 'focusin', 'focusout', 'select',
  'touchstart', 'touchend', 'touchmove', 'pointerdown', 'pointerup', 'pointerenter',
  'drag', 'dragstart', 'dragend', 'dragover', 'drop', 'animationend', 'transitionend',
]);

function load() {
  if (!fs.existsSync(CONTRACTS)) throw new Error(`contracts.json not found at ${CONTRACTS}`);
  const { components } = JSON.parse(fs.readFileSync(CONTRACTS, 'utf8'));
  const bySelector = new Map();
  for (const c of components) {
    bySelector.set(c.selector, {
      props: new Set(Object.keys(c.props || {})),
      events: new Set(Object.keys(c.events || {})),
      name: c.name,
    });
  }

  /**
   * What the package exports is not what contracts.json lists.
   *
   * contracts.json describes 16 components. The package also exports the interfaces and
   * the directive they need — FooterColumn, NavItem, TagVariant, DropdownOption,
   * ColumnDefDirective. Checking imports against the component list reported all seven of
   * the pilot's perfectly valid type imports as hallucinations.
   */
  const exports = new Set();
  if (fs.existsSync(PUBLIC_API)) {
    for (const line of fs.readFileSync(PUBLIC_API, 'utf8').split('\n')) {
      const m = /export \* from '(\.[^']+)'/.exec(line.trim());
      if (!m) continue;
      const target = path.resolve(path.dirname(PUBLIC_API), `${m[1]}.ts`);
      if (!fs.existsSync(target)) continue;
      const source = fs.readFileSync(target, 'utf8');
      for (const e of source.matchAll(/^export\s+(?:abstract\s+)?(?:class|interface|type|enum|const|function)\s+(\w+)/gm)) {
        exports.add(e[1]);
      }
    }
  }
  for (const c of components) exports.add(c.name);

  return { bySelector, exports };
}

/**
 * Opening tags of one selector, with their attribute names.
 *
 * Written as a scan rather than a regular expression over the whole tag, because attribute
 * values contain `>` — `[disabled]="a > b"` would end the tag early and take the rest of
 * the attributes with it.
 */
function openingTags(source, selector) {
  const tags = [];
  const start = new RegExp(`<${selector}(?=[\\s/>]|$)`, 'g');

  for (const match of source.matchAll(start)) {
    let i = match.index + match[0].length;
    let quote = null;
    let body = '';
    while (i < source.length) {
      const ch = source[i];
      if (quote) { if (ch === quote) quote = null; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
      body += ch;
      i += 1;
    }
    const attrs = [...body.matchAll(/(?:^|\s)[[(]?([\w.-]+)[\])]?\s*=/g)].map((m) => m[1]);
    tags.push({ index: match.index, attrs });
  }
  return tags;
}

const baseName = (attr) => attr.split('.')[0].replace(/Change$/, '');

function score(appRoot) {
  const { bySelector, exports } = load();
  const unknownProps = [];
  const unknownImports = [];

  for (const file of templates(appRoot)) {
    const rel = path.relative(appRoot, file.file);
    for (const [selector, contract] of bySelector) {
      if (elements(file.source, selector) === 0) continue;
      for (const tag of openingTags(file.source, selector)) {
        for (const attr of tag.attrs) {
          if (UNIVERSAL.has(attr) || attr.startsWith('attr.') || attr.startsWith('aria-')) continue;
          if (attr.startsWith('data-') || attr.startsWith('#') || attr.startsWith('*')) continue;
          if (DOM_EVENTS.has(attr)) continue;
          const name = baseName(attr);
          // A banana-in-a-box binding [(open)] is the `open` prop plus an `openChange` event.
          if (contract.props.has(name) || contract.events.has(attr) || contract.events.has(`${name}Change`)) continue;
          unknownProps.push({
            file: rel,
            line: file.source.slice(0, tag.index).split('\n').length,
            selector, attribute: attr,
          });
        }
      }
    }
  }

  // Imported class names that the package does not export — the Dsb-prefix trap.
  for (const file of walk(appRoot, ['.ts'])) {
    const source = fs.readFileSync(file, 'utf8');
    for (const m of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@jablonowski\/dsb-components['"]/g)) {
      for (const raw of m[1].split(',')) {
        const name = raw.trim().split(/\s+as\s+/)[0].trim();
        if (!name || exports.has(name)) continue;
        unknownImports.push({ file: path.relative(appRoot, file), name });
      }
    }
  }

  return {
    total: unknownProps.length + unknownImports.length,
    unknownProps: unknownProps.length,
    unknownImports: unknownImports.length,
    detail: { unknownProps, unknownImports },
  };
}

module.exports = { score, openingTags };
