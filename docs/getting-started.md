# Getting Started

## Prerequisites

- A supported coding CLI (Claude Code, Gemini CLI, Codex, or OpenCode)
- Node.js 20 or later

## Installation

```bash
geno-tools install geno-vla
```

Or from within an agent session:

```
/geno-tools install geno-vla
```

## Configuration

Add geno-vla to your agent's MCP configuration. For example, in `~/.claude/mcp.json` or `.mcp.json`:

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

To run with a visible browser window, add `--headless=false`:

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

Restart your coding agent after updating the MCP configuration.

## First Use

Once configured, geno-vla tools are available in any agent session. Try navigating to a page:

```
Navigate to https://example.com
```

The agent calls `geno_navigate` and receives the full page state -- URL, title, status code, and ARIA snapshot -- in a single response.

## Available Tools

| Tool | Description |
|------|-------------|
| `geno_navigate` | Navigate to a URL, wait for load, return ARIA snapshot |
| `geno_interact` | Click, type, select, check, hover, or focus with auto-wait |
| `geno_observe` | Get current page state (ARIA snapshot + optional screenshot) |
| `geno_fill_form` | Fill an entire form in one call with optional submit |
| `geno_extract` | Run JavaScript in the page and return structured data |

See the [User Guide](user-guide.md) for detailed documentation of each tool.
