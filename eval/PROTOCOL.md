# Evaluating a design system as AI infrastructure

Status: **stage one complete, 2026-10-08.** Five arms, thirty-five scored runs — n = 5 on the
primary model and n = 2 on the second. The numbers are under “Results — stage one”; everything
above it is the pre-registration and the log of every rule that changed, with what the change
cost. The convention grid is seven checks since 2026-10-07; `9.6` was removed and the entry
below says why. The second Sonnet round withdrew two claims that had rested on a single run —
see the entry for 2026-10-08. Drift and cost-per-accepted-screen are still open.

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

- **Run in rounds, not in arms.** `./run.sh round <n>` runs run *n* of all five arms back
  to back. Running a whole arm at a time makes the arm and the day the same variable: if A
  goes on Tuesday and D on Friday and the served model changes on Wednesday, nothing in the
  results can separate the two. A round puts all five arms inside one sitting, so whatever
  drifts drifts across all of them, and five rounds give five independent estimates of the
  *differences* rather than five estimates of arm A. The cost is that the runs within an
  arm are spread over days — the cheaper confound to carry, because within-arm spread
  shows up as variance, which the table reports, and between-arm spread shows up as
  effect, which it does not. A round that loses an arm to a setup failure continues and
  records it; that arm is rerun on its own before scoring

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

### Pilot, run as D-1, reclassified C-0, 2026-09-23

One run intended as arm D, before the scored runs, to find out what a run costs and what it produces.
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

### What the pilot's denied tools showed

`permission_denials` in the pilot result lists eleven entries. Ten are
`mcp__dsb-tokens__resolve_token`; one is `mcp__figma__get_figma_data`.

`--allowedTools "Read,Write,Edit,Bash"` does not cover MCP tools. The resolver was attached
and unreachable for the whole run. **D-1 was not arm D.** It is a clean arm C run with a
server bolted on that never answered — which also means arm C, unaided, used 13 of 13
component slots and wrote no raw design values.

Nothing about the generated application looks wrong. It builds, it is clean, it scores well.
A run can measure the wrong condition and produce a perfect score, and the only trace is a
field nobody reads. The runner now grants each arm the MCP tools its definition requires,
names them individually so an arm cannot silently acquire a capability when a server adds
one, and prints a warning that declares the run void when anything was denied.

The denials are also a free record of what the agent wanted to ask, and it asked well:

```
fill colour of bars in a bar chart, darkest foreground colour available (pure black)
font family monospace for code / log text
terminal-style log viewer background (dark console)
read-only disabled boxed field background
small uppercase de-emphasised title label on a metric tile
floating menu panel elevation shadow
large focal metric value font size (display number)
background of a dashboard metric card / tile
page background behind cards
border of a card
```

The first two are precisely the two token gaps pre-registered in `SCORERS.md` — no pure
black, no font family. The agent found both without the resolver, and handled the first by
composing rather than by hardcoding. When arm D is run properly, the question becomes
whether ten answers change any of that.

### Pilots A-0 and D-0, and an amendment, 2026-09-24

Two more runs before the scored ones: arm A, the control, and the first arm D in which the
resolver was actually reachable — the earlier `D-1` had the MCP tools attached but excluded
by `--allowedTools`, so it was an arm C run and has been reclassified as `C-0`.

Both are recorded here as **pilots** (`A-0`, `D-0`) and neither is one of the five scored
runs, for the same reason `C-0` is not: what they showed changed a scoring rule, and a rule
and a data point may not come from the same observation.

```
                slots  reimpl  scattered  declared  decisions  checks  a11y  turns   cost
  A-0          0/13   13      4          70        0          n/a     2     29      $1.41
  C-0          13/13  0       0          0         57         8/8     —     53      $2.35
  D-0          13/13  0       0          2         61         7/8     0     63      $2.41
```

**What A-0 showed.** The control did not scatter literals. It wrote a design system:
`src/styles.scss` opens with a handbook comment and declares seventy custom properties,
correctly layered, consistently applied, four stray literals in the entire application. On
the headline metric — raw values — the arm with no design system beat two of the three arms
that had one.

The palette it chose is zinc. `#18181b` where the system says `#111111`, `#71717a` for
`#6f6f6f`, `#e4e4e7` for `#e8e8e8`. Twenty of its twenty-nine authored colours sit within
19.2 sRGB units of a value the system already holds, and none of them are it.

That is a better finding than the one the experiment was designed to produce, and the
scoring as it stood could not see it. **The naive claim — "without a design system the agent
scatters raw values" — is false**, at least for this model. The claim that survives is
narrower and more useful to the book: *without a shared reference, a capable agent builds a
competing design system.* Discipline is not the scarce resource. Agreement is.

**The amendment.** `SCORERS.md` §9, conformance, added 2026-09-24, before any scored run.
It classifies every colour and length the application authored as matched, divergent or
novel against a committed snapshot of the published token package. Frozen, with its
tolerances, before the first scored run and after the last pilot.

Pre-registering it now, with the same standing as the table above — and noting that the
pilots are what suggested it, which is exactly why they cannot also be evidence for it:

| Metric | A | A′ | B | C | D |
|---|---:|---:|---:|---:|---:|
| Authored colours | 28 | 20 | 12 | 3 | 2 |
| **Colour conformance rate** | **0.2** | 0.5 | 0.7 | — | — |
| **Divergent (near-miss) colours** | **18** | 8 | 3 | 0 | 0 |
| Novel colours | 3 | 2 | 1 | 1 | 1 |

And the prediction that would embarrass the thesis if it fails: **A′ — the styleguide
document — should collapse the near-miss count without eliminating it.** A document that
states the values gets the agent most of the way; only a published artifact the build reads
gets it the whole way. If A′ scores near zero divergent colours, then a markdown file is
enough and the infrastructure argument is weaker than this book claims.

**A second finding to watch, not yet a metric.** axe: A-0 has two serious violations, both
colour-contrast, on the dashboard and the users page. D-0 has none. The contrast of the zinc
palette against its own surfaces was never checked by anything; the system's pairs were.
That is "Look & Feel vs Behavior" arriving as a number rather than an assertion, and it is
already measured by §6 — no amendment needed.

### Round 1, 2026-09-24 — split by a session limit

