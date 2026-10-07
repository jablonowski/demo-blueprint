# Method

[← docs index](start.md)

How a run is produced, and what is held constant while it is.

## The arms

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
more five-arm rounds; see [`eval/PROTOCOL.md`](../eval/PROTOCOL.md).

**Arm B required a deletion.** The published `@jablonowski/dsb-components` ships
`llms.client.txt` inside the tarball and its README points at it, so "the package without
the agent-facing contract" does not exist in the wild for this design system. The harness
removes that one file after install and asserts its absence before and after the run.

## The specification

[`eval/S0.md`](../eval/S0.md) describes a small CRUD application: login, a metrics dashboard, a
users table, four dialogs. It names **zero component names and zero design values**. If it
said `<dsb-button>` or `#111111`, every arm would be handed the answer to what is being
measured.

## The design source

The Figma file, served through a **recorded** channel
([`eval/scripts/figma-cache-mcp.js`](../eval/scripts/figma-cache-mcp.js)). The recording
replays the real Figma MCP server under the same tool names and input schemas, so an arm
calls `get_figma_data` exactly as it would live.

Two reasons. Every arm then receives byte-identical design data, in every round — five live
fetches are five slightly different conditions. And one arm's run empties the Figma API
quota for days, which makes a live channel unaffordable for a grid: in the round that
established this, arm A ran with design data and the rest got `429, retry after 4.6 days`.

The recording is pruned to the frames the specification names. The full file also carries
the design system's own component library as a canvas, and serving that would hand arm A
the thing arm A is defined by not having.

## Rounds

A round is run *n* of every arm, back to back in one sitting. Running a whole arm at a time
would make the arm and the day the same variable: if A runs on Tuesday and D on Friday and
the served model changes on Wednesday, nothing in the results separates the two. The cost is
that runs *within* an arm spread over days, which shows up as variance — the cheaper
confound, because the table reports variance and does not report drift.

---

Next: [what was pre-registered](pre-registration.md) · [what is not claimed](limitations.md)
