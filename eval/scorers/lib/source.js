'use strict';

/**
 * Reading a generated application.
 *
 * Everything here exists because of one afternoon with a grep. Angular templates put
 * attributes on their own lines:
 *
 *     <dsb-footer
 *       [brandName]="brand"
 *       [columns]="footerColumns" />
 *
 * A pattern expecting a space or a `>` after the selector finds nothing there. Reading the
 * pilot that way reported dsb-footer and dsb-dropdown as unused, which is the falsifier
 * triggering, and it was a regular expression rather than an agent.
 */

const fs = require('fs');
const path = require('path');

/** Every file of the given extensions under a directory. */
function walk(root, extensions) {
  const out = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (extensions.some((ext) => entry.name.endsWith(ext))) out.push(full);
    }
  };
  if (fs.existsSync(root)) visit(root);
  return out;
}

/** Templates: .html files, plus the inline `template:` of a .ts component. */
function templates(appRoot) {
  const files = [];

  for (const file of walk(appRoot, ['.html'])) {
    files.push({ file, kind: 'template', source: strip(fs.readFileSync(file, 'utf8')) });
  }

  for (const file of walk(appRoot, ['.ts'])) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/template\s*:\s*`([\s\S]*?)`/g)) {
      files.push({ file, kind: 'inline-template', source: strip(match[1]) });
    }
  }

  return files;
}

/** Stylesheets: .css files, plus the inline `styles:` of a .ts component. */
function stylesheets(appRoot) {
  const files = [];

  for (const file of walk(appRoot, ['.css', '.scss'])) {
    files.push({ file, kind: 'stylesheet', source: fs.readFileSync(file, 'utf8') });
  }

  for (const file of walk(appRoot, ['.ts'])) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/styles\s*:\s*\[?\s*`([\s\S]*?)`/g)) {
      files.push({ file, kind: 'inline-styles', source: match[1] });
    }
  }

  return files;
}

/** Comments are not code, in either language. */
function strip(source) {
  return source.replace(/<!--[\s\S]*?-->/g, '');
}

function stripCssComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Occurrences of an element, counted by opening tag.
 *
 * The lookahead is the whole point: whitespace of any kind, including a newline, or the end
 * of the tag. `<dsb-list` must not match `<dsb-list-item`.
 */
function elements(source, selector) {
  const pattern = new RegExp(`<${selector}(?=[\\s/>]|$)`, 'g');
  return [...source.matchAll(pattern)].length;
}

/** Which page a file belongs to, by path. A hint for attribution, never a gate. */
function region(file) {
  const p = file.toLowerCase();
  if (/login|auth|sign-?in/.test(p)) return 'login';
  if (/users?|member|team/.test(p)) return 'users';
  if (/dashboard|home|overview/.test(p)) return 'dashboard';
  if (/layout|shell|chrome/.test(p)) return 'layout';
  return 'other';
}

module.exports = { walk, templates, stylesheets, elements, region, stripCssComments };
