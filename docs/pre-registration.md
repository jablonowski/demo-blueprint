# Pre-registration

[← docs index](start.md)

[`eval/PROTOCOL.md`](../eval/PROTOCOL.md) carries the predictions, recorded before the runs,
and a falsifier stated in advance:

> If arm D hand-implements more than one of the components the library already provides,
> the machine-readable layer is not worth building.

It records the predictions that failed as prominently as the ones that held, every decision
that changed the design mid-study and why, and every run that was discarded.

The full set — the predictions, where the design system was predicted to lose, the arm the
author was least confident about, and the denominators each one would be judged on — is in
[`eval/PROTOCOL.md`](../eval/PROTOCOL.md) above the results section. It was written before
the first scored run and has not been edited since, only appended to.

Two pre-registered comparisons went against this repository's premise and are published with
the same prominence as the ones that did not:

- **the token resolver (C versus D)** — pre-registered as the decisive comparison. At n = 5
  the two arms are identical on every check verdict in ten runs, and D costs more.
- **the firewall claim** — zero hallucinated API references in thirty runs, arms A and A′
  included. An agent does not hallucinate a component whose existence it does not suspect.

One went the author's way, and that is worth stating as plainly:

- **arm A′** — the system written down but not shipped, pre-registered as the arm that could
  overturn the technical core. It came out worse than no system at all on consistency.
