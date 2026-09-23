# Arm D — the resolver in the loop

Arm C — `S0`, the packages, `llms.client.txt` — plus `@jablonowski/dsb-tokens-mcp`
connected as an MCP server for the session:

```json
{
  "mcpServers": {
    "dsb-tokens": { "command": "npx", "args": ["-y", "@jablonowski/dsb-tokens-mcp"] }
  }
}
```

Two tools become available. `resolve_token` turns an intent — "background for the primary
action" — into a tier 2 decision token, or refuses. `explain_component_tokens` maps a
component's private tokens onto the public ones to use instead.

The agent is told the server exists and what it answers. It is not told to use it, and not
told when.

## What this arm is actually testing

Not whether the resolver returns correct answers — 23 tests already assert that, and they
run on every pull request.

**Whether an answer, or a refusal, changes what the agent writes.**

And a second question the sizes make unavoidable: a resolver asked three times costs a few
hundred tokens; the contract file it stands in for costs 13,400 whether the agent reads it
or not. If D matches an arm holding the whole contract in context, the argument for the
resolver is not better answers — it is the same answers without carrying the encyclopedia.

The resolver's central behaviour is that it returns `no-coverage` rather than guessing when
an intent has no semantic token behind it. The demo application contains at least one such
case: the dashboard's chart bars need a pure black, and the decisions layer has no pure
black (see `../SCORERS.md`, §3). So the resolver will refuse, on the record, during the run.

What happens next is the measurement:

- the agent composes something from what does exist — the system had a way to say it
- the agent writes a literal and moves on — the honest answer to a genuine gap, and a
  finding about the token set rather than about the agent
- the agent ignores the refusal and reaches into tier 1 — the boundary failed where it
  matters, in the channel it was built for

A contract test can prove the resolver refuses. Only this can show whether refusing is
worth anything.
