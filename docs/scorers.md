# Scorers

[← docs index](start.md)

What each column in [the results](results.md) counts, and which script produces it.



| Column | What it counts | Scorer |
|---|---|---|
| **Library components used** | Of thirteen pre-registered places in the spec where a library component has a natural home — login fields, submit, header, footer, avatars, the table, badges, modals, the role selector — how many were filled with one. Templates are parsed, not grepped: Angular writes attributes across lines and a pattern expecting a space after the selector misses them. | [`slots.js`](../eval/scorers/slots.js) |
| **Hand-reimplemented** | Of those same thirteen, how many were built by hand instead. This carries the falsifier. | [`slots.js`](../eval/scorers/slots.js) |
| **Scattered raw values** | Hex, `rgb()` or `px`/`rem` literals used directly in a declaration, in CSS the application authored. `0` and `1px` hairlines excluded. | [`raw-values.js`](../eval/scorers/raw-values.js) |
| **Custom properties declared locally** | The same kinds of literal, but as the value of a custom property — a local token layer. Counted apart from scattered values because naming a gap and bypassing the system are opposite behaviours. | [`raw-values.js`](../eval/scorers/raw-values.js) |
| **Tier boundary crossings** | `var(--ds-*)` in application code that is neither absent nor a tier-2 decision: the raw palette reached directly, or another component's private tokens. | [`tiers.js`](../eval/scorers/tiers.js) |
| **Decision tokens used** | How many distinct `--ds-decisions-*` tokens the application actually referenced. | [`tiers.js`](../eval/scorers/tiers.js) |
| **Hallucinated API references** | Bound inputs and outputs that do not exist on the component, and imported names the package does not export. Native DOM events and valid type imports are not counted — an earlier version reported nineteen of those and every one was invented by the scorer. | [`api.js`](../eval/scorers/api.js) |
| **Convention checks** | Seven conventions removed from the specification, each a place where the machine-readable layer is known to be thin. Import names carry no `Dsb` prefix; `dsb-column` needs `#cell` and `let-row="row"`; nothing projects into `dsb-header`; `FooterColumn.heading` not `.title`; and so on. | [`checks.js`](../eval/scorers/checks.js) |
| **Colour conformance rate** | Of the colours the application chose for itself, the fraction that are values the design system actually holds, compared against a committed snapshot of the published token package. Read it with the **values authored** row: an arm that authored nothing has no rate, and an arm that authored two values has a rate over two values. | [`conformance.js`](../eval/scorers/conformance.js) |
| **Near-miss values** | Authored values with no exact match in the design system but one within tolerance — 24 units of sRGB distance, or 2px. Reported separately because they are the expensive class: indistinguishable on screen, and they will not move when the system moves. | [`conformance.js`](../eval/scorers/conformance.js) |
| **axe violations** | WCAG 2.1 A and AA over the built screens, by impact, in a headless browser. | [`a11y.js`](../eval/scorers/a11y.js) |
| **Builds** | Binary. A run that does not build scores nothing else. | [`build.js`](../eval/scorers/build.js) |

Each judgement baked into these — the tolerances, the thirteen slots, the exclusions, and
what each one would fail to notice — is written out in [`eval/SCORERS.md`](../eval/SCORERS.md).

---