Three arms completed in one sitting, 07:42–08:06Z. `C-1` was aborted by a 429 at turn 22
and `D-1` never started; the account's session limit reset at 11:40 Warsaw, and both were
rerun after it. Round 1 is therefore split across two sittings roughly three and a half
hours apart, same day, same CLI build, same model string. Recorded rather than smoothed
over: it is a smaller confound than running arms on different days, which is what the round
design exists to avoid, but it is not nothing and `C-1` and `D-1` carry it.

The aborted run also found a hole in the scoring. `score.js` reduced the half-built `C-1`
to `slots 10/13, checks 5/8, BROKEN` — a row indistinguishable from arm C doing badly.
`scorers/void.js` now refuses to score any run whose record shows an API error or a denied
tool, and prints `VOID` with the reason instead. A measurement that did not happen may not
look like a poor measurement. One documented exception, `scoring.ignoreDenials`, carried in
the run's own record: `C-0`, where the denials are what make it an arm C run.

### Two conditions that were never the designed ones, 2026-09-24

Both found by reading the agents' own final messages rather than by any assertion in the
harness, which is the finding about the harness.

**Figma has never worked.** `403 Token expired`, through the MCP server and on a direct REST
call, in every run recorded so far — `A-1`, `A-prime-1`, `B-1`, and both pilots `C-0` and
`D-0`. `S0` §2 says "Treat Figma as the visual truth"; no run has ever seen a frame. The
condition has at least been uniform, so the comparisons between runs hold, but the
pre-registration does not: it predicts D reaching 8 raw values rather than 0 *because*
"Figma's MCP server hands the agent exact hex and pixel values". That channel was never
open, so that prediction was never tested.

The uncomfortable part is which way the accident cut. **The most useful finding in the
experiment exists because Figma was dead.** Had arm A been handed `#111111` from a frame, it
would have used it, and the zinc palette — seventy disciplined custom properties, twenty
near-miss colours, a second design system — would never have appeared. A broken token
produced the thesis.

That makes Figma-live and Figma-dead two different experiments rather than one experiment
and one outage:

- **Figma-dead** — what the agent does when it has to source design values from somewhere.
  The design system channel, isolated. This is the grid.
- **Figma-live** — whether the design system adds anything *on top of* a pixel-exact source.
  A harder test, and the one a sceptical reader asks for. Worth two arms later, not the grid:
  note that Figma hands over values, not decisions — `#111111`, never `text.primary` — so it
  should improve conformance and worsen tier discipline at the same time. That is a
  prediction, and it is cheap to check.

**Arm B never existed as specified.** The published `@jablonowski/dsb-components` ships
`llms.client.txt` and its README points at it, so "the packages, and nothing about them"
included arm C's defining artifact. `B-1` stayed clean only because the agent declined to
open the file and said so. `assert_isolation` did not catch it: it checked what the harness
had *added* to arms A and A-prime, never what an arm already *had*. Fixed in both places —
the file is deleted after install and its absence asserted before and after the run.

### Decision: Figma stays, and the gate that let it die is fixed, 2026-09-24

Figma MCP is kept as the visual truth for every arm, on the author's call, for three
reasons that hold and one that does not.

**It holds** that Figma is the source of truth for design intent; that the six local
components in the gap zone — the profile menu, the metric tiles, the chart, the log panel,
the auth card — are *built*, not adopted, so the frames are the only thing standing between
the agent and inventing them, and the gap zone is where raw values and conformance are
measured; and that an exported PNG is a second artifact to keep current, stale the moment
the design moves.

**It does not hold** that the reader should see the tool being used. That is a reason to
write a section, never a reason to shape an experiment. Noted so that it is not load-bearing.

**What the decision costs, stated in advance.** Figma MCP hands over `#111111`, never
`text.primary`. It supplies values, not decisions, so it should improve conformance and
worsen tier discipline at the same time — and it puts the thesis against its strongest
adversary, because a pixel-exact queryable source is the best argument that a token pipeline
is unnecessary. That is the braver test and the right one. It also reframes what the design
system is selling: not *the right value*, which Figma also has, but *the name that survives
the value changing*. A rebrand moves `#111111`; it does not move `text.primary`.

Added to the pre-registration on that basis, before any scored run:

| Metric | A | A′ | B | C | D |
|---|---:|---:|---:|---:|---:|
| Colour conformance rate, screens **in** the frames | 0.9 | 0.9 | 0.9 | 0.95 | 0.95 |
| Colour conformance rate, states **not** in the frames | **0.3** | 0.5 | 0.8 | 0.9 | 0.9 |
| Tier 1 / raw-value crossings in covered zone | — | — | 6 | 4 | 3 |

The claim in one line: **conformance decays with distance from the mockup, and the design
system is what stops the decay.** If A holds conformance on states the frames never showed,
the thesis is weaker than this book claims and that is the finding.

**The gate.** `preflight` asserted `[[ -n "$FIGMA_API_KEY" ]]` and printed `Figma: key
present`. Presence is not the property being guarded. A token expired months earlier
satisfies it, and eight runs went out blind against a 403; the only record of it anywhere
was prose in the agents' final messages. Preflight now calls the Figma API for the node S0
names and refuses to start on anything but 200, `one()` re-checks before and after each run
and records both codes, and `scorers/void.js` refuses to score a run where the channel was
shut. `load_env` also exports `FIGMA_ACCESS_TOKEN` as well as `FIGMA_API_KEY`, because S0
promises the former and only the latter was ever set.

This is the fifth instance of one failure mode in this project: `generateOnly` disarming
`failOnDifference`, `public.css` passing every test while unable to render the library, the
`npm-auth` job parked under `defaults:`, credential checks testing the shape of a string
rather than the validity of a credential, and now a preflight testing that a key exists
rather than that it works. Every one of them was green. The chapter writes itself.

**Everything run so far is the pilot phase.** Eight runs, moved to `results/opus-5-5-pilot/`
and `runs/opus-5-5-pilot/`. Each one changed a rule: the zone definition, the conformance
scorer, the void guard, the arm B deletion, the Figma gate. None may be scored evidence for
rules it produced. `S0` also changed (§2 no longer points at a `.vscode/mcp.json` the
harness does not use), so `s0Sha` moves from `a8b26e1f589b` to `c8c6a6d151a5` and nothing
before it is comparable anyway. The grid starts empty.

### The Figma channel becomes a recording, 2026-09-24

