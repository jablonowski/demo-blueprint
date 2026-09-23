# Evaluating a design system as AI infrastructure

Status: **design, not yet run.** Nothing in here has produced a number.

## What this measures, and what it does not

The thesis under test is that a design system constrains what an agent can get wrong —
that it is a firewall, not a convenience. So the experiment measures **how narrow the
output is**, not how cheap it was to produce.

Token consumption is kept as a secondary axis, deliberately demoted. The design system
*adds* context: `llms.client.txt`, `contracts.json`, round trips to the resolver. An agent
without it writes forty lines of hardcoded CSS in one pass and spends fewer tokens than
one that asks three questions first. If the measurement shows the infrastructure is more
expensive, that is a true result and not an interesting one.

The claim worth defending is: it costs more per generation and less per **accepted**
screen, because the rework is where the money is. Report both or neither.

## Arms

Five, because the interesting question is not whether a design system helps but **which
layer of it does the work**. The prompt is byte-identical across all five. The only
variable is what the agent can reach.

| Arm | What the agent gets |
|---|---|
| **A** | `S0` only. No packages, no styleguide. Invents everything |
| **A′** | `S0` + design values as prose — a styleguide document, no installable artifact |
| **B** | `S0` + npm packages installed + package READMEs |
| **C** | `S0` + packages + `llms.client.txt` and `contracts.json` in context |
| **D** | `S0` + packages + AX artifacts + `@jablonowski/dsb-tokens-mcp` connected |

**A′ earns its place.** "We have a Figma and a styleguide page in Confluence" is where most
organisations actually are. If A′ scores like C, the machine-readable layer is not paying
for itself and the book has to say so. It is the most uncomfortable arm and therefore the
one worth running.

**If D ≈ C**, the live resolver is decoration and the static artifacts carry the value.
Also a result, also publishable, and cheaper to act on.

## The prompt: one spec, five contexts

`SPEC.md` and `spec-no-ds.md` currently differ by 4 KB and by content, so any difference
in outcome is attributable to the prose as easily as to the infrastructure. They are split
into:

- **`S0`** — functional and visual requirements only. Routes, layouts, mock data schema,
  deliverables, acceptance criteria, the Figma reference. Identical bytes in every arm.
- **arm overlays** — everything currently written as prose that is really infrastructure:
  the component API table, the design values, the gotchas.

Nothing is deleted. Material moves from the prompt into the condition being tested, or
into the scoreboard.

## The gotchas are results, not specification

`SPEC.md` §9 lists nine behaviours "verified against the actual library ... to avoid
rework". Each one is a correct answer written into the exam:

> 9.4 `dsb-footer` — `FooterColumn.heading` Not `.title`
> 9.2 `dsb-column` Template — `#cell` + `let-row="row"` Required
> 9.5 `dsb-modal` — `[modal-title]` slot is mutually exclusive with `title`

These are the hallucination metric, pre-answered. Every one of them is also evidence that
the machine-readable layer failed to carry that information and a human had to. That is
the finding.

They move to `SCORERS.md` as nine binary checks. If arm D answers them unaided and arm B
does not, the AX layer is worth its cost, with a number attached. If **nobody** answers
them, the information is missing from `llms.client.txt` — add it, re-run, measure the
delta. That loop, not the first table of results, is the contribution.

## Covered zone and gap zone

`SPEC.md` §5 already names six components the system does not provide: `AuthCard`,
`MainLayout`, `UserProfileMenu`, `MetricCard`, `ThroughputChart`, `LogsCard`.

Score the two zones **separately**. Merged, they hide the only interesting number.

In the gap zone, classify behaviour:

1. **Composes** — builds the missing piece from existing components and decision tokens
2. **Extends correctly** — writes new CSS, but only against `--ds-decisions-*`. The
   firewall held
3. **Defects** — hardcodes values, reaches into tier 1 or tier 3, or pulls in a library.
   The firewall broke

And the question no unit test can answer:

> When the agent asks the resolver about something outside the system and receives
> `no-coverage`, does that change what it writes — or does it ignore the refusal and put
> `#3b82f6` in anyway?

The MCP contract suite proves the resolver refuses. It cannot prove the refusal has any
effect. That distinction — contract versus control — is the centre of the chapter.

