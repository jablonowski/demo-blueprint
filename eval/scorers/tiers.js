'use strict';

/**
 * Tier discipline in the application's own code.
 *
 * Tier 1 in application code means the semantic layer was bypassed: a palette entry says
 * nothing about intent, so nothing can be re-themed later.
 *
 * Tier 3 means the application has coupled itself to the internals of a component someone
 * else owns. Since 1.0.10 those variables are declared in the public stylesheet — the
 * library cannot render without them — so using one works, and goes on working until the
 * component's owner repoints it. That is exactly why it is worth counting.
 */

const path = require('path');
const { stylesheets, templates, stripCssComments } = require('./lib/source');

const VAR = /var\(\s*(--ds-[\w-]+)/g;
const TIER1 = /^--ds-[a-z-]+-options-/;
const TIER3 = /^--ds-component-/;

function score(appRoot) {
  const decisions = new Set();
  const component = [];
  const options = [];

  const sources = [
    ...stylesheets(appRoot).map((s) => ({ ...s, source: stripCssComments(s.source) })),
    ...templates(appRoot),
  ];

  for (const entry of sources) {
    const rel = path.relative(appRoot, entry.file);
    for (const m of entry.source.matchAll(VAR)) {
      const name = m[1];
      const line = entry.source.slice(0, m.index).split('\n').length;
      if (TIER1.test(name)) options.push({ file: rel, line, name });
      else if (TIER3.test(name)) component.push({ file: rel, line, name });
      else decisions.add(name);
    }
  }

  // Which entry point the application imported says whether it even had the choice.
  const imports = [];
  for (const sheet of stylesheets(appRoot)) {
    for (const m of sheet.source.matchAll(/@(?:import|use)\s+['"]([^'"]*dsb-tokens[^'"]*)['"]/g)) {
      imports.push(m[1]);
    }
  }

  return {
    decisionsUsed: decisions.size,
    crossings: options.length + component.length,
    tier1: options.length,
    tier3: component.length,
    tokenImports: imports,
    // /css is the supported surface; /css/full and any deep path are the library's own.
    importedPublicSurface: imports.length > 0 && imports.every((i) => /dsb-tokens\/(css|scss)$/.test(i)),
    detail: { tier1: options, tier3: component, decisions: [...decisions].sort() },
  };
}

module.exports = { score };
