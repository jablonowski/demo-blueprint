#!/usr/bin/env node
'use strict';

/**
 * Accessibility of the rendered screens.
 *
 * The design system's own components are tested with axe on every story, so violations in
 * the covered zone would be a surprise. The gap zone is where an arm writes its own
 * markup, and where "looks right" and "is usable" come apart — the fourth market risk the
 * book is about, measured.
 *
 * Runs against the built application, after build.js, in the run directory.
 *
 *   node a11y.js <run-dir>
 *
 * Needs playwright and @axe-core/playwright, declared in eval/package.json. Without them it
 * reports unavailable rather than clean: a measurement that did not happen must not read
 * as a pass.
 */

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROUTES = [
  { path: '/login', authenticated: false },
  { path: '/dashboard', authenticated: true },
  { path: '/users', authenticated: true },
];

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

/** Angular 19 writes dist/<project>/browser. Find it rather than guess the project name. */
function distRoot(dir) {
  const dist = path.join(dir, 'dist');
  if (!fs.existsSync(dist)) return null;
  for (const entry of fs.readdirSync(dist)) {
    for (const candidate of [path.join(dist, entry, 'browser'), path.join(dist, entry)]) {
      if (fs.existsSync(path.join(candidate, 'index.html'))) return candidate;
    }
  }
  return null;
}

/** Static server with an SPA fallback, so /users reaches the router rather than a 404. */
function serve(root) {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    let file = path.join(root, url);
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, () => resolve({ server, port: server.address().port })));
}

async function run(dir) {
  let chromium, AxeBuilder;
  try {
    ({ chromium } = require('playwright'));
    AxeBuilder = require('@axe-core/playwright').default;
  } catch {
    return { available: false, reason: 'playwright and @axe-core/playwright are not installed; run npm install in eval/' };
  }

  const root = distRoot(dir);
  if (!root) return { available: false, reason: 'no build output; run build.js first' };

  const { server, port } = await serve(root);
  const browser = await chromium.launch();
  const pages = [];

  try {
    for (const route of ROUTES) {
      const context = await browser.newContext();
      const page = await context.newPage();
      // The application gates /dashboard and /users on localStorage, per S0.
      if (route.authenticated) {
        await page.goto(`http://localhost:${port}/`);
        await page.evaluate(() => localStorage.setItem('isLoggedIn', 'true'));
      }
      await page.goto(`http://localhost:${port}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(500);

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      pages.push({
        route: route.path,
        violations: violations.map((v) => ({
          id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help,
        })),
      });
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const all = pages.flatMap((p) => p.violations);
  const by = (impact) => all.filter((v) => v.impact === impact).length;

  return {
    available: true,
    total: all.length,
    critical: by('critical'), serious: by('serious'), moderate: by('moderate'), minor: by('minor'),
    pages,
  };
}

if (require.main === module) {
  const dir = process.argv[2];
  if (!dir) { console.error('  Usage: node a11y.js <run-dir>'); process.exit(2); }
  run(dir).then((r) => process.stdout.write(JSON.stringify(r, null, 2) + '\n'));
}

module.exports = { run };