## Two cheaper experiments that may matter more

**Drift.** Generate once per arm. Change one decision token, republish, rebuild. Count the
application files that had to change. In D it should be zero; in A it is N. One command,
one number, and it measures maintenance rather than authorship — which is where the cost
actually lives.

**Second agent.** A fresh session with no memory: "add a fourth screen consistent with the
existing three." Does the infrastructure carry context *between* agents? That is the real
Agent Experience claim. One agent getting it right once is not it.

## Method

- **n = 5 per arm.** Median and spread, never a single run. At this app size the token
  differences will drown in run-to-run variance; the raw-value and hallucination counts
  will not
- **Same model, same temperature, every arm.** GitHub Copilot in VS Code does not report
  usage cleanly — if cost is to be measured at all, run through a harness that does
- **Scorers are committed scripts**, run identically on every arm. Nothing is judged by eye
- **Pre-register the metrics** — fill the table below *before* the first run. You built
  this system, you are writing a book about it, and you want a particular answer. This is
  the only protection against picking the metric that won
- **Harness.** Claude Code 2.1.281, headless, one fresh directory per run under `/tmp`,
  outside any tree containing a `CLAUDE.md`. `--strict-mcp-config` so the global MCP
  configuration cannot add a server an arm was not meant to have, and an empty `--settings`
  file so no hook or permission rule from `~/.claude` differs between one run and the next.

  Runs use `BARE=0` — the logged-in session rather than a token — which leaves `~/.claude`
  in play. Inspected on 2026-09-23 and recorded here rather than assumed: `settings.json`
  contains `{"theme": "dark"}` and nothing else, and `plugins/` holds only the marketplace
  catalogue with no plugin enabled. Nothing there contributes a skill, a tool or a rule to
  a run. If that changes mid-experiment, the runs before and after are not comparable

- **Report the arm where the design system loses.** There will be one. A chapter without
  it reads like a brochure

## Threats to validity, to be stated in the book

- One design system, one application, one model. A case study, not a benchmark
- The model has strong priors for Material and Tailwind; arm A will produce competent
  generic UI. That is realistic, not a flaw
- The design system is private, so there is no training contamination — a genuine
  advantage worth mentioning
- The author of the system wrote the eval. Pre-registration and committed scorers are the
  mitigation; say so plainly rather than hoping nobody asks

## Pre-registration

Recorded 2026-09-23, before any run. Predictions by Claude, reviewed and accepted by the
author. A prediction that turns out wrong is worth more than one that turns out right: it
means the system behaved in a way its own author did not expect.

### The falsifier

> If arm **D** hand-implements **more than one** of the components the library already
> provides, the machine-readable layer is not worth building.
>
> One exception is defensible if it has a reason. Two means the agent cannot see what it is
> holding.

The single reimplementation expected to be defensible is the **role selector** in the edit
and invite dialogs. The original specification told the agent to use a native `<select>`
there rather than the library dropdown, for full-width styling. If D reaches the same
conclusion on its own, that is a judgement about the component, not a failure to find it.
Naming it now so it cannot be argued afterwards.

### Denominators

- **14** components in the library; **13** have a natural home in this application
  (`dsb-radio-group` has none). The frozen slot map is in `SCORERS.md`
- **6** local components the layouts require, in the gap zone
- **9** checks derived from the old §9

### Predictions

| Metric | A | A′ | B | C | D |
|---|---:|---:|---:|---:|---:|
| Raw values — covered zone | 180 | 70 | 30 | 10 | 8 |
| Raw values — gap zone | 120 | 50 | 30 | 20 | 15 |
| Component slots used (of 13) | — | — | 8 | 11 | 11 |
| **Reimplemented despite being available** | — | — | **3** | **1** | **1** |
| Hallucinated API references | — | — | 6 | 1 | 1 |
| Checks passed (of 9) | — | — | 2 | 6 | **6** |
| Tier boundary crossings | — | — | 3 | 0 | 0 |
| axe violations | 6 | 5 | 3 | 2 | 2 |
| Builds (of 5 runs) | 5 | 5 | **3** | 5 | 5 |
| **Drift — files to change** | 20 | **1** | 1 | 0 | 0 |
| Input context (~tokens) | 3.2k | 3.8k | 3.2k | 4.1k | 3.4k + tool calls |