Keeping Figma (previous section) turned out to be unaffordable as a live call. Figma's
`/files/{key}/nodes` endpoint carries a per-seat quota, and **one arm's run empties it**: on
the evening of the 24th, arm A ran with a working channel and arms B, C and D each got
`429, retry after ~397,000 seconds` — 4.6 days — with the error naming the Starter plan's
Viewer-seat limit. Waiting does not help, because the next round would do it again. A
twenty-five run grid is months.

So the channel is kept and the call is not. `scripts/capture-figma.js` records what the real
`figma-developer-mcp@0.13.2` answers, and `scripts/figma-cache-mcp.js` replays it under the
same tool names and the same input schemas. An arm calls `get_figma_data` exactly as it
would live; what changes is that the answer is identical across arms, across rounds and
across months, and costs nothing. The server reports itself as `0.13.2+cached` — not
`0.13.2`, which would be false, and not a banner announcing a cache, because telling an
agent something about the nature of its tools is a variable this experiment did not mean to
introduce.

Three things the arrangement had to get right, each of which was a way to get it wrong:

**The recording is pruned.** The quota forced the capture through the whole-file fallback,
and a whole-file payload carries all three canvases — including `🧩 Components`, the design
system's own library, and `🎯 Design Tokens (reference)`. Serving it would have handed arm A
the library it is defined by not having: `llms.client.txt` again, in a different file.
`scripts/prune-figma-capture.js` cuts each response to the requested subtree and garbage
collects the shared `GLOBAL_VARS` and `ELEMENTS` tables against it, and refuses to write if
either canvas name survives. The Demo canvas goes 112 kB → 52 kB; each modal → 9 kB.

**Which fetch path was used is recorded per node**, not smoothed over. All three targets say
`whole-file-fallback` with the `/nodes` error kept beside them. Same content for the same
subtree, but not the same request, and a reader is entitled to know which.

**The probe is replaced by a log.** The old gate asked "was the API reachable when I poked
it" — an adjacent property, and the reason `A-prime-1` was marked void on a 200-before /
429-after when the agent may well have had its data. The shim appends one JSON line per
call to `figma-calls.jsonl`, archived with the run, so the harness now records *what the arm
actually asked for* rather than what a probe saw. Deliberately not a void condition: an arm
that makes zero calls has made a choice, and that is a result.

**A credential with two values.** The capture script first returned `403 Token expired`
against a file key that `curl` had read minutes earlier. The token in `.env` was fine; a
stale `FIGMA_ACCESS_TOKEN` exported in the shell won on precedence. `load_env` had the same
bug mirrored — it returned early whenever `FIGMA_API_KEY` was already set, so a leftover
export would have run the whole grid with the green line `Figma: key read from .env`. Both
now read every source, compare, and stop naming both fingerprints if they disagree. Sixth
instance of the gate defect, and the second where the wrong property was a credential's.

Runs no longer need a Figma token at all. Preflight checks the recording: that it parses,
that it carries the three nodes `S0` names, and that neither forbidden canvas leaked.

### Pilot batches, and what is in each

Two batches of pilots, neither scored, kept because each one is why a rule exists.

| | runs | condition | what it produced |
|---|---|---|---|
| `opus-5-5-pilot` | A-0, A-1, A-prime-1, B-1, C-0, C-1, D-0, D-1 | Figma dead throughout, unnoticed; arm B still carrying `llms.client.txt` | the zone definition, the conformance scorer, the void guard, the arm B deletion |
| `opus-5-5-pilot-figma-partial` | A-1, A-prime-1, B-1, C-1, D-1 | Figma live for arm A only, then 429 for the rest of the round | the cached channel, the call log, the credential-precedence fix |

The second batch is the one that settled the design. Arm A ran with a working channel — **61
turns and $2.27, against 25 turns and $1.35 for the same arm without Figma**, which is worth
keeping in view when the cost chapter asks what the design system costs: with a pixel-exact
source the control costs what the design-system arms cost, because the visual work does not
disappear, it moves into turns.

Arm B in that batch stopped after **nine turns and $0.33** without writing code. It had been
told, in a sentence added to `S0` §2 that morning, that Figma and its token were verified
before the run and that "if either were unavailable you would not have been given this
document". Figma returned 429. The agent concluded the precondition was broken, listed what
it had established — that `llms.client.txt` was correctly absent, what the fourteen
components were, that the header has no slot for a profile control — and asked which of two
options to take. In a headless run with nobody to answer.

The sentence was a promise the harness could not keep. It has been replaced with an
instruction to build anyway and state which visual choices went unverified. Worth recording
that the agent's behaviour was right and the specification was wrong: it refused to guess
and said why, which is what you would want from a colleague and cannot use from a batch job.

### Pre-registration: the Sonnet grid, 2026-09-24

Recorded before the first Sonnet run, while the Opus grid is still empty. Predictions by
Claude, accepted by the author. The model is a second factor, not a setting: results go to
`results/sonnet-5/` and never mix with Opus.

**The question.** Does the infrastructure help a weaker model *more* or *less*? Both
positions are defensible, and they predict opposite things:

- **More.** A weaker model guesses APIs worse and hallucinates sooner, so the contract and
  the resolver rescue it from a deeper hole. The A→D gap widens.
- **Less.** Using `llms.client.txt` or the resolver means first finding it, reading it and
  applying it. A weaker model takes the shortcut and builds its own, leaving the
  infrastructure untouched. The A→D gap narrows, and hallucinated API references rise in
  *every* arm.

**The prediction: more, and concentrated in one place — arm B falls apart.**

| Metric | A | A′ | B | C | D |
|---|---:|---:|---:|---:|---:|
| Component slots used (of 13) | — | — | **9** | 12 | 12 |
| Hallucinated API references | — | — | **14** | 3 | 2 |
| Checks passed (of 8) | — | — | 1 | 5 | 5 |
| Builds | yes | yes | **at risk** | yes | yes |
| Colour conformance, states not in the frames | 0.25 | 0.45 | 0.75 | 0.85 | 0.85 |

Arm B is the whole bet. Sonnet without the contract should guess import names —
`DsbButtonComponent` for what is exported as `ButtonComponent` — and that is the one place a
hard build failure is predicted. This is the same prediction the Opus grid was given and it
**failed there**: `B-1` on Opus scored 13/13 slots, zero hallucinated API references, seven
of eight checks, and it built. It worked from the READMEs, the `.d.ts` declarations and the
compiled source.

