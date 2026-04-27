# geno-vla

High-level browser automation MCP server for AI coding agents. Collapses multi-step Playwright operations into single tool calls with sub-second latency.

## Overview

geno-vla provides five MCP tools that handle the full browser interaction lifecycle -- wait, act, verify -- inside each call. Instead of multiple round-trips through the MCP protocol, each operation completes in a single request.

| Tool | Description |
|------|-------------|
| `geno_navigate` | Navigate to a URL, wait for load, return ARIA snapshot |
| `geno_interact` | Click, type, select, check, hover, or focus with auto-wait |
| `geno_observe` | Get current page state (ARIA snapshot + optional screenshot) |
| `geno_fill_form` | Fill an entire form in one call with optional submit |
| `geno_extract` | Run JavaScript in the page and return structured data |

## Architecture

geno-vla drives Playwright **directly** -- no MCP-over-MCP. The server owns the browser instance and calls Playwright APIs inline within each tool handler.

```
Coding agent
    |
    |  stdio (MCP protocol)
    v
geno-vla MCP Server
    |
    |  direct Playwright API
    v
Chromium Browser
```

## Next steps

- [Getting Started](getting-started.md) -- installation, configuration, first use
- [User Guide](user-guide.md) -- detailed tool documentation and common workflows
- [Contributing](contributing.md) -- development setup, project structure, adding tools
