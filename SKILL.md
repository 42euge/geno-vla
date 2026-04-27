---
name: geno-vla
description: >-
  High-level browser automation MCP server. Collapses multi-step Playwright
  operations into single tool calls — navigate, interact, observe, fill forms,
  and extract data with sub-second latency.
allowed-tools: ""
license: MIT
metadata:
  author: 42euge
  version: "0.1.0"
---

# geno-vla — Browser Automation MCP Server

geno-vla provides five high-level MCP tools that collapse multi-step Playwright operations into single calls:

| Tool | Description |
|------|-------------|
| `geno_navigate` | Navigate to a URL, wait for load, return ARIA snapshot |
| `geno_interact` | Click, type, select, check, hover, or focus an element with auto-wait |
| `geno_observe` | Get current page state as ARIA snapshot with optional screenshot |
| `geno_fill_form` | Fill an entire form in one call with optional submit |
| `geno_extract` | Evaluate JavaScript in the page and return structured data |

## Architecture

geno-vla drives Playwright **directly** — no MCP-over-MCP. The server owns the browser instance and calls Playwright APIs inline within each tool handler.

```
Agent session
    |
    |  stdio (MCP protocol)
    v
geno-vla MCP Server
    |
    |  direct Playwright API
    v
Chromium Browser
```

## Installation

```
geno-tools install geno-vla
```

## Usage

Once installed, the MCP tools are available in any agent session. Use natural language to navigate pages, interact with elements, fill forms, and extract data. Each call returns the full page state so the agent always knows what is on screen.