**So the sharp outcome is the one where the prediction fails twice.** If Sonnet's arm B also
holds up, the conclusion is not that this book's thesis is wrong but that it is aimed at the
wrong artifact: **the machine-readable layer that earns its keep is the published, typed,
installable package** — and `llms.client.txt` is worth one check out of eight, for about
thirteen cents a screen. That is a cheaper, more universal and more defensible claim than
the one the manuscript currently makes, and it would cost the chapter on agent-facing
documentation its premise.

Written down now so that outcome reads as a finding rather than as a retreat.

### The Sonnet grid's premise is false, 2026-09-25

The second grid was justified by cost: Sonnet is several times cheaper per token, so a
cheaper model would let the experiment run more rounds. One run killed that.

| Arm A, same spec, same scorers | input | out | turns | cost |
|---|---:|---:|---:|---:|
| Opus, no Figma | 0.92M | 36.0k | 25 | $1.35 |
| Opus, Figma live | 2.34M | 46.6k | 61 | $2.27 |
| **Sonnet, Figma cached** | **9.61M** | **57.5k** | **108** | **$3.32** |

**Sonnet cost 46% more than Opus on the same arm, with four times the input tokens.** Per
token it is far cheaper; it needed so many more turns that the arithmetic inverted, because
every turn re-reads the whole context. On an agentic task the cost driver is turns × context,
not price per token, and anything that cuts turns — a better model, or better infrastructure
— dominates the bill.

That is worth more to the book than the grid it cancels. It also sharpens the economics
chapter: the design system is sold as something that reduces the number of steps an agent
takes, and steps are what the bill is made of.

The scientific question the grid was meant to answer — does infrastructure help a weaker
model more or less — is still open and still interesting. It is no longer cheap, so it
competes with the primary grid for the same budget and goes after it, not before.

Recorded alongside: **the cached Figma channel worked in a real run.** Arm A called
`get_figma_data` three times, for exactly the three nodes `S0` names, dash-spelled, and the
shim served 56 kB, 10 kB and 9.6 kB with no errors. The run built. First end-to-end proof
that the recorded channel is usable.

The other four arms of that round returned `429 — session limit` and cost $0.79 in total.
The batch is `sonnet-5-pilot`; nothing in it is scored.

### The grid becomes three arms, 2026-09-25

`ARMS=(A B D)`. Five arms in a round do not fit inside one session window — measured three
times, three different ways: $6 and a cut-off on the morning of the 24th, $9.56 through only
because four arms were running blind and cheap, $4 and a cut-off after one arm on Sonnet. A
full round is $16–20. A round split across windows reintroduces exactly the confound the
round design exists to remove.

**What A, B and D are.** A cumulative ladder, nothing skipped:

| | has | the gap it opens |
|---|---|---|
| A | nothing beyond `S0` | — |
| B | the typed, installable package | **A→B: what does shipping a design system as a package buy?** |
| D | B + `llms.client.txt` + the resolver | **B→D: what does the agent-facing layer buy on top of it?** |

B→D is the live question. The Opus pilot put `B-1` at 13/13 slots, zero hallucinated API
references and seven of eight checks, working from READMEs and `.d.ts` declarations alone —
which is the result that threatens the manuscript's premise. Three arms measure it directly.

**What dropping C costs, stated now rather than discovered later.** D is C plus the
resolver, so a B→D gap cannot be attributed between the two. "The agent-facing layer earns
its keep" and "the resolver earns its keep" are different findings and different chapters,
and this grid cannot tell them apart.

So: **if D beats B, C stops being optional.** Running it is then the only way to say which
half did the work, and the book may not claim the resolver on a B→D gap alone. Written down
here so that running C later reads as the plan rather than as a patch.

**What dropping A′ costs.** A′ was pre-registered as the uncomfortable arm: a styleguide
document, no installable artifact, the arm whose tying D would mean the infrastructure is
not earning its keep. A grid that drops its sharpest challenge for budget reasons and never
comes back to it is a grid that chose its result. A′ runs after the core grid, at n≥2, and
that is a commitment rather than an intention.

Both remain first-class arms with unchanged overlays. `./run.sh A-prime 1` and
`./run.sh C 1` still work; they are simply not in `round`.

Estimated cost of a three-arm round on Opus, from the pilots: A $2.3, B ~$3.7, D ~$4.9 —
about **$11**. Close enough to the ceiling that a round wants a fresh window and no other
Claude usage beside it.

### The tenth gate: untracking node_modules silenced the accessibility measurement, 2026-09-27

Before making the repositories public, `eval/node_modules` was removed from git tracking —
216 committed files of `playwright`, `playwright-core` and `axe-core` — and `node_modules/`
was added to `.gitignore`. The reasoning was that committed dependencies look like
carelessness in a public repository. That reasoning was about a property adjacent to the one
that mattered.

Those packages were not a convenience. They were the **only** source of the accessibility
measurement, and they had never been installed on this machine by npm — they existed solely
because they were committed. Untracking removed the guarantee; the tidy-up after a merge
conflict removed the files.

All four arm A′ runs then went out and came back with:

```json
"a11y": { "unavailable": "playwright and @axe-core/playwright are not installed" }
```

The scorer behaved correctly: it recorded `unavailable` rather than `0`, which is the whole
reason the runs were recoverable rather than quietly wrong. Had it defaulted to zero, arm A′
would have entered the table as the arm with no accessibility problems, which is the opposite
of what it measured.

**Cost:** nothing, as it happened. `./run.sh remeasure` re-scored all four from the run
directories without paying for a single agent turn. Had macOS cleaned `/tmp` first, it would
have been four runs.

**Fix:** `npm install` in `eval/`, and `preflight` must assert that `playwright` and
`@axe-core/playwright` resolve before any run starts. It currently does not — it checks
credentials, flags, permissions and the Figma recording, and says nothing about the scorer's
own dependencies. A preflight that clears a run it cannot measure is the same defect as the
Figma preflight that asserted a token was present rather than working.

Tenth documented instance of a gate reporting on a property next to the one it guards, and
the first one introduced while cleaning up rather than while building.

### Rounds 4 and 5, and the eleventh gate: check 9.6 is removed, 2026-10-07

