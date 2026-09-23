# Arm A′ — a styleguide, as a document

The agent receives `S0.md` plus the text below: a palette, a type scale, spacing, radii,
elevation and motion, written down, together with the CSS for a few recurring pieces.

**This is a design system.** It is delivered as prose and CSS pasted into the prompt rather
than as an installable artifact, which is where most organisations actually are: a Figma
file, a page in Confluence, and a paragraph in the onboarding doc.

That makes A′ the uncomfortable arm. If it scores like C, the machine-readable layer is not
earning its keep and the finding belongs in the book. If it does not — if the values drift,
or the agent invents a sixth grey — then the difference between documenting a system and
shipping one is measurable, which is the argument the whole project rests on.

Everything below is lifted verbatim from `spec-no-ds.md`. It is the condition under test,
not something to improve.

---

## Design values

Define these CSS custom properties in `styles.css` under `:root`. Reference them in local component styles.

```css
/* styles.css */

:root {
  /* Typography */
  --font-size-xs:   11px;
  --font-size-sm:   12px;
  --font-size-base: 14px;
  --font-size-lg:   16px;
  --font-size-xl:   18px;
  --font-size-2xl:  24px;
  --font-weight-normal:   400;
  --font-weight-medium:   500;
  --font-weight-semibold: 600;

  /* Text colours */
  --color-text-primary:     #111111;
  --color-text-secondary:   #666666;
  --color-text-muted:       #999999;
  --color-text-placeholder: #b3b3b3;

  /* Surfaces */
  --color-surface-page:     #fafafa;
  --color-surface-card:     #ffffff;
  --color-surface-subtle:   #f5f5f5;
  --color-surface-recessed: #f0f0f0;

  /* Borders */
  --color-border:       #e5e5e5;
  --color-border-input: #d4d4d4;

  /* Semantic */
  --color-primary: #111111;
  --color-danger:  #d93025;

  /* Elevation */
  --shadow-card:  0 1px 3px rgba(0, 0, 0, .08);
  --shadow-modal: 0 8px 32px rgba(0, 0, 0, .14);

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 10px;

  /* Motion */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --easing-standard: ease;
}

/* Global reset */
*, *::before, *::after { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: var(--color-surface-page);
}
a { color: inherit; }
button { font-family: inherit; }
```

---

---

## Recurring component styles

**Tag CSS (global in `styles.css`):**

```css
.tag { display:inline-flex; align-items:center; padding:2px 8px; border-radius:4px; font-size:12px; font-weight:500; white-space:nowrap; }
.tag-success { background:#f0fdf4; color:#16a34a; }
.tag-warning { background:#fefce8; color:#ca8a04; }
.tag-danger  { background:#fef2f2; color:#dc2626; }
.tag-info    { background:#eff6ff; color:#2563eb; }
.tag-default { background:#f5f5f5; color:#555555; }
```
