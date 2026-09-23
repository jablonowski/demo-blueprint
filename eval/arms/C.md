# Arm C — the machine-readable layer

Arm B, plus one file placed in the agent's context at the start of the session:

- `node_modules/@jablonowski/dsb-components/llms.client.txt` — the agent-facing guide that
  ships inside the package, ~840 tokens

Handed over as it ships. Not summarised, trimmed or annotated for the run.

## Why `contracts.json` is not here

It is 53 KB, about 13,400 tokens — sixteen times `llms.client.txt` and four times the whole
of `S0`. Putting it in context would make the infrastructure's cost a property of one file
rather than of the design, and it is machine data for validation, not a document written to
be read. It is scorer input instead.

If C underperforms, "paste the entire contract" is a variant worth running, and C against
that variant against D answers plainly whether 13,400 tokens buy anything a tool call does
not.

## What this arm decides

If C scores like B, then writing a machine-readable description of a design system changes
nothing about how an agent uses it, and several of this project's assumptions need
revisiting.

If C scores like D, the static description is sufficient on its own and the live resolver
is an expensive way to deliver what a text file already carried.

**When C fails a check that the hand-written notes in the old `SPEC.md` §9 would have
answered, that is the result.** It names a fact the machine-readable layer does not carry.
Add it to `llms.client.txt`, re-run, and the delta is the value of the repair — a better
chapter than any single table of scores.