### Where the design system is predicted to lose

Written down in advance so they read as findings rather than as excuses.

**A′ ties D on drift.** The styleguide defines CSS custom properties in `:root`. Changing
one value means changing one file — exactly as in D. The drift advantage is a property of
custom properties, not of a published design system. Sell drift against literals, not
against a document that happens to contain variables.

**D does not reach zero raw values.** Figma's MCP server hands the agent exact hex and
pixel values, faster than the resolver answers and with a pixel-perfect guarantee. The
prediction is 8, not 0. A result of 0 would mean the infrastructure beat convenience, which
is a stronger claim than this table makes.

**D does not beat C on the nine checks, and should not.** The resolver answers questions
about tokens, not about component APIs. `FooterColumn.heading` versus `.title` lives in
`llms.client.txt`, not in MCP. The prediction is a 6–6 draw. **If D wins here, something is
wrong with the experiment** — that knowledge does not travel through that channel.

That last one is a prediction of no difference, and it does more for the credibility of
this table than any of the others.

### Least confident

**A′ leaking specifically on spacing.** That styleguide has typography, colour, surfaces,
borders, shadow, radius and motion — and **no spacing scale**. The prediction is that A′'s
~70 literals are overwhelmingly dimensional and almost never chromatic. Very specific, very
easy to falsify.

**B building 3 times in 5.** The bet is that B fails on import names: the library exports
`ButtonComponent`, not `DsbButtonComponent`, and an agent without the contract will guess a
prefix. It is the sharpest B→C difference in the table and the only predicted hard build
failure.

### Pilot, D-1, 2026-09-23

One run of arm D, before the scored runs, to find out what a run costs and what it produces.
Recorded here because it is the only observation that informed the scoring rules, and it is
therefore **not** one of the five scored D runs.

```
builds                      yes, 1.3 s
component slots used        13 / 13
reimplemented                0
distinct --ds-decisions-*   57
--ds-component-* in app      0
tier 1                       0
stylesheet imported         @jablonowski/dsb-tokens/css
raw values                   2
cost                        $2.35   ·   6 min 27 s
input                       3,195,371 tokens (76 fresh, 116k cache write, 3.08M cache read)
output                      40,184 (7,357 thinking)
```

The two raw values are the `960px` and `600px` media query breakpoints. The token set has no
breakpoint scale, so they are not literals in the sense the metric is about.

**Where the predictions were wrong, all in the design system's favour.** Predicted 11 of 13
slots and one reimplementation; got 13 and none — including `dsb-dropdown`, pre-registered
as the defensible exception, which turned out not to be needed. Predicted 8 raw values in
the covered zone and 15 in the gap zone; got 2 in total, neither of them a design value.

**The pre-registered edge case resolved as "composes".** The chart bars need a pure black
the decisions layer does not have. The agent did not write `#000000` and did not reach into
tier 1:

```css
/*
 * The design asks for pure black. The decisions layer has no pure-black foreground, so the
 * bar uses the filled high-contrast surface — the darkest non-action colour the system offers.
 */
.chart-bar { background: var(--ds-decisions-color-surface-emphasis); }
```

The original specification instructed the agent to hardcode black at exactly this point.
With that instruction removed, it found a better answer and wrote down why.

**Two things the pilot broke.** Four of the six local components were never created as named
components, so the zone rule had nothing to match and is redefined in `SCORERS.md`. And an
ad-hoc grep over the templates missed every multi-line tag, briefly making it look as though
the falsifier had triggered — a scorer would have reported a failure of the infrastructure
that was a failure of a regular expression.

**On cost.** Input was 3.2M tokens against a 17 kB prompt, almost all of it cache reads of
what the agent fetched and re-read for itself: Figma, its own files, npm output. The context
difference between arms will be a rounding error inside that. `inputTokensTotal` measures
how hard an agent worked far more than it measures what the infrastructure weighs, and the
cost axis is weaker than even its demoted position assumed.

Twenty-five runs at this rate: roughly $59 and 2.7 hours.

### Results

Filled in after the runs. Do not edit anything above this line.

| Metric | A | A′ | B | C | D |
|---|---|---|---|---|---|
| | | | | | |
