# Scorers

Every number in this evaluation comes from a script. Nothing is scored by looking at it.

Each scorer runs against a generated application directory and emits JSON, so the five
arms are reduced the same way and the reduction is reviewable.

```
eval/score.js <run-dir> --arm=D --run=3  ->  eval/results/D-3.json
```

## Zones

Redefined after the pilot, before any scored run. The original rule — zone follows the
component — assumed the six local components would exist as named components. In `D-1` four
of the six do not: `UserProfileMenu`, `MetricCard`, `ThroughputChart` and `LogsCard` are
inlined into the pages, and `AuthCard` survives only as a CSS class. There was nothing for
a name-based rule to match.

What the generated code actually looks like is this: where a library component fills a
slot, the application writes markup and almost no CSS; where it does not, the application
writes CSS. So the zones follow that split.

- **covered** — template markup where a library component fills a slot. Scored by
  **adoption** and **hallucinated API**, not by raw values, because using a component as a
  component produces almost no styling of its own
- **gap** — all CSS the application authors. Scored by **raw values** and **tier
  discipline**

This needs no guess about where an agent chose to put a file, which is the property the
first rule lacked.

**Frozen 2026-09-23, after the pilot and before the first scored run.** The pilot informed
this definition, so `D-1` is a pilot and not one of the five scored D runs. Reusing it
would mean the rule and one of the data points came from the same observation.

## 1. Raw values

**Source:** reuse `components/scripts/lint-raw-values.js` from the design system repo,
pointed at the generated app.

Counts hex colours, `rgb()`/`hsl()`, and `px`/`rem` literals in templates and stylesheets,
excluding a fixed allowlist (`0`, `1px` hairlines, `100%`, `auto`).

This is the headline metric. It is the UI Drift Tax at its source: every literal is a value
that will not move when the decision behind it moves.

## 2. Hallucinated API references

**Source:** `contracts.json` from `@jablonowski/dsb-components`. It is scorer input only —
it is not handed to any arm. At ~13,400 tokens it is sixteen times the size of
`llms.client.txt` and four times the whole of `S0`; putting it in a context window would
make the infrastructure's cost a property of one file rather than of the design. Arm C gets
`llms.client.txt`, the artifact written for agents to read. Arm D gets a resolver to ask
instead. If C underperforms, "paste the entire contract" is available as a later variant,
and C versus that variant versus D answers whether 13,400 tokens buy anything a tool does
not.

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

Unblocked as of `@jablonowski/dsb-tokens@1.0.10`. The published public stylesheet now
declares all 261 variables the component library reads and still withholds the raw palette,
so an application has a supported entry point that works — and `--ds-component-*` in
application code is a real crossing again rather than the only arrangement that renders.

## 5. Component adoption, and reimplementation

This carries the falsifier, so the rule is fixed here and not revisited.

Thirteen slots: places in `S0` where a library component has a natural home. For each,
the run scores **used**, **reimplemented**, or **absent** (the element was never built).

| # | Slot | Component | Reimplemented means |
|---|---|---|---|
| 1 | Login — username field | `dsb-input` | a bare `<input>` with local styles |
| 2 | Login — password field | `dsb-input` | same |
| 3 | Login — remember me | `dsb-checkbox` | a bare `<input type=checkbox>` with local styles |
| 4 | Login — submit | `dsb-button` | a `<button>` with local styles |
| 5 | Shell — header | `dsb-header` | a hand-built header bar |
| 6 | Shell — footer | `dsb-footer` | a hand-built footer |
| 7 | Shell — profile avatar | `dsb-avatar` | a hand-built circle with initials or an `<img>` |
| 8 | Users — page action | `dsb-button` | a `<button>` with local styles |
| 9 | Users — the table | `dsb-table` + `dsb-column` | a hand-built `<table>` |
| 10 | Users — avatar cell | `dsb-avatar` | as 7 |
| 11 | Users — role and status badges | `dsb-tag` | a `<span>` with badge classes |
| 12 | Dialogs — all four | `dsb-modal` | a hand-built overlay and panel |
| 13 | Edit / invite — role selector | `dsb-dropdown` | a native `<select>` with local styles |

`dsb-list` and `dsb-list-item` are **not** slots: the dashboard's Data Summary tile sits in
the gap zone, where a list is one reasonable construction among several.
`dsb-radio-group` has no home in this application.

**Slot 13 is the one contested entry.** The original specification told the agent to use a
native `<select>` there for reliable full-width styling. An arm that reaches the same
conclusion by itself has made a judgement about a component, not failed to find one. It is
pre-registered as the single defensible reimplementation, in `PROTOCOL.md`.

Scored from the generated templates: a slot counts as **used** when the library component's
selector appears in the element that fills that slot.

**Parse the templates; do not grep them.** Angular components are written across several
lines:

```html
<dsb-footer
  [brandName]="brand"
  [columns]="footerColumns" />
```

A pattern expecting a space or `>` after the selector misses that entirely. An ad-hoc grep
written while reading the pilot did exactly this, reported `dsb-footer` and `dsb-dropdown`
as absent and five of nine `dsb-input` as missing, and for several minutes the pilot looked
like it had triggered the falsifier. Every scorer needs a fixture with a multi-line tag in
it, and a test that fails when the pattern regresses.

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
