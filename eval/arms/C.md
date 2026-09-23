# Arm C — the machine-readable layer

Arm B, plus two files placed in the agent's context at the start of the session:

- `node_modules/@jablonowski/dsb-components/llms.client.txt` — the agent-facing guide that
  ships inside the package
- the component contracts, `contracts.json`, exported from the same package

Both are handed over as they ship. Neither is summarised, trimmed or annotated for the run.

This is the arm the AX claim rests on. If C scores like B, then writing a machine-readable
description of a design system changes nothing about how an agent uses it, and several of
this project's assumptions need revisiting.

If C scores like D, the static description is sufficient on its own and the live resolver
is an expensive way to deliver information a text file already carried.

**When C fails a check that the hand-written notes in the old `SPEC.md` §9 would have
answered, that is the result.** It names a fact the machine-readable layer does not carry.
Add it to `llms.client.txt`, re-run, and the delta is the value of the repair — which is a
better chapter than any single table of scores.
