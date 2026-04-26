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

# geno-vla

Umbrella skill for the geno-vla browser automation skillset.

geno-vla is an MCP server, not a slash-command skillset. It exposes five Playwright-backed tools (`geno_navigate`, `geno_interact`, `geno_observe`, `geno_fill_form`, `geno_extract`) that are available as MCP tools in any agent session once the server is configured.

## Installation

```
geno-tools install geno-vla
```
