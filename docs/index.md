# geno-vla

**High-level browser automation MCP server for Claude Code.**

geno-vla provides a small set of powerful tools that collapse multi-step Playwright operations into single MCP calls. Instead of navigating, waiting, snapshotting, finding an element, clicking, and snapshotting again (6 round-trips at 3-10 seconds each), you make one `geno_interact` call that completes in under 500ms.

## Why geno-vla?

The standard Playwright MCP server exposes low-level browser primitives. Every action requires multiple round-trips through the MCP protocol:

1. **Navigate** to a page (round-trip 1)
2. **Wait** for it to load (round-trip 2)
3. **Snapshot** to see what is on the page (round-trip 3)
4. **Click** an element (round-trip 4)
5. **Snapshot** again to see the result (round-trip 5)

Each round-trip adds 3-10 seconds of latency. A simple form submission can take over a minute.

geno-vla solves this by handling the full lifecycle -- wait, act, verify -- inside each tool call. The MCP server drives Playwright directly (no MCP-over-MCP) and returns the final state in a single response.

## Tools at a Glance

- **geno_navigate** -- Go to a URL, wait for load, return page state
- **geno_interact** -- Click, type, select, check, hover, or focus with auto-wait and verification
- **geno_observe** -- Get current page state (ARIA snapshot + optional screenshot)
- **geno_fill_form** -- Fill all fields in a form and optionally submit, in one call
- **geno_extract** -- Run JavaScript in the page and return structured data

## Getting Started

See the [User Guide](user-guide.md) for installation, configuration, and detailed usage of each tool.

Want to contribute? Read the [Contributing Guide](contributing.md) for development setup, project structure, and how to add new tools.

## Architecture

```
Claude Code
    |
    |  stdio (MCP protocol)
    v
geno-vla MCP Server
    |
    |  direct Playwright API
    v
Chromium Browser
```

geno-vla owns the browser instance directly. There is no intermediate MCP server or protocol wrapper between geno-vla and Playwright. This eliminates an entire layer of serialization and round-trip overhead.
