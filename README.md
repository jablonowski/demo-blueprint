# Does a design system change what a coding agent writes?

A pre-registered experiment. One specification, one application, several levels of
infrastructure, and a set of committed scorers that reduce every run the same way.

The design system under test is [**design-system-blueprint**](https://github.com/jablonowski/design-system-blueprint) —
a three-tier token pipeline, an Angular component library, machine-readable contracts for
agents, and npm publishing.

> **Status: stage one complete at n = 5, the study continues.** Thirty scored runs — five
> arms at n = 5 on Claude Opus, and the same five at n = 1 on Claude Sonnet as a second
> model. The drift and acceptance-rate measurements are still open; arms A′ and C have three
> runs each that were taken outside the round structure, which is stated with their results;
> and the convention grid dropped from eight checks to seven on 2026-10-07, for a reason
> recorded in the protocol.
>
> The raw data and the method are below. The readings — including the pre-registered
> comparison that went against this repository's own premise — are in
> [`eval/PROTOCOL.md`](eval/PROTOCOL.md), kept there rather than here so that the numbers
> and the interpretation stay separable. They will move as runs accumulate.


---

## Raw results

Two models, thirty scored runs, identical specification and identical design data in every
one. Per-run records: [`eval/results/`](eval/results) — one `<arm>-<n>.json` with the harness
record and one `<arm>-<n>.score.json` with every metric and its detail. The generated
applications and their screenshots are in [`eval/runs/`](eval/runs).


### Claude Opus, n = 5 per arm

| Metric | A-1 | A-2 | A-3 | A-4 | A-5 | A′-1 | A′-2 | A′-3 | A′-4 | A′-5 | B-1 | B-2 | B-3 | B-4 | B-5 | C-1 | C-2 | C-3 | C-4 | C-5 | D-1 | D-2 | D-3 | D-4 | D-5 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Library components used (of 13) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 | 13 |
| Components hand-reimplemented | 13 | 12 | 12 | 12 | 12 | 13 | 13 | 13 | 13 | 13 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Scattered raw values | 6 | 0 | 0 | 6 | 4 | 139 | 132 | 133 | 146 | 138 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 | 2 |
| Custom properties declared locally | 90 | 99 | 91 | 89 | 88 | 28 | 27 | 27 | 27 | 27 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0 | 0 |
| Tier boundary crossings | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Design-system decision tokens used | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 60 | 57 | 60 | 62 | 56 | 61 | 62 | 59 | 59 | 59 | 77 | 56 | 59 | 58 | 59 |
| Hallucinated API references | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Convention checks passed (of 7) | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | 6 | 7 | 6 | 6 | 6 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 | 7 |
| Values authored by the run | 96 | 99 | 91 | 95 | 92 | 167 | 159 | 160 | 173 | 165 | 0 | 0 | 0 | 6 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 0 | 2 |
| Colour conformance rate | 0.91 | 0.85 | 0.79 | 0.84 | 0.94 | 0.57 | 0.64 | 0.57 | 0.64 | 0.59 | — | — | — | 1.00 | — | — | — | — | — | — | — | — | — | — | — |
| Conformance rate, overall | 0.92 | 0.88 | 0.85 | 0.86 | 0.92 | 0.87 | 0.88 | 0.86 | 0.87 | 0.87 | — | — | — | 1.00 | — | — | — | — | — | — | — | 1.00 | 0.50 | — | 0.00 |
| Near-miss values | 2 | 2 | 3 | 3 | 2 | 11 | 9 | 10 | 9 | 10 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| axe violations — serious | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 2 | 2 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| axe violations — critical | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Builds | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes | yes |
| Cost (USD) | 2.06 | 2.54 | 2.17 | 2.64 | 2.29 | 2.19 | 2.11 | 2.02 | 1.98 | 1.88 | 3.20 | 3.19 | 2.82 | 3.61 | 2.92 | 3.13 | 2.69 | 2.83 | 2.76 | 3.43 | 3.15 | 2.88 | 2.86 | 3.05 | 3.04 |

### Claude Sonnet, n = 1 per arm

| Metric | A-1 | A′-1 | B-1 | C-1 | D-1 |
|---|---:|---:|---:|---:|---:|
| Library components used (of 13) | 0 | 0 | 13 | 13 | 12 |
| Components hand-reimplemented | 13 | 13 | 0 | 0 | 1 |
| Scattered raw values | 46 | 117 | 17 | 5 | 2 |
| Custom properties declared locally | 71 | 27 | 0 | 0 | 0 |
| Tier boundary crossings | 0 | 0 | 2 | 0 | 0 |
| Design-system decision tokens used | 0 | 0 | 49 | 54 | 58 |
| Hallucinated API references | 0 | 0 | 0 | 0 | 0 |
| Convention checks passed (of 7) | n/a | n/a | 5 | 6 | 6 |
| Values authored by the run | 117 | 144 | 17 | 5 | 2 |
| Colour conformance rate | 0.73 | 0.69 | 1.00 | — | — |
| Conformance rate, overall | 0.83 | 0.86 | 0.94 | 0.40 | 0.50 |
| Near-miss values | 10 | 9 | 0 | 0 | 0 |
| axe violations — serious | 3 | 2 | 1 | 0 | 0 |
| axe violations — critical | 0 | 0 | 0 | 0 | 0 |
| Builds | yes | yes | yes | yes | yes |
| Cost (USD) | 4.75 | 4.18 | 6.63 | 7.21 | 8.82 |

### Which convention checks failed, run by run

Claude Opus, all fifteen runs that held the library. Every check applied in every run; there
is no `n/a` in this grid.

| | B-1 | B-2 | B-3 | B-4 | B-5 | C-1 | C-2 | C-3 | C-4 | C-5 | D-1 | D-2 | D-3 | D-4 | D-5 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `9.2` `#cell` + `let-row="row"` | **fail** | pass | **fail** | **fail** | **fail** | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |
| all other checks | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass | pass |

On Sonnet, one run per arm: B fails `9.2` and returns `n/a` on `9.4`; C returns `n/a` on
`9.4`; D returns `n/a` on `9.3`. No other check failed on either model.

The grid had an eighth check, `9.6`, until 2026-10-07. It asked whether a split modal footer
set `flex:1` on the projected element, and it returned `n/a` whenever the run had not built
one — five of the fifteen Opus runs above, spread across all three arms. It was removed
because it reported on what the agent chose to build rather than on what it knew about the
component API, and because that `n/a` pattern was producing an apparent C-versus-D difference
that does not exist. The reasoning is in
[`eval/PROTOCOL.md`](eval/PROTOCOL.md); the definition is in git history.

### Which routes failed a contrast check

`color-contrast` is the only `serious` rule that fired anywhere in the study, except one
`aria-prohibited-attr` on Sonnet B-1.

| | /login | /dashboard | /users |
|---|---|---|---|
| **A** — Figma frames only, 6 runs | fail | fail | fail |
| **A′** — plus a styleguide document, 5 runs | pass | fail | fail |
| **A′** — plus a styleguide document, 1 run (Opus A′-5) | fail | fail | fail |
| **B, C, D** — the library, 18 runs | pass | pass | pass |

`/login` carries no status tags; `/dashboard` and `/users` do. The tag colours are prescribed
by A′'s styleguide and three of the four pairings miss WCAG AA — `#16a34a` on `#f0fdf4` at
3.15:1, `#ca8a04` on `#fefce8` at 2.84:1, `#dc2626` on `#fef2f2` at 4.41:1.

The same styleguide also defines `--color-text-muted: #999999`, which reaches 2.50:1 to 2.85:1
against the four surfaces the document itself defines and so passes AA on none of them. Five
of the six A′ runs used `--color-text-secondary` on the login screen and one used `muted`;
that single choice is the whole difference between the two A′ rows above.

`n/a` is not a pass. The seven checks are all about the component library's API, so they do
not apply to an arm that has no library. The conformance rate is computed only over values the
run authored itself, so for the library arms — which authored between 0 and 17 — it is a
ratio over a handful of observations and is not comparable with A and A′, which authored 71
to 96. The authored count is in the tables above so that every rate can be read with its
denominator.

### Screenshots

Every run's screens as the harness rendered them, at 1280px and 390px:
[`eval/runs/<model>/<arm>-<n>/shots/`](eval/runs). Login, dashboard and users table for each
run, captured in the same pass that runs axe.

![Same spec, same Figma frames, same model — with and without the design system](docs/design-system-vs-not.png)

## What the columns mean

| Column | What it counts | Scorer |
|---|---|---|
| **Library components used** | Of thirteen pre-registered places in the spec where a library component has a natural home — login fields, submit, header, footer, avatars, the table, badges, modals, the role selector — how many were filled with one. Templates are parsed, not grepped: Angular writes attributes across lines and a pattern expecting a space after the selector misses them. | [`slots.js`](eval/scorers/slots.js) |
| **Hand-reimplemented** | Of those same thirteen, how many were built by hand instead. This carries the falsifier. | [`slots.js`](eval/scorers/slots.js) |
| **Scattered raw values** | Hex, `rgb()` or `px`/`rem` literals used directly in a declaration, in CSS the application authored. `0` and `1px` hairlines excluded. | [`raw-values.js`](eval/scorers/raw-values.js) |
| **Custom properties declared locally** | The same kinds of literal, but as the value of a custom property — a local token layer. Counted apart from scattered values because naming a gap and bypassing the system are opposite behaviours. | [`raw-values.js`](eval/scorers/raw-values.js) |
| **Tier boundary crossings** | `var(--ds-*)` in application code that is neither absent nor a tier-2 decision: the raw palette reached directly, or another component's private tokens. | [`tiers.js`](eval/scorers/tiers.js) |
| **Decision tokens used** | How many distinct `--ds-decisions-*` tokens the application actually referenced. | [`tiers.js`](eval/scorers/tiers.js) |
| **Hallucinated API references** | Bound inputs and outputs that do not exist on the component, and imported names the package does not export. Native DOM events and valid type imports are not counted — an earlier version reported nineteen of those and every one was invented by the scorer. | [`api.js`](eval/scorers/api.js) |
| **Convention checks** | Seven conventions removed from the specification, each a place where the machine-readable layer is known to be thin. Import names carry no `Dsb` prefix; `dsb-column` needs `#cell` and `let-row="row"`; nothing projects into `dsb-header`; `FooterColumn.heading` not `.title`; and so on. | [`checks.js`](eval/scorers/checks.js) |
| **Colour conformance rate** | Of the colours the application chose for itself, the fraction that are values the design system actually holds, compared against a committed snapshot of the published token package. Read it with the **values authored** row: an arm that authored nothing has no rate, and an arm that authored two values has a rate over two values. | [`conformance.js`](eval/scorers/conformance.js) |
| **Near-miss values** | Authored values with no exact match in the design system but one within tolerance — 24 units of sRGB distance, or 2px. Reported separately because they are the expensive class: indistinguishable on screen, and they will not move when the system moves. | [`conformance.js`](eval/scorers/conformance.js) |
| **axe violations** | WCAG 2.1 A and AA over the built screens, by impact, in a headless browser. | [`a11y.js`](eval/scorers/a11y.js) |
| **Builds** | Binary. A run that does not build scores nothing else. | [`build.js`](eval/scorers/build.js) |

Each judgement baked into these — the tolerances, the thirteen slots, the exclusions, and
what each one would fail to notice — is written out in [`eval/SCORERS.md`](eval/SCORERS.md).

---

## Method

### The arms

Every run is one specification plus one overlay, handed to a fresh session in an empty
directory outside any repository. The specification is byte-identical across arms. Only the
overlay differs.

| Arm | What the agent has | In the grid |
|---|---|---|
| **A** | the specification and the design frames, nothing else | all five rounds |
| **A′** | plus a styleguide document — palette, scale, component CSS, as prose | rounds 4–5; three earlier runs outside the rounds |
| **B** | plus the two npm packages installed; READMEs and type declarations readable | all five rounds |
| **C** | plus `llms.client.txt`, the guide written for agents | rounds 4–5; three earlier runs outside the rounds |
| **D** | plus the token resolver, connected as an MCP server | all five rounds |

A, B and D form a cumulative ladder with nothing skipped, which is what makes the two gaps
readable: **A→B** isolates shipping the system as an installable package, **B→D** isolates
the agent-facing layer on top of it.

**C splits that second gap.** D is C plus the resolver, so a B→D difference cannot be
attributed between the document and the tool without it. The protocol committed in advance
that if D beat B then C stopped being optional; D did, so C ran.

**Rounds 1–3 held three arms, not five.** Five runs did not fit inside one usage window —
measured three times — and a round split across windows reintroduces the confound that
running in rounds exists to remove. A, B and D ran as the ladder; C earned its slot
afterwards by the pre-registered rule (D beat B, so the attribution arm ran), and A′ ran
after that. Both were run as single-arm blocks of three on 2026-09-27.

**That is a weaker design, and rounds 4 and 5 repaired half of it.** On 2026-10-05 and
2026-10-06 all five arms ran inside one sitting each, by invoking the runner three times
back to back. So A′ and C now stand on two controlled observations and three uncontrolled
ones, while A, B and D stand on five controlled ones. Every comparison in this repository
involving A′ or C is still partly a comparison of two sittings. The full repair is three
more five-arm rounds; see [`eval/PROTOCOL.md`](eval/PROTOCOL.md).

**Arm B required a deletion.** The published `@jablonowski/dsb-components` ships
`llms.client.txt` inside the tarball and its README points at it, so "the package without
the agent-facing contract" does not exist in the wild for this design system. The harness
removes that one file after install and asserts its absence before and after the run.

### The specification

[`eval/S0.md`](eval/S0.md) describes a small CRUD application: login, a metrics dashboard, a
users table, four dialogs. It names **zero component names and zero design values**. If it
said `<dsb-button>` or `#111111`, every arm would be handed the answer to what is being
measured.

### The design source

The Figma file, served through a **recorded** channel
([`eval/scripts/figma-cache-mcp.js`](eval/scripts/figma-cache-mcp.js)). The recording
replays the real Figma MCP server under the same tool names and input schemas, so an arm
calls `get_figma_data` exactly as it would live.

Two reasons. Every arm then receives byte-identical design data, in every round — five live
fetches are five slightly different conditions. And one arm's run empties the Figma API
quota for days, which makes a live channel unaffordable for a grid: in the round that
established this, arm A ran with design data and the rest got `429, retry after 4.6 days`.

The recording is pruned to the frames the specification names. The full file also carries
the design system's own component library as a canvas, and serving that would hand arm A
the thing arm A is defined by not having.

### Rounds

A round is run *n* of every arm, back to back in one sitting. Running a whole arm at a time
would make the arm and the day the same variable: if A runs on Tuesday and D on Friday and
the served model changes on Wednesday, nothing in the results separates the two. The cost is
that runs *within* an arm spread over days, which shows up as variance — the cheaper
confound, because the table reports variance and does not report drift.

### Pre-registration

[`eval/PROTOCOL.md`](eval/PROTOCOL.md) carries the predictions, recorded before the runs,
and a falsifier stated in advance:

> If arm D hand-implements more than one of the components the library already provides,
> the machine-readable layer is not worth building.

It records the predictions that failed as prominently as the ones that held, every decision
that changed the design mid-study and why, and every run that was discarded.

### What is excluded, and what is void

- A run that does not build scores nothing else and is recorded as a failed run, not as a
  run with zeroes.
- A run whose session ended in an API error, or that was denied a tool the arm is defined
  by, is **void** — not a bad score. `void.js` refuses to reduce it, and prints the reason.
  Two documented exceptions exist, each carried in the run's own record with its
  justification, so they can be audited rather than trusted.
- Earlier batches under different conditions are kept as pilots in
  `eval/results/*-pilot*/` and never scored. Each of them changed a rule, and a rule and a
  data point may not come from the same observation.

### What is not claimed

- **One application, one design system, one model.** A case study, not a benchmark.
- **n = 5 on the primary model, n = 1 on the second.** All five arms have run. Rounds 1–3
  held A, B and D only; C and A′ were added afterwards as single-arm blocks and first ran
  inside a round at 4 and 5. Three of each of their five observations therefore carry a
  between-sitting confound that no A, B or D observation carries.
- **The convention grid changed mid-study.** `9.6` was removed on 2026-10-07, after thirty
  runs, because it returned `n/a` whenever the agent had not built a split modal footer and
  so measured what was built rather than what was known. Removing it changed one reading in
  this repository — an apparent gap between arms C and D disappeared. Both the eight-check
  and seven-check totals are in the protocol.
- **Arm A′'s styleguide contains four colour definitions that fail WCAG AA** — three tag
  pairings and one text colour that passes on none of the four surfaces the same document
  defines. They were copied verbatim from the original no-design-system specification before
  anyone computed their contrast. The agent implemented them faithfully. That is reported as
  a result about what documents can carry, not as evidence that styleguides generally carry
  bad contrast.
- **The author of the design system wrote the evaluation.** Pre-registration, committed
  scorers and published raw data are the mitigation, not a substitute for independent
  replication.
- **Cost is measured for one harness.** Runs go through Claude Code headless, which reports
  usage. Another agent product would lose that column and would be a second study rather
  than a fifth arm.

---

## A note on the instrument

Seven times during this work a gate reported success while proving a different proposition
than the one it was written for. A visual-regression flag that disarmed the comparison it
gated. A published stylesheet that passed every test and could not render the library it
belonged to. A preflight check asserting that an API token was *present* rather than that it
*worked*, which let eight runs go out blind. A scorer that reduced a run aborted mid-session
to a row indistinguishable from an arm performing badly.

Each one was green. Each is recorded in [`eval/PROTOCOL.md`](eval/PROTOCOL.md) with what it
cost and what replaced it — not as an aside, but because an evaluation is only worth the
property its gates actually test.

---

## Running it

```bash
cd eval
npm install
./run.sh preflight        # credentials, flags, and the recorded design channel
./run.sh round 1          # run 1 of every arm, in one sitting
node score.js --all       # reduce every archived run to a row
```

| Command | |
|---|---|
| `./run.sh <arm> <n>` | a single run |
| `./run.sh remeasure <arm> <n>` | re-score and re-archive a run still on disk, without regenerating it |
| `./run.sh serve <arm> <n>` | install and open a generated application |
| `./run.sh import <arm> <n> <dir>` | score a run produced by a different agent, through the identical scorers |
| `./run.sh status` | what has been run so far |

Requires a Claude Code credential. The design channel is a committed recording, so no Figma
token is needed to run the experiment — only to re-record it.

---

## Repository layout

```
eval/
  S0.md            the shared specification, identical in every arm
  arms/            one overlay per arm — the only thing that differs between them
  PROTOCOL.md      pre-registration, predictions, failures, decisions, and why
  SCORERS.md       what each metric means and the judgements baked into it
  scorers/         the scripts that produce every number, with their tests
  reference/       the token snapshot and the recorded design channel
  results/         one record and one scored row per run
  runs/            the application each arm generated, and its screenshots
  run.sh           the harness
```

## Related

- [**design-system-blueprint**](https://github.com/jablonowski/design-system-blueprint) —
  the design system under test.
- `@jablonowski/dsb-tokens`, `@jablonowski/dsb-components`, `@jablonowski/dsb-tokens-mcp` on npm.

---

Part of broader research :)
