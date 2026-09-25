# Splitting the spec into `S0` + arm overlays

> **The two specifications this document takes apart no longer exist in the working tree.**
> `SPEC.md` and `spec-no-ds.md` were the parallel drafts that `S0.md` and the arm overlays
> were derived from; they were removed once the derivation was complete, because a reader
> arriving from the README would reasonably mistake them for the current specification.
> They remain in history and can be read with `git show c2006f2:SPEC.md` and
> `git show c2006f2:spec-no-ds.md`. This document is the record of how the split was made.

`SPEC.md` (694 lines) and `spec-no-ds.md` (934 lines) are parallel rewrites of the same
application. They differ by 4 KB and, more importantly, by content — so a difference in
outcome is attributable to the prose as readily as to the infrastructure.

They are not "with and without a design system". Compare the same tile:

```
SPEC.md         trend badge `dsb-tag` (variant="success", label `+12%`)

spec-no-ds.md   trend `+12%` (`tag-success`)
                .tag-success { background:#f0fdf4; color:#16a34a; }
```

The second one is a design system too. It is delivered as CSS pasted into the prompt.
That is a legitimate condition — most organisations are exactly there — but it is arm
**A′**, not a control.

## Where the coupling is

| Section | Lines | `dsb-*` mentions | Disposition |
|---|---:|---:|---|
| §1 Overview, tech stack, install | 1–24 | 5 | S0, minus the UI-library rows |
| §2 Figma reference | 25–42 | 0 | S0 — but drop the pointers to §5 and §9 |
| §3 Architecture & layout | 43–117 | 13 | S0 after genericising |
| §4 Routes & pages | 118–514 | 59 | S0 after genericising — the bulk of the work |
| §5 Component reference | 515–588 | many | **overlay** — arms B, C, D |
| §6 Design tokens | 589–619 | — | **overlay** — arms B, C, D |
| §7 Mock data schema | 620–647 | 0 | S0 unchanged |
| §8 Deliverables | 648–662 | 0 | S0 — minus item 7's reference to §5 |
| §9 Gotchas | 663–694 | many | **scoreboard**, not prompt. See `SCORERS.md` |
| no-ds §6 Design Values | 790–859 | — | **overlay** — arm A′ only |

The rewrite of §3 and §4 is the real work: roughly 470 lines in which every named component
becomes a description of intent. Mechanical extraction will not do it, and doing it badly
biases every arm at once.

## What genericising looks like

`S0` describes what the screen must contain and what each element means. It never names a
component, a class or a value. Each arm then resolves that intent with whatever it has.

### Current — `SPEC.md` §4, Route B

> - an optional **trend badge** (`dsb-tag`)
> 1. **Active Users** — value `1,284`, trend badge `dsb-tag` (`variant="success"`, label `+12%`), sub-label `"vs last 7 days"`.
> 5. **Request Throughput** — ... Bar fill: `background-color: #000000`.
> 7. **Data Summary** — `dsb-list` + `dsb-list-item` showing: ...

### Proposed — `S0`

> Each metric tile carries a title label, a primary value, an optional trend badge
> signalling direction, and an optional sub-label. Match the Figma frame exactly.
>
> 1. **Active Users** — value `1,284`, trend `+12%` reading as positive, sub-label
>    `"vs last 7 days"`.
> 5. **Request Throughput** — seven bars, Monday to Sunday, heights proportional to value.
>    No charting library. Bars render in the darkest available foreground colour.
> 7. **Data Summary** — a list of label/value pairs: Requests/min `4,820`, ...

Note what changed in item 5. `#000000` left the prompt. The question "what colour are the
bars" now has to be answered by the arm — and that is a measurement, because the decisions
layer has no pure black (see `SCORERS.md` §3, 9.8). An arm that answers
`--ds-decisions-color-surface-emphasis` behaved well. An arm that answers
`--ds-color-options-neutral-1000` crossed the boundary. An arm that answers `#000` invented
a value the system had no word for, which may be the only honest option available to it.

All three are different results. The current spec collapses them into one by supplying the
answer.

### Arm overlays

- **A** — nothing. `S0` alone
- **A′** — `spec-no-ds.md` §6 Design Values, plus the global CSS classes it defines,
  presented as a styleguide document
- **B** — install `@jablonowski/dsb-components` and `@jablonowski/dsb-tokens`; package
  READMEs reachable. No API table
- **C** — B plus `llms.client.txt` and `contracts.json` in context
- **D** — C plus the MCP resolver connected

`SPEC.md` §5's API table is deliberately **not** an overlay. It is the content of
`llms.client.txt` restated by hand — and whether the agent can work without that restating
is the thing arm C exists to find out. If C fails where the hand-written table would have
succeeded, the gap between them is a work item for `llms.client.txt`, and the second run
measures the repair.

## Order of work

1. ~~Settle the `public.css` defect~~ — done. `@jablonowski/dsb-tokens@1.0.10` ships a
   public stylesheet that resolves all 261 variables the component library reads, with the
   raw palette still withheld
2. ~~Rewrite §3 and §4 into `S0`~~ — done. `S0.md`, 245 lines, no component name, no token
   name, no colour and no measurement anywhere in it
3. ~~Extract the overlays~~ — done. `arms/A.md`, `arms/A-prime.md`, `arms/B.md`,
   `arms/C.md`, `arms/D.md`
4. **Review `S0.md` line by line.** Every sentence in it reaches all five arms at once
5. Freeze the zone mapping and the reimplementation heuristic
6. Fill in the pre-registration table in `PROTOCOL.md`, including the falsifier
7. Only then run anything

## What was checked after the rewrite

- 36 distinct user-facing strings appear in `SPEC.md` §3–§4 — copy, labels, placeholders,
  column headers. All 36 survive in `S0.md`
- `S0.md` contains no hex colour, no `px`, no `rgba()`, no `dsb-*` and no `--ds-*`

The second check matters more than it looks. The old §3 shipped a complete
`UserProfileMenuComponent` — TypeScript, template and CSS carrying `#fff`, `#e5e5e5`,
`rgba(0,0,0,.10)`, `8px` and `160px` — and §4 shipped ~60 lines of modal CSS in the same
style. Every arm would have inherited those literals from the prompt and scored them on the
raw-value metric, including the arms that exist to show the metric going to zero.

What survives is the requirement that produced the hack. The spec said "do not use the
library's dropdown here, it clips at the right edge, here is a hand-rolled one instead";
`S0` says the menu sits at the right edge and must open leftward and stay visible. Whether
an arm walks into the clipping problem is now something the run finds out.
