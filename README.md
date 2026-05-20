# demo-blueprint

A reference repository for generating a production-quality Angular CRUD demo application built on top of the **Design System Blueprint** (`@jablonowski/dsb-components` + `@jablonowski/dsb-tokens`).

The project uses a **Figma MCP server** to read the design file directly, so the generated app matches the visual specification precisely without manual back-and-forth.

---

## What's inside

| File | Purpose |
|---|---|
| `spec.md` | Complete specification — tech stack, routes, component inventory, mock data schema, and Figma fidelity rules. Feed this to an AI assistant to generate the full app. |
| `.vscode/mcp.json` | Figma MCP server configuration (token loaded from env, never hardcoded). |

## Prerequisites

- Node.js 18+
- A Figma personal access token exported as `FIGMA_ACCESS_TOKEN` in your shell profile (e.g. `~/.zshrc`):
  ```bash
  export FIGMA_ACCESS_TOKEN="your_token_here"
  ```

---

## Generating the app

Open this workspace in VS Code with GitHub Copilot and use the following prompt in **Agent mode**:

```
spec.md contains precise instructions for building the application.
Please analyse the full specification, connect to the Figma MCP server
to verify the layouts, and implement every route, component, service,
and guard exactly as described. Do not skip any section.
```

The agent will scaffold the Angular project, install dependencies, wire up the in-memory API, and produce pixel-accurate components based on the Figma frames.

---

## Running the app (after generation)

```bash
npm install
npx @angular/cli@19 serve --open
```

Navigate to `http://localhost:4200`. Log in with `admin` / `admin`.