Two more rounds took the primary model to n = 5 on every arm. Unlike rounds 1–3, these ran
all five arms inside one sitting — A, B, D, then A′, then C, within an hour — so A′ and C now
have two observations each that are controlled the way A, B and D have always been, and three
that are not. Thirty scored runs at that point; thirty-five after the second Sonnet round.

**Round 5 broke a claim that round 4 would have let me publish.** At n = 4 the accessibility
ladder was identical in every run of every arm: A failed contrast on all three routes, A′ on
two, the library arms on none. A′-5 failed on all three. The cause is in the styleguide, and
it is more interesting than the clean version:

```
                 surface-page   surface-card   surface-subtle   surface-recessed
text-primary       18.09 AA       18.88 AA        17.32 AA          16.57 AA
text-secondary      5.50 AA        5.74 AA         5.27 AA           5.04 AA
text-muted          2.73 FAIL      2.85 FAIL       2.61 FAIL         2.50 FAIL
```

`--color-text-muted` (`#999999`) cannot pass AA on any surface the document defines. Runs 1–4
reached for `--color-text-secondary` on the login screen; run 5 reached for `muted`. The
defect was in the document the whole time and surfaced when the agent happened to touch it.
The published claim changes from *the same routes fail every time* to *the document carries
a token that cannot pass anywhere, and which screen fails depends on which documented token
the agent picks.*

**Check 9.6 is removed.** It asked whether a split modal footer sets `flex:1` on the
projected element, and returned `na` whenever no split footer existed — five of fifteen
library-arm runs at n = 5, spread across B, C and D. So it measured whether the agent felt
like building that footer, not what it knew about the component API.

It was also producing a result. Counted, the check totals read B 35/40, C 37/40, D 39/40, and
D looked better than C. Removed, they read:

```
                      checks passed, Opus, n = 5, seven checks
   B   6 · 7 · 6 · 6 · 6     31/35
   C   7 · 7 · 7 · 7 · 7     35/35
   D   7 · 7 · 7 · 7 · 7     35/35
```

C and D are identical, and every `na` in the library arms disappears — the grid now applies
in full to all fifteen runs. The entire apparent advantage of the resolver over the document
was one check reporting on whether a component had been built at all.

Forcing a split footer in `S0` was the alternative and was rejected: it would add a
requirement to the specification that exists only so that a scorer has something to measure.

Eleventh documented instance of a gate reporting on a property next to the one it guards, and
the first that was about to change a published conclusion rather than discard a run. The
definition is in git history; `scorers/checks.js` carries a note where it stood, and
`scorers/test/scorers.test.js` now asserts that the grid is seven checks and that `9.6` does
not come back by accident.

### Sonnet round 2, and the twelfth gate: the accessibility pass suppressed its own failure, 2026-10-08

The second Sonnet round was run for two claims that rested on a single observation each:
check `9.2`, and the B-versus-C discipline gap. It settled both, in opposite directions, and
cost a morning to a harness bug first.

**The round did not survive one sitting.** A, B and D ran 09:17–10:05. A′ and C were started
at 11:57 and 12:21 and both died immediately on `HTTP 429 — session limit`, A′ at 49 turns and
C at one. `void.js` recorded both as void rather than as bad scores, which is what it is for.
They were re-run the same evening, 18:14 and 19:17. Sonnet's first round had never been one
sitting either — A-1 at 09:41, B-1 and D-1 five hours later, C-1 the next day, A′-1 the day
after that — so for this model the round discipline has never actually held, and that is
recorded here rather than implied by the word "round" in the file names.

**The twelfth gate.** A, B and D built cleanly and were then unscorable: `a11y.json` was
**zero bytes** in all three. The scorer refused them — *"the measurement pass did not run"* —
which is the repair made after the tenth gate working exactly as intended. The cause was one
line of the harness:

```bash
A11Y_SHOTS_DIR="$dir/shots" node "$scorers/a11y.js" "$root" > "$dir/a11y.json" 2>/dev/null || true
```

`2>/dev/null || true` discards both the error output and the exit status. **The gate that
measures accessibility was built so that its own failure is invisible**, and the only symptom
is an empty file one step downstream. Had `a11y.js` instead written a well-formed document
with an empty violations array, three runs would have been published showing zero accessibility
violations for arms that have never produced zero.

The cause of the crash itself is **not known**. Running `a11y.js` by hand against the same run
directory afterwards worked — `available: true`, three serious violations on arm A, six
screenshots — and `./run.sh remeasure` recovered all three runs at no cost. It failed three
times consecutively during the round and has not failed since. The line now captures stderr
and turns a silent failure into a recorded reason:

```bash
A11Y_SHOTS_DIR="$dir/shots" node "$scorers/a11y.js" "$root" > "$dir/a11y.json" 2>"$dir/a11y.stderr" \
  || printf '{"available":false,"reason":"a11y.js exited %s; see a11y.stderr"}\n' "$?" > "$dir/a11y.json"
[[ -s "$dir/a11y.json" ]] || printf '{"available":false,"reason":"a11y.js wrote nothing; see a11y.stderr"}\n' > "$dir/a11y.json"
```

The second line is the one that matters: the observed failure exited **zero** and printed
nothing, so only an emptiness check catches it. `a11y.stderr` was also added to the archived
file list, because a diagnostic that stays in `/tmp` dies with it.

Twelfth documented instance of a gate reporting on a property next to the one it guards, and
the first where the gate's defect was that it hid its own.

**What the round did to the findings.** Two claims were withdrawn and one was narrowed:

- `9.2` held — B fails it in both Sonnet runs — but **C-2 fails it too**, the first time any
  arm holding the agent-facing document has. The finding is now stated as a ratio, 6 failures
  in 7 against 1 in 7, rather than as *the document earns exactly one check*.
- The **B-versus-C discipline gap is withdrawn.** B-1 scattered 17 raw values and crossed the
  tier boundary twice; B-2 scattered two and crossed none, which is better than C-1. The claim
  rested entirely on B-1.
- D-1's single reimplementation — *the only run in the study where an arm holding the design
  system failed to use all thirteen components* — **did not replicate.** D-2 used all thirteen
  and returned the first 7/7 grid on Sonnet. The evidence against the resolver is accordingly
  thinner than it was, not thicker.
