# Arms

A run is `S0.md` plus exactly one overlay from this directory, handed to a fresh session
with no memory of any other run.

```
S0.md  +  arms/<arm>.md  ->  fresh session  ->  generated application
```

`S0.md` is identical in every arm, byte for byte. If a run fails for want of information
that belongs in `S0`, add it to `S0` and **re-run every arm**. Adding it to one overlay
turns the experiment into a demonstration.

| Arm | Overlay | What the agent has | In the grid |
|---|---|---|---|
| A | `A.md` | nothing beyond `S0` | **yes** |
| A′ | `A-prime.md` | a styleguide document: palette, scale, component CSS | follow-up |
| B | `B.md` | the packages installed, READMEs reachable | **yes** |
| C | `C.md` | B + `llms.client.txt` in context | follow-up |
| D | `D.md` | C + the token resolver connected over MCP | **yes** |

The grid is A, B and D: a cumulative ladder with nothing skipped — nothing, then the typed
installable package, then the whole agent-facing layer on top of it. Five arms in a round
do not fit inside one session window, and a round split across windows reintroduces the
confound the round exists to remove.

A′ and C remain first-class arms and run on their own (`./run.sh C 1`). What their absence
costs the grid, and the condition under which C stops being optional, is written down in
`PROTOCOL.md`.

## What is deliberately absent from B, C and D

`contracts.json` is not in any overlay. At ~13,400 tokens it is machine data for the
scorer, not a document written to be read; see `C.md`.

The component API table and the nine implementation notes that used to live in `SPEC.md`
§5 and §9 are not in any overlay either. They are a hand-written restatement of what
`llms.client.txt` and `contracts.json` already contain, and whether an agent can work
without that restatement is the question arm C exists to answer.

Each of those notes is a scored check in `../SCORERS.md`. A failure there is a gap in the
machine-readable layer, not a gap in the agent — and the repair is to put the information
into `llms.client.txt` and measure the second run.

## Isolation

Each run gets a fresh, empty directory. Nothing carries over — not a `node_modules`, not a
lockfile, not a partially generated app.

Arm A must not have the packages installed. If `@jablonowski/dsb-components` is anywhere in
the tree, arm A is not arm A. Check before the run, not after.

Arms B, C and D install the two packages and nothing else beyond what `S0` names. Arm D
additionally registers the MCP server. A′ installs nothing; its styleguide is text.

## Recording a run

```
eval/runs/<arm>-<n>/          the generated application
eval/results/<arm>-<n>.json   the scorer output
```

Record the model, the date, and the exact overlay file hash with each run. An arm re-run
after an overlay changed is a different arm.
