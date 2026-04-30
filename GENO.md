# geno-vla — High-level browser automation MCP server

Collapses multi-step Playwright operations into single MCP tool calls with sub-second latency. Drives Playwright directly (no MCP-over-MCP).

## Tools

| Tool | Description |
|------|-------------|
| `geno_navigate` | Navigate to a URL, wait for load, return ARIA snapshot |
| `geno_interact` | Click, type, select, check, hover, or focus with auto-wait and verification |
| `geno_observe` | Get current page state (ARIA snapshot + optional screenshot) |
| `geno_fill_form` | Fill all fields in a form and optionally submit, in one call |
| `geno_extract` | Run JavaScript in the page and return structured data |

## Repo structure

```
geno-vla/
├── GENO.md              # agent instructions (this file)
├── SKILL.md             # umbrella skill manifest
├── genotools.yaml       # geno-tools manifest
├── skills/
│   └── geno-vla/        #   umbrella skill
├── src/
│   ├── cli.ts           # entry point — parses CLI args, launches browser, starts server
│   ├── server.ts        # creates McpServer and registers all tools
│   ├── browser.ts       # BrowserManager — owns Playwright browser instance
│   └── tools/
│       ├── navigate.ts  # geno_navigate
│       ├── interact.ts  # geno_interact
│       ├── observe.ts   # geno_observe
│       ├── form.ts      # geno_fill_form
│       ├── extract.ts   # geno_extract
│       └── types.ts     # shared ToolDef type
├── docs/                # MkDocs Material site
├── test.ts              # smoke tests
├── package.json         # Node.js package
└── tsconfig.json        # TypeScript config
```

## Architecture

```
Agent session
    |
    |  stdio (MCP protocol)
    v
geno-vla MCP Server (src/server.ts)
    |
    |  direct Playwright API (no MCP-over-MCP)
    v
Chromium Browser
```

The server owns the browser instance directly. Each tool handler calls Playwright APIs inline: wait for element, perform action, capture state, return result. No intermediate protocol layer.

## Conventions

- **Tool naming**: all tool names use the `geno_` prefix (e.g. `geno_navigate`, `geno_interact`)
- **Tool implementation**: each tool lives in `src/tools/<name>.ts` and exports a zod schema + `ToolDef` object
- **Tool registration**: tools are registered in `src/server.ts` via `server.tool()`
- **State representation**: ARIA snapshots are the primary page state format returned by tools
- **Module format**: ESM (`"type": "module"` in package.json, `.js` extensions in imports)
- **TypeScript**: strict mode enabled, `const` over `let`, `async/await` over raw promises
- **Prefix aliasing**: this repo uses the canonical `geno-vla` prefix. Since it is an MCP server (not a slash-command package), there are no `/gt-*` aliases, but the `geno_` prefix on tool names serves the same namespacing role
- **Adding a new skill**: create a directory under `skills/<skill-name>/` containing a `SKILL.md` manifest. Register the skill name in the Skills table below and document its purpose in the manifest

## Skills

| Skill | Description |
|-------|-------------|
| `geno-vla` | Umbrella skill — high-level browser automation via MCP tools |

## Dependencies

- **Node.js** >= 20
- **Playwright** with Chromium (`npx playwright install chromium`)
- **@modelcontextprotocol/sdk** for MCP server implementation
- **Zod** for input validation and schema definition
