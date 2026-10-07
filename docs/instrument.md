# A note on the instrument

[← docs index](start.md)

**Eleven times during this work a gate reported success while proving a different
proposition than the one it was written for.** Each one was green.

- A visual-regression flag that disarmed the comparison it gated.
- A published stylesheet that passed every test and could not render the library it
  belonged to.
- A preflight check asserting that an API token was *present* rather than that it *worked*,
  which let eight runs go out blind against a 403.
- Arm B shipping the very file that defined it as the arm without that file.
- `grep -c`, which exits 1 on no match, killing a run silently under `pipefail`.
- A calibration check that passed while comparing zero with zero.
- A void rule that tested whether a tool *name* was denied rather than whether the arm had
  lost a defining capability, and discarded a good run.
- A scorer that reduced a run aborted mid-session to a row indistinguishable from an arm
  performing badly.

Two are worth more than the rest, because of *when* they happened.

**The tenth was introduced while tidying, not while building.** `eval/node_modules` was
untracked from git before the repository was made public — committed dependencies look
careless. Those packages were the only source of the accessibility measurement and had
never been installed by npm, so every arm A′ run came back with `a11y: unavailable`. The
scorer recorded `unavailable` rather than `0`, which is the only reason this was recoverable
rather than quietly wrong: a table showing A′ with zero accessibility violations would have
been the exact inverse of the truth. Preflight still does not check the scorer's own
dependencies.

**The eleventh was about to change a published conclusion rather than discard a run.** Check
`9.6` asked whether a split modal footer set `flex:1` on the projected element, and returned
`na` whenever the run had not built a split footer — five of fifteen library-arm runs,
spread across B, C and D. So it reported on what the agent chose to build, not on what it
knew about the component API. Counted, it made arm D look better than arm C and would have
reversed the study's pre-registered finding about the token resolver. Removed, C and D are
identical at 35/35 and every `na` in the library arms disappears.

Nothing crashed. The table was complete and the numbers were plausible, and they said the
opposite of the truth.

Each of the eleven is recorded in [`eval/PROTOCOL.md`](../eval/PROTOCOL.md) with what it cost
and what replaced it — not as an aside, but because **an evaluation is only worth the
property its gates actually test.**
