# Scorers

Every number in this evaluation comes from a script. Nothing is scored by looking at it.

Each scorer runs against a generated application directory and emits JSON, so the five
arms are reduced the same way and the reduction is reviewable.

```
eval/score.js <run-dir> --arm=D --run=3  ->  eval/results/D-3.json
```

## Zones

Two zones, scored separately and never summed.

- **covered** — screens and parts the design system provides components for
- **gap** — the six local components named in `SPEC.md` §5: `AuthCard`, `MainLayout`,
  `UserProfileMenu`, `MetricCard`, `ThroughputChart`, `LogsCard`

Zone is decided by file path, fixed before the first run:
`src/app/shared/components/**` is gap, everything else is covered. Freeze this mapping —
adjusting it after seeing results is how an evaluation becomes a demonstration.

---

## 1. Raw values

**Source:** reuse `components/scripts/lint-raw-values.js` from the design system repo,
pointed at the generated app.

Counts hex colours, `rgb()`/`hsl()`, and `px`/`rem` literals in templates and stylesheets,
excluding a fixed allowlist (`0`, `1px` hairlines, `100%`, `auto`).

This is the headline metric. It is the UI Drift Tax at its source: every literal is a value
that will not move when the decision behind it moves.

## 2. Hallucinated API references

**Source:** `contracts.json` from `@jablonowski/dsb-components`.

For every `dsb-*` element in the generated templates, check each bound `@Input` and
`@Output` against the contract. Report:

- inputs that do not exist on that component
- outputs bound with the wrong name
- imported class names that the package does not export

An agent writing `<dsb-button type="primary">` where the input is `variant` is the UI
hallucination claim made concrete and countable.

## 3. The nine gotchas

`SPEC.md` §9 currently tells the agent each answer. Removed from the prompt, each becomes
a binary check. These are the highest-signal items in the whole evaluation, because each
one is a place where the machine-readable layer is known to be thin.

| # | Check | Passes when |
|---|---|---|
| 9.1 | Import names carry no `Dsb` prefix | every import resolves to a real export |
| 9.2 | `dsb-column` uses `#cell` and `let-row="row"` | template ref is `#cell`, row bound explicitly |
| 9.3 | Nothing projected into `dsb-header` | no child content inside `<dsb-header>` |
| 9.4 | `FooterColumn.heading`, not `.title` | every footer column object uses `heading` |
| 9.5 | `[modal-title]` and `title` not both used | no `<dsb-modal>` has both |
| 9.6 | Split modal footer sets `flex:1` | projected `[modal-footer]` carries it |
| 9.7 | Right-edge menu avoids `dsb-dropdown` | profile menu is not a `dsb-dropdown` |
| 9.8 | Chart bar fill — see note below | — |
| — | `dsb-input` etc. imported standalone | present in the component's `imports` array |

**9.8 is not a gotcha. It is a hole in the token set.** The spec says:

> Use `background-color: #000000` for chart bars. Do not use a CSS token variable — the
> desired colour is solid black.

The decisions layer has no pure black surface. `decisions.color.surface.emphasis` is
`#111111`; `#000000` exists only as `color.options.neutral.1000`, which is tier 1 and out
of reach by design. So the specification instructs the agent to hardcode, because the
system left it nowhere else to go.

Do not score this as an agent failure. Record it as **finding: decisions gap**, and let the
evaluation answer the better question — what does an agent do when the system has no word
for what it needs? Inventing `#000000` is arguably the correct behaviour. Reaching into
tier 1 is not. The distinction is the measurement.

The same suspicion applies to `LogsCard`: a monospace terminal view, and there is no
`font.family` token at all. Check before running.

## 4. Tier boundary crossings

Any `var(--ds-*)` in application code that is not `--ds-decisions-*`.

`--ds-component-*` in app code means the app has coupled itself to the internals of a
component someone else owns. Tier 1 means the semantic layer was bypassed entirely.

**Blocked:** this scorer cannot be written honestly until the `public.css` defect is
resolved. The published public stylesheet defines 137 decision variables, while the
component bundle reads 261 — 215 of them `--ds-component-*`. An application that imports
the supported public export today gets a library with 215 dead variables, so it has no
choice but to use `/css/full`. Until that is settled, "tier 3 in app code" cannot be
distinguished from "the only thing that works".

## 5. Reimplementation

Components the system already provides, rebuilt by hand anyway: a hand-rolled button,
a table assembled from `<table>`, a bespoke modal.

Detected structurally — a local component whose template and role match a `dsb-*`
component that was available. Needs a small fixed heuristic, written and frozen before the
first run.

## 6. Accessibility

axe against the built screens, same harness as the design system's own a11y suite.
Report violations by impact.

## 7. Build and render

Binary. A run that does not build scores nothing anywhere else — record it as a failed run
rather than a zero, and report the failure rate per arm. An arm that produces beautiful
token discipline in code that never compiles has not won anything.

## 8. Cost

Input tokens, output tokens, tool calls, wall clock, and correction turns to acceptance.

Reported per arm, never as the headline. The comparison that means something is cost per
**accepted** screen — generation plus rework — not cost per generation.

---

## Output

```json
{
  "arm": "D",
  "run": 3,
  "build": { "ok": true },
  "covered": { "rawValues": 0, "hallucinatedApi": 0, "tierCrossings": 0, "reimplemented": 0 },
  "gap":     { "rawValues": 4, "tierCrossings": 0, "behaviour": "extends-correctly" },
  "gotchas": { "passed": 7, "of": 9, "failed": ["9.2", "9.5"] },
  "a11y":    { "critical": 0, "serious": 1 },
  "cost":    { "inputTokens": 0, "outputTokens": 0, "toolCalls": 0, "correctionTurns": 1 },
  "findings": ["decisions gap: no pure-black surface token", "decisions gap: no font.family"]
}
```

Five arms, five runs each: 25 rows. Medians and spread per arm, one table.
