# Arm B — the packages, and nothing about them

The agent receives `S0.md` plus these two dependencies, installed:

```bash
npm install @jablonowski/dsb-components @jablonowski/dsb-tokens
```

Both packages' READMEs are readable in `node_modules`. Nothing else is provided: no API
table, no list of what exists, no notes about how any component behaves.

This is the state of a developer who was told "we have a design system, it's on npm."

What the agent has to work out for itself:

- which components exist, and what they are called when imported
- what inputs and outputs each one takes
- which parts of the screens have no component and must be built locally
- that the token stylesheet has to be imported at all, and which entry point to use

Everything in that list is stated plainly in `llms.client.txt` and `contracts.json`, which
arm C adds and this arm withholds. The gap between B and C is the value of writing those
files.