- Cost on Sonnet ordered the library arms **opposite ways in the two rounds** (B < C < D, then
  C < D < B). The Opus ordering stands at n = 5; the mechanism behind it does not yet.

Three of those four cut against a reading this repository had already published. That is the
point of running the second observation.

### Results — stage one, revised 2026-10-08

Thirty-five scored runs. Claude Opus at n = 5 across five arms, Claude Sonnet at n = 2 as a
second harness on the same specification. Arms A′ and C were added on 2026-09-27, after the other three
had been scored, and only joined the rounds at 4 and 5 — see “A′ and C ran late, and what that
costs” below. The convention grid is seven
checks; the n = 3 reading of this section, with eight, is in git history. Every row comes from
[`results/`](results); nothing below is judged by eye.

Arm C was not in the original three-arm grid. It was run because this protocol committed, in
advance, that **"if D beats B, C stops being optional"** — D did, so C ran, and it is the
experiment that attributes the gap.

#### Opus, n = 5

| | A | A′ | B | C | D |
|---|---|---|---|---|---|
| Library components used (of 13) | 0 · 0 · 0 · 0 · 0 | 0 · 0 · 0 · 0 · 0 | 13 ×5 | 13 ×5 | 13 ×5 |
| Hand-reimplemented | 13 · 12 · 12 · 12 · 12 | 13 ×5 | 0 ×5 | 0 ×5 | 0 ×5 |
| Scattered raw values | 6 · 0 · 0 · 6 · 4 | **139 · 132 · 133 · 146 · 138** | 0 ×5 | 0 ×5 | 0 · 2 · 0 · 0 · 2 |
| Custom properties owned | 90 · 99 · 91 · 89 · 88 | 28 · 27 · 27 · 27 · 27 | 0 · 0 · 0 · 6 · 0 | 0 ×5 | 0 · 0 · 2 · 0 · 0 |
| Tier crossings | 0 | 0 | 0 | 0 | 0 |
| Decision tokens used | 0 ×5 | 0 ×5 | 60 · 57 · 60 · 62 · 56 | 61 · 62 · 59 · 59 · 59 | 77 · 56 · 59 · 58 · 59 |
| Hallucinated API refs | 0 | 0 | 0 | 0 | 0 |
| **Checks passed (of 7)** | n/a | n/a | **6 · 7 · 6 · 6 · 6** | **7 · 7 · 7 · 7 · 7** | **7 · 7 · 7 · 7 · 7** |
| Colour conformance | .91 · .85 · .79 · .84 · .94 | .57 · .64 · .57 · .64 · .59 | n/a † | n/a † | n/a † |
| Conformance, overall | .92 · .88 · .85 · .86 · .92 | .87 · .88 · .86 · .87 · .87 | n/a † | n/a † | n/a † |
| **axe — serious** | **3 · 3 · 3 · 3 · 3** | **2 · 2 · 2 · 2 · 3** | **0 ×5** | **0 ×5** | **0 ×5** |
| Builds | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| Cost, median | $2.29 | $2.02 | $3.19 | $2.83 | $3.04 |

† Conformance rates a run against its own authored values. The library arms authored almost
nothing — B-4 declared six custom properties, D-2 and D-5 scattered two literals each, D-3
declared two — so the handful of rates those produce are computed over two to six values and
are not reported. Zero authored values is the result worth reading, and it is in the two rows
above.

#### Sonnet, n = 2

| | A | A′ | B | C | D |
|---|---|---|---|---|---|
| Library components used | 0/13 ×2 | 0/13 ×2 | 13/13 ×2 | 13/13 ×2 | **12/13** · 13/13 |
| Hand-reimplemented | 13 ×2 | 13 ×2 | 0 ×2 | 0 ×2 | **1** · 0 |
| Scattered raw values | 46 · 41 | **117 · 133** | 17 · 2 | 5 · 3 | 2 · 3 |
| Custom properties owned | 71 · 61 | 27 · 27 | 0 ×2 | 0 ×2 | 0 ×2 |
| Tier crossings | 0 ×2 | 0 ×2 | **2** · 0 | 0 ×2 | 0 ×2 |
| Decision tokens used | 0 ×2 | 0 ×2 | 49 · 54 | 54 · 48 | 58 · 56 |
| **Checks passed (of 7)** | n/a | n/a | **5/7 · 5/7** ‡ | **6/7 · 6/7** ‡ | **6/7 · 7/7** ‡ |
| Colour conformance | .73 · .88 | .69 · .70 | n/a § | n/a § | n/a § |
| axe — serious | 3 ×2 | 2 ×2 | 1 † · 0 | 0 ×2 | 0 ×2 |
| Cost | $4.75 · $4.43 | $4.18 · $4.18 | $6.63 · $9.32 | $7.21 · $5.80 | $8.82 · $8.88 |
| Turns | 153 · 138 | 129 · 124 | 152 · 185 | 165 · 125 | 192 · 171 |

† `aria-prohibited-attr`, not a contrast failure. **Across all twenty-one runs of the three
arms holding the library, on both models, `color-contrast` never fired once.**

‡ The `na` verdicts are not failures: `9.4` in B-1 and C-1, `9.3` in D-1 — the run never built
the surface the check applies to. Run 2 produced no `na` at all. B's failures are `9.2` in both
runs; **C-2 also fails `9.2`**, the first time any arm holding the agent-facing document has
failed it. See finding 4.

§ Conformance is omitted for the Sonnet library arms for the same reason as on Opus: they
authored between two and 17 values, against 102–117 in A and 144–160 in A′. The rates those
produce are ratios over a handful of observations and are in
[`results/sonnet-5/`](results/sonnet-5) rather than here, where they would read as comparable.

#### Findings, ordered by how well the data supports them

**1. Shipping the design system as a typed, installable package is a step function.**
Thirty-five runs, no overlap. Without the package — arms A and A′ alike — 12 or 13 of the 13
components are hand-written every time, and the application ends up owning the CSS: 61–99
custom properties in A, 117–146 scattered literals in A′. With the package: zero
reimplementations in twenty of twenty-one runs across two models, and one in the twenty-first
(Sonnet D-1, a single component, which did not recur in D-2). No condition without the package
produced fewer than twelve.

**2. Writing the palette down does not fix accessibility. It industrialises the error.**

This is the finding arm A′ changed, and the fifth round changed it again.

