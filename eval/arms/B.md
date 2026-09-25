# Arm B — the packages, and nothing about them

The agent receives `S0.md` plus these two dependencies, installed:

```bash
npm install @jablonowski/dsb-components @jablonowski/dsb-tokens
```

Both packages' READMEs are readable in `node_modules`. Nothing else is provided: no API
table, no list of what exists, no notes about how any component behaves.

**One deletion, and it is the whole reason this arm needs saying out loud.** The published
`@jablonowski/dsb-components` ships `llms.client.txt` inside the tarball, and its README
points at it on line 52. So "the package without the agent-facing contract" is not a state
that exists in the wild for this design system — the harness has to manufacture it, by
deleting that one file from the installed tree after `npm install` and asserting its absence
before and after the run.

The B-1 pilot ran without that deletion. It stayed clean only because the agent read this
overlay, decided the file was out of bounds, declined to open it, and reported the conflict
in its final message. That is admirable and it is not a control: the next run is free to
decide otherwise. B-1 is therefore a pilot, not a scored run.

Worth keeping in the book: shipping the agent contract inside the package is the right
engineering decision, and it makes "a design system without agent documentation" an
unbuildable counterfactual for your own system.

This is the state of a developer who was told "we have a design system, it's on npm."

What the agent has to work out for itself:

- which components exist, and what they are called when imported
- what inputs and outputs each one takes
- which parts of the screens have no component and must be built locally
- that the token stylesheet has to be imported at all, and which entry point to use

Everything in that list is stated plainly in `llms.client.txt` and `contracts.json`, which
arm C adds and this arm withholds. The gap between B and C is the value of writing those
files.
