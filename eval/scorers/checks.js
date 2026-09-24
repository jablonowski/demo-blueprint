'use strict';

/**
 * The nine checks.
 *
 * These were §9 of the original specification, "Critical Implementation Gotchas ...
 * verified against the actual library and must be followed exactly to avoid rework" — nine
 * correct answers written into the prompt. They are the highest-signal items in the
 * evaluation precisely because each one is a place the machine-readable layer is known to
 * be thin: somebody had to write them down by hand.
 *
 * A failure here names a fact `llms.client.txt` does not carry. The repair is to put it
 * there and measure the next run, which is the loop this whole thing exists for.
 *
 * Each check returns pass, fail, or na — na when the application never built the thing the
 * check is about, which is a different result from getting it wrong.
 */

const fs = require('fs');
const path = require('path');
const { templates, stylesheets, elements, walk, stripCssComments } = require('./lib/source');

/** The body of every <sel ...>…</sel>, for checks about what was projected inside. */
function contents(source, selector) {
  const out = [];
  const open = new RegExp(`<${selector}(?=[\\s/>]|$)[^>]*>`, 'g');
  for (const m of source.matchAll(open)) {
    if (m[0].endsWith('/>')) { out.push(''); continue; }
    const from = m.index + m[0].length;
    const close = source.indexOf(`</${selector}`, from);
    out.push(close === -1 ? source.slice(from) : source.slice(from, close));
  }
  return out;
}