```
color-contrast, serious, by route        /login   /dashboard   /users
A   — Figma frames only       7 runs      fail         fail      fail
A′  — plus a styleguide       6 runs        ok         fail      fail
A′  — plus a styleguide       1 run       fail         fail      fail
B/C/D — the library          21 runs        ok           ok        ok

   both models · the single A′ run in the third row is Opus A′-5
```

Until Opus A′-5 the middle row read as a mechanism: the document fixes one route in three. It
is not a mechanism. It is agent discretion, and one run spent it differently.

The styleguide in `arms/A-prime.md` prescribes four surfaces and three text colours, and one
of the text colours fails WCAG AA on every surface the same document defines:

```
contrast of the styleguide's own pairings, computed from arms/A-prime.md

                          surface-page  surface-card  surface-subtle  surface-recessed
text-primary    #111111      18.09 AA      18.88 AA        17.32 AA          16.57 AA
text-secondary  #666666       5.50 AA       5.74 AA         5.27 AA           5.04 AA
text-muted      #999999       2.73 fail     2.85 fail       2.61 fail         2.50 fail
```

and three of its four tag pairings do the same:

```
.tag-success { background:#f0fdf4; color:#16a34a; }   3.15:1   fails AA
.tag-warning { background:#fefce8; color:#ca8a04; }   2.84:1   fails AA
.tag-danger  { background:#fef2f2; color:#dc2626; }   4.41:1   fails AA
.tag-info    { background:#eff6ff; color:#2563eb; }   4.75:1   passes
```

`/dashboard` and `/users` carry tags, so they fail in all six A′ runs. `/login` carries none,
so whether it fails turns only on whether the agent reaches for `--color-text-muted` on that
screen: five runs did not, the sixth did. **A route that comes clean because the agent happened
to pick a different token is not a route the document made safe.** The n = 4 reading of this
table would have gone into an article as a measured effect of documentation. It was a coin
landing the same way four times.

**The failing pairs were in the input, not invented by the agent.** They were lifted verbatim
from `spec-no-ds.md` when A′ was written, long before anyone computed their contrast. That is
a property of this experiment's styleguide, not proof that styleguides generally carry bad
contrast — but it is exactly what a page in Confluence looks like, and it is why the result is
worth reporting rather than fixing.

The mechanism, which survives both the caveat and the fifth run: **a document can carry a wrong
pairing perfectly.** An agent reading it has no way to notice, because nothing in prose fails.
A component that is itself tested carries a pairing that passed a test. Arm A invents pairings
and fails all three routes in seven runs of seven; arm A′ inherits pairings and fails two
routes in six runs and three in the seventh; the library arms fail zero times in twenty-one
runs. Capability is not the variable — none
of the three conditions differ in the model.

**3. The token resolver earns nothing measurable.** This was the pre-registered decisive
comparison and it is the finding that goes against the author's interest.

| | C (document) | D (document + resolver) |
|---|---|---|
| Decision tokens, median | 59 | 59 |
| Checks, Opus (5 runs × 7) | **35/35** | **35/35** |
| Checks, Sonnet | 6/7 | 6/7 |
| Scattered raw values, Opus | 0 ×5 | 0 · 2 · 0 · 0 · 2 |
| Library components, Sonnet | 13/13 | **12/13** |
| Cost, median | $2.83 | $3.04 |

On Opus the two arms are indistinguishable on the convention grid: ten runs, seventy verdicts,
every one a pass. Where they differ at all, D is the worse of the two — two runs scattered
literals where C scattered none, and the median run costs 7% more.

**The Sonnet evidence against the resolver got weaker at n = 2, not stronger.** At n = 1, D-1
used 12 of 13 components — the only run in the study where an arm holding the design system
failed to use all thirteen — and scored 6/7. D-2 used all thirteen and scored **7/7**, the first
Sonnet run with a complete clean grid. The single reimplementation did not recur, so it is one
run, not a pattern. In the other direction, C-2 fails `9.2` (finding 4) while both D runs pass
it. On Sonnet the two arms now trade one defect each.

With check `9.6` still counted this comparison read the other way — at n = 4, D 31/32 against
C 29/32; at n = 5, D 39/40 against C 37/40 — and the whole gap was that check's `na`
distribution, not a difference in behaviour. Removing it removed the gap. The dated entry above
records how close that came to being published as a reversal of the pre-registered finding.

**4. The agent-facing document shifts one check heavily. It does not guarantee it.**

```
9.2 — <dsb-column> requires #cell and let-row="row"
                       Opus (5 runs)              Sonnet (2 runs)      total
   B    fail·pass·fail·fail·fail                  fail·fail            6 failures in 7
   C    pass ×5                                   pass·fail            1 in 7
   D    pass ×5                                   pass·pass            0 in 7
```

A template convention that cannot be read off the type declarations. Prose carries it; a token
resolver has no opinion about it.

**The counter-example arrived with the second Sonnet round.** Until C-2 the tally was 5
failures in 6 for B and zero for C and D, and this finding was written as *the document earns
exactly one check*. C-2 fails `9.2`, so the honest statement is the ratio: **6 failures in 7
runs without the document, 1 in 7 with it.** That is a large effect and not an absolute one.
A reader is entitled to the difference, and so is a team deciding whether 3 kB of prose is
worth writing.

What also failed to replicate is the discipline claim. At n = 1 it read: *B scattered 17 raw
values and crossed the tier boundary twice, C scattered 5 and crossed none* — the document
buying order as well as the check, and buying more of it the weaker the model. **B-2 scattered
two raw values and crossed nothing**, which is better than C-1. On Opus both arms were zero
throughout. So that claim rested entirely on B-1 and is withdrawn; what is left is one check,
at the ratio above.

**5. Cost does not behave the way the pitch deck says.** Two results, both uncomfortable.

The cheaper model was about twice as expensive. Sonnet's arm A cost $4.75 and $4.43 against
Opus's median of $2.29 on the same specification, and the gap widened with infrastructure
($8.82 and $8.88 against $3.04 for arm D). Per token Sonnet is far cheaper; it needed 124–192
turns where Opus needed 36–69, and each turn re-reads the whole context. On an agentic task the
bill is turns × context, not price per token. This is the one cost result that replicated
cleanly in both Sonnet rounds.

And within one model, cost is not monotonic in how much design system the agent holds:

