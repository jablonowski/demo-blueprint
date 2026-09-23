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

Fill in **before** the first run. Predictions made afterwards are not predictions.

| Metric | Prediction: A | A′ | B | C | D | Actual |
|---|---|---|---|---|---|---|
| Raw values, covered zone | | | | | | |
| Raw values, gap zone | | | | | | |
| Hallucinated API references | | | | | | |
| Gotchas answered unaided (of 9) | | | | | | |
| Tier boundary crossings | | | | | | |
| Components reimplemented | | | | | | |
| axe violations | | | | | | |
| Builds and renders | | | | | | |
| Gap behaviour: compose / extend / defect | | | | | | |
| Files touched by the drift test | | | | | | |
| Input tokens (median) | | | | | | |
| Output tokens (median) | | | | | | |
| Correction turns to acceptance | | | | | | |

**State the falsifier now:** which result would make you conclude the AX layer is not
worth building? Write it here before you look at anything.

>
