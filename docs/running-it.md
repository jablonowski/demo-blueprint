# Running it

[← docs index](start.md)


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

The top level also holds `docs/` (this documentation), `.env.example` (the variables a run
reads), and `.mailmap`.

## What a run needs

- A Claude Code credential. The harness drives it headless.
- Node 20+. `cd eval && npm install` pulls the scorers' own dependencies — they are what
  produces the accessibility measurement, so a missing install makes that column
  `unavailable` rather than zero. That distinction has already saved one published table.
- No Figma token. The design channel is a committed recording; a token is needed only to
  re-record it.