| arm | A′ | A | C | D | B |
|---|---|---|---|---|---|
| median cost | $2.02 | $2.29 | $2.83 | $3.04 | **$3.19** |

**On Opus, B — the library with no agent-facing document — is the most expensive arm in the
study.** Adding `llms.client.txt`, about 3 kB, takes 11% off it, and the ordering has held at
n = 3, n = 4 and n = 5. The readable story is that an agent handed an undocumented library pays
to discover it, and 3 kB of prose is cheaper than the discovery.

**The second Sonnet round says do not bank on it.** Sonnet's two rounds order the library arms
in opposite directions:

```
   run 1    B $6.63  <  C $7.21  <  D $8.82
   run 2    C $5.80  <  D $8.88  <  B $9.32
```

B swings by $2.69 and C by $1.41 between two runs of the same arm, which is more than the gap
the Opus ordering rests on. So the within-model ordering is stable on Opus at n = 5 and not yet
established on Sonnet at n = 2; treat it as an observation with a hypothesis attached, not a
finding, and do not publish the mechanism until an experiment aimed at it has run.

What does not survive in any version is the simpler claim written at n = 3: *cost rises as you
add infrastructure.* On Opus it rises from A to B and then falls.

**6. A written styleguide produced less consistent CSS than no styleguide at all.** The
uncomfortable arm turned out to be uncomfortable in the other direction.

| | A — nothing | A′ — styleguide as prose |
|---|---|---|
| Custom properties declared | 90 · 99 · 91 · 89 · 88 | 28 · 27 · 27 · 27 · 27 |
| Raw values scattered in declarations | 6 · 0 · 0 · 6 · 4 | 139 · 132 · 133 · 146 · 138 |

Sonnet the same, in both rounds: 71 and 61 declared with 46 and 41 scattered without the
document; 27 and 27 declared with 117 and 133 scattered with it.

Given nothing, the agent invents a complete internal vocabulary and uses it — roughly ninety
properties and almost no literals. Given a partial document, it declares exactly the properties
the document lists and hardcodes everything the document does not cover. **The styleguide does
not become the system; it becomes the part of the system that is written down, and legitimises
literals everywhere else.**

Both A and A′ own their CSS outright — zero library components, twelve or thirteen
reimplementations — so this is a difference in how ownable that CSS is, not in whether it is
owned.

One number must not be read as a finding. A′'s *colour* conformance is .571–.640 against A's
.794–.941, which looks like the document causing drift. It is not: nine of the twenty hex
values in `arms/A-prime.md` are absent from the published token package, so the agent was
faithful to a document that had itself drifted. Overall conformance is .856–.881 for A′ against
.846–.924 for A — the same band. The gap measures document-versus-package, not
agent-versus-document.

#### A′ and C ran late, and what that costs

Rounds 1–3 (2026-09-25) ran A, B and D together, one sitting each. C was added on 2026-09-27
and A′ on the evening of the same day, each as a block of three runs of a single arm. Rounds 4
(2026-10-05) and 5 (2026-10-06) ran all five arms in one sitting each.

So the five columns are not equally controlled, and the difference is not cosmetic:

| | runs inside a five-arm round | runs in a single-arm block |
|---|---|---|
| A, B, D | 5 | 0 |
| C, A′ | 2 | 3 |

**Three of each of A′'s and C's five observations carry a between-sitting confound that no A, B
or D observation carries.** Rounds exist precisely so that arm and sitting are not the same
variable. Where the two kinds of run disagree, the rounded ones are the evidence — and they
did disagree: A′'s third failing route appears in run 5, inside a round, and the four-run story
it broke was built on three off-round runs plus one. The honest repair is a full five-arm grid
in rounds from scratch. Rounds 4 and 5 are two fifths of it.

#### What this does to the thesis

| Claim | After stage one |
|---|---|
| The token pipeline changes what an agent writes | **supported** — step function, no overlap, one single-component exception in thirty-five runs |
| Agent-facing documentation earns its keep | **supported narrowly** — one check, 6 failures in 7 without it against 1 in 7 with it. The discipline claim beside it was withdrawn at n = 2 |
| The token resolver / MCP layer earns its keep | **not supported** — two models, fourteen runs, no advantage on any dimension; the one run that argued against it did not replicate either |
| A design system is a firewall against UI hallucinations | **not supported** — zero hallucinated API references in thirty-five runs, arms A and A′ included |
| Shipping the system beats documenting it | **supported** — A′ scored nowhere near C on any dimension, in seven runs across two models |
| A design system lowers the cost of a generation | **not supported** — and on Opus the ordering is not even monotonic |

The claim the data carries is narrower than the one this study set out to test:

> A design system does not make the agent more capable or more correct. It makes the output
> **ownable** — and it carries the one class of decision the agent cannot derive, because
> nobody wrote it down anywhere it could read.

A′ was pre-registered as the arm that could overturn this. It did the opposite. The condition
that threatened the premise — a system written down but not shipped — came out worse than no
system at all on consistency (138 scattered literals against 4) and, once the fifth run landed,
no better on accessibility, while the shipped library came out clean on both. The comparison
was committed to before it ran and it went the author's way; that is worth stating as plainly
as the two that did not.

#### Still open

- **Drift**: change one token value, count the files that must change. Costs nothing to run and
  supplies the maintenance term the cost table has no column for.
- **Cost per accepted screen**, rather than per generation.
- **Sonnet at n > 2.** The second round settled the two claims it was run for: `9.2` held and
  gained a counter-example, the B-versus-C discipline gap did not hold at all. What it did not
  settle is cost — the two rounds order the library arms in opposite directions, so a third
  round is the cheapest thing on this list that would change a published number.
- **Why B is the most expensive arm on Opus.** Finding 5 offers a mechanism and no
  instrumentation behind it, and Sonnet does not reproduce the ordering. Turn counts and
  per-turn input tokens are already in `results/`; nobody has read them that way yet.
- **The five-arm grid in rounds**, three more rounds of it, so that C and A′ stop being the
  weakest-controlled columns in the table.

### Results — appendix

The empty table that used to stand here was the placeholder written before any run. It is
replaced by the stage-one section above rather than deleted, so that the shape of what was
promised can still be compared with what was delivered.

Per-run rows, including every void and every pilot, are in `results/`. Nothing was removed
from that directory.
