# geno-vla

High-level browser automation MCP server for Claude Code. Collapses multi-step Playwright operations into single tool calls.

## The Problem

The standard Playwright MCP server requires multiple round-trips per logical action -- navigate, wait, snapshot, find element, click, snapshot again. Each round-trip takes 3-10 seconds through the MCP protocol. For a simple "click a button" workflow, that is 4+ calls and 12-40 seconds of wall time.

**geno-vla** collapses these into single high-level calls that handle the full lifecycle locally: wait, act, verify, return state. One call, sub-second latency.

## Architecture

```
Claude Code
    |
    |  stdio (MCP protocol)
    v
geno-vla MCP Server
    |
    |  direct API calls (no MCP overhead)
    v
Playwright (chromium)
    |
    v
Browser
```

The key design decision: geno-vla drives Playwright **directly** rather than wrapping another MCP server. There is no MCP-over-MCP. The server owns the browser instance and calls Playwright APIs inline within each tool handler.

## Quick Start

```bash
# Install
cd geno-vla
npm install
npx playwright install chromium
npm run build

# Configure in Claude Code (~/.claude/mcp.json or project .mcp.json)
```

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "geno-vla": {
      "command": "node",
      "args": ["/absolute/path/to/geno-vla/dist/cli.js"]
    }
  }
}
```

To run with a visible browser window:

```json
{
  "mcpServers": {
    "geno-vla": {
      "command": "node",
      "args": ["/absolute/path/to/geno-vla/dist/cli.js", "--headless=false"]
    }
  }
}
```

## Available Tools

| Tool | Description | Replaces |
|---|---|---|
| `geno_navigate` | Navigate to a URL. Waits for load, returns ARIA snapshot. | `navigate` + `wait` + `snapshot` (3 calls) |
| `geno_interact` | Click, type, select, check, hover, or focus an element. Auto-waits for visibility, performs action, returns updated state. | `snapshot` + `find` + `click` + `snapshot` (4 calls) |
| `geno_observe` | Get current page state as ARIA snapshot, optionally with screenshot. | `snapshot` + `screenshot` (2 calls) |
| `geno_fill_form` | Fill an entire form in one call -- all fields plus optional submit. | N `type` calls + `click` submit (N+1 calls) |
| `geno_extract` | Evaluate a JavaScript expression in the page and return the result as JSON. | `evaluate` (1 call, but with simpler interface) |

## Performance

Measured against `example.com` with headless Chromium:

| Operation | geno-vla | Playwright MCP (estimated) |
|---|---|---|
| Navigate + snapshot | 309 ms | 3-10 sec (3 round-trips) |
| Observe (ARIA only) | 3 ms | 3-5 sec (1-2 round-trips) |
| Observe + screenshot | 297 ms | 6-10 sec (2-3 round-trips) |
| Click + verify | 460 ms | 6-15 sec (4 round-trips) |
| Extract data | 2 ms | 3-5 sec (1 round-trip) |

## Roadmap

### Phase 1: MCP Tool Server (current)

High-level tools that collapse multi-step browser workflows into single MCP calls. Direct Playwright integration with no MCP-over-MCP overhead.

### Phase 2: Local VLM Integration

Add a local vision-language model for on-device page understanding. The VLM processes screenshots locally to identify elements, understand layout, and make interaction decisions without sending images back through the MCP protocol.

### Phase 3: Autonomous Action Chains

Chain multiple actions into autonomous workflows. Define goals ("fill out this form with my info and submit") and let geno-vla plan and execute the full sequence locally, reporting back only when complete or when it needs clarification.

## Development

```bash
npm run watch    # Rebuild on changes
npm run dev      # Run with tsx (no build step)
npx tsx test.ts  # Smoke tests
```

## License

MIT