const CHECKS = [
  {
    id: '9.1',
    what: 'import names carry no Dsb prefix',
    run: ({ ts }) => {
      const bad = [];
      for (const { file, source } of ts) {
        for (const m of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@jablonowski\/dsb-components['"]/g)) {
          for (const raw of m[1].split(',')) {
            const name = raw.trim().split(/\s+as\s+/)[0].trim();
            if (/^Dsb[A-Z]/.test(name)) bad.push(`${file}: ${name}`);
          }
        }
      }
      return bad.length ? { verdict: 'fail', detail: bad } : { verdict: 'pass' };
    },
  },
  {
    id: '9.2',
    what: 'dsb-column uses #cell and let-row="row"',
    run: ({ html }) => {
      const bodies = html.flatMap((t) => contents(t.source, 'dsb-column'));
      const withTemplate = bodies.filter((b) => /<ng-template/.test(b));
      if (withTemplate.length === 0) return { verdict: 'na', detail: ['no templated columns'] };
      const bad = withTemplate.filter((b) => !/#cell\b/.test(b) || !/let-row\s*=\s*["']row["']/.test(b));
      return bad.length ? { verdict: 'fail', detail: [`${bad.length} of ${withTemplate.length} columns`] }
                        : { verdict: 'pass' };
    },
  },
  {
    id: '9.3',
    what: 'nothing is projected into dsb-header',
    run: ({ html }) => {
      const bodies = html.flatMap((t) => contents(t.source, 'dsb-header'));
      if (bodies.length === 0) return { verdict: 'na', detail: ['dsb-header not used'] };
      const bad = bodies.filter((b) => b.trim().length > 0);
      return bad.length ? { verdict: 'fail', detail: ['content projected into a slotless component'] }
                        : { verdict: 'pass' };
    },
  },
  {
    id: '9.4',
    what: 'FooterColumn uses heading, not title',
    run: ({ ts }) => {
      const relevant = ts.filter((f) => /FooterColumn/.test(f.source));
      if (relevant.length === 0) return { verdict: 'na', detail: ['no footer columns declared'] };
      const bad = relevant.filter((f) => /FooterColumn\[\]\s*=[\s\S]{0,400}?\btitle\s*:/.test(f.source));
      return bad.length ? { verdict: 'fail', detail: bad.map((f) => f.file) } : { verdict: 'pass' };
    },
  },
  {
    id: '9.5',
    what: 'no dsb-modal uses both the title input and the [modal-title] slot',
    run: ({ html }) => {
      const bad = [];
      for (const t of html) {
        const open = /<dsb-modal(?=[\s/>])[^>]*>/g;
        for (const m of t.source.matchAll(open)) {
          const hasTitleInput = /\btitle\s*=/.test(m[0]);
          const from = m.index + m[0].length;
          const close = t.source.indexOf('</dsb-modal', from);
          const body = close === -1 ? t.source.slice(from) : t.source.slice(from, close);
          if (hasTitleInput && /\bmodal-title\b/.test(body)) bad.push(t.file);
        }
      }
      if (!html.some((t) => elements(t.source, 'dsb-modal') > 0)) {
        return { verdict: 'na', detail: ['dsb-modal not used'] };
      }
      return bad.length ? { verdict: 'fail', detail: bad } : { verdict: 'pass' };
    },
  },
  {
    id: '9.6',
    what: 'a split modal footer sets flex:1 on the projected element',
    run: ({ html, css }) => {
      const split = html.filter((t) => /modal-footer[^>]*>[\s\S]{0,600}?(space-between|justify-content\s*:\s*space-between)/.test(t.source)
        || /\.modal-footer-split|footer-split/.test(t.source));
      if (split.length === 0) return { verdict: 'na', detail: ['no split footer'] };
      const styles = css.map((c) => stripCssComments(c.source)).join('\n');
      const ok = /flex\s*:\s*1/.test(styles) || html.some((t) => /style=["'][^"']*flex\s*:\s*1/.test(t.source));
      return ok ? { verdict: 'pass' } : { verdict: 'fail', detail: ['split footer without flex:1'] };
    },
  },
  {
    id: '9.7',
    what: 'the right-edge profile menu avoids dsb-dropdown',
    run: ({ html }) => {
      const layout = html.filter((t) => /profile|account|user-menu|avatar/i.test(t.file + t.source));
      if (layout.length === 0) return { verdict: 'na', detail: ['no profile menu'] };
      const bad = layout.filter((t) => {
        const near = /(profile|account|user)[\s\S]{0,400}?<dsb-dropdown/i;
        return near.test(t.source);
      });
      return bad.length ? { verdict: 'fail', detail: ['dsb-dropdown clips at the right viewport edge'] }
                        : { verdict: 'pass' };
    },
  },
  {
    id: 'standalone',
    what: 'every library component used is in the component imports array',
    run: ({ ts, html }) => {
      const used = new Set();
      for (const t of html) {
        for (const m of t.source.matchAll(/<(dsb-[\w-]+)(?=[\s/>]|$)/g)) used.add(m[1]);
      }
      if (used.size === 0) return { verdict: 'na', detail: ['no library components used'] };
      const imported = ts.map((f) => f.source).join('\n');
      const missing = [...used].filter((sel) => {
        // dsb-list-item -> ListItemComponent, dsb-column -> ColumnDefDirective
        const stem = sel.replace(/^dsb-/, '').split('-').map((p) => p[0].toUpperCase() + p.slice(1)).join('');
        return !new RegExp(`\\b${stem}(Component|Directive)\\b`).test(imported)
          && !(sel === 'dsb-column' && /ColumnDefDirective/.test(imported));
      });
      return missing.length ? { verdict: 'fail', detail: missing } : { verdict: 'pass' };
    },
  },
];

function score(appRoot) {
  const html = templates(appRoot).map((t) => ({ file: path.relative(appRoot, t.file), source: t.source }));
  const css = stylesheets(appRoot);
  const ts = walk(appRoot, ['.ts']).map((file) => ({
    file: path.relative(appRoot, file),
    source: fs.readFileSync(file, 'utf8'),
  }));

  const results = CHECKS.map((c) => ({ id: c.id, what: c.what, ...c.run({ html, css, ts }) }));

  return {
    passed: results.filter((r) => r.verdict === 'pass').length,
    failed: results.filter((r) => r.verdict === 'fail').length,
    na: results.filter((r) => r.verdict === 'na').length,
    of: CHECKS.length,
    // 9.8 is not here. It is not a check: the specification told the agent to hardcode
    // #000000 because the decisions layer has no pure black. That is a gap in the token
    // set, recorded by the raw-value scorer, not a mistake an agent can make.
    results,
  };
}

module.exports = { score, CHECKS };
