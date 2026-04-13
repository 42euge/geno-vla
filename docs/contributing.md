# Contributing

## Development Setup

```bash
git clone https://github.com/42euge/geno-vla.git
cd geno-vla
npm ci
npx playwright install chromium
npm run watch   # Rebuild on file changes
```

Use `npm run dev` to run the server directly with `tsx` (no build step needed):

```bash
npm run dev
```

## Project Structure

```
geno-vla/
  src/
    cli.ts              # Entry point. Parses CLI args, launches browser, starts MCP server.
    server.ts           # Creates the McpServer and registers all tools.
    browser.ts          # BrowserManager class. Owns the Playwright browser instance.
    tools/
      navigate.ts       # geno_navigate -- URL navigation with auto-wait
      interact.ts       # geno_interact -- Element interaction with verification
      observe.ts        # geno_observe  -- Page state observation + screenshots
      form.ts           # geno_fill_form -- Batch form filling
      extract.ts        # geno_extract  -- JavaScript evaluation for data extraction
  dist/                 # Compiled output (gitignored)
  test.ts               # Smoke tests
  package.json
  tsconfig.json
```

### Key files

- **`browser.ts`** -- The `BrowserManager` class manages the Playwright browser, context, and page lifecycle. It provides `ariaSnapshot()` and `screenshot()` helpers used by all tools.

- **`server.ts`** -- Creates an `McpServer` and registers each tool with its name, description, zod schema, and handler function.

- **`cli.ts`** -- The entry point when running as an MCP server. Parses `--headless=false`, launches the browser, creates the server, and connects via `StdioServerTransport`.

- **Tool files** -- Each tool file exports a zod schema and a `ToolDef` object with `schema` (name, description, inputSchema) and `handle(browser, params)` method.

## How to Add a New Tool

1. **Create a new file** in `src/tools/`, e.g. `src/tools/mytool.ts`.

2. **Define the schema** using zod:

    ```typescript
    import { z } from 'zod';
    import type { BrowserManager } from '../browser.js';
    import type { ToolDef } from './types.js';

    export const myToolSchema = z.object({
      param1: z.string().describe('Description of param1'),
    });

    export type MyToolParams = z.infer<typeof myToolSchema>;
    ```

3. **Define the tool** with schema metadata and handler:

    ```typescript
    export const myTool: ToolDef<MyToolParams> = {
      schema: {
        name: 'geno_mytool',
        description: 'What this tool does.',
        inputSchema: myToolSchema,
      },

      async handle(browser: BrowserManager, params: MyToolParams) {
        const page = browser.page;
        // ... do work with Playwright ...

        const snapshot = await browser.ariaSnapshot();

        return {
          content: [
            {
              type: 'text' as const,
              text: `Result:\n\`\`\`yaml\n${snapshot}\n\`\`\``,
            },
          ],
        };
      },
    };
    ```

4. **Register the tool** in `src/server.ts`:

    ```typescript
    import { myTool, myToolSchema } from './tools/mytool.js';

    // Inside createServer():
    server.tool(
      myTool.schema.name,
      myTool.schema.description,
      myToolSchema.shape,
      async (params) => myTool.handle(browser, params as any),
    );
    ```

5. **Add a test case** to `test.ts`.

### Naming convention

All tool names use the `geno_` prefix (e.g., `geno_navigate`, `geno_interact`). This avoids conflicts with other MCP servers and makes it clear which tools belong to geno-vla.

## Code Style

- **TypeScript** with strict mode enabled
- **ESM modules** (`"type": "module"` in package.json, `.js` extensions in imports)
- **Zod** for input validation and schema definition
- Prefer `const` over `let`; avoid `var`
- Use `async/await`, not raw promises
- Tool handlers return `{ content: Array<{ type: 'text', text: string } | { type: 'image', data: string, mimeType: string }> }`

## Testing

Run the smoke tests:

```bash
npx tsx test.ts
```

The test file calls each tool handler directly (bypassing MCP transport) against `example.com`. It measures timing and prints abbreviated output for each tool.

There is no formal test framework at this time. Tests are assertions-by-observation: run them, check the output, verify timing is reasonable and content is correct.

## Architecture Decisions

### Why direct Playwright, not an MCP wrapper?

The obvious approach would be to wrap the existing Playwright MCP server, translating high-level tool calls into sequences of low-level MCP calls. We rejected this because:

- **Latency**: Each MCP call involves JSON serialization, stdio transport, and protocol overhead. Chaining 4-5 calls turns sub-second operations into 12-40 second workflows.
- **Reliability**: More round-trips means more chances for failure, timeouts, or state inconsistency.
- **Simplicity**: Direct Playwright API calls are simpler to write, debug, and maintain than orchestrated MCP call chains.

### Why high-level tools, not low-level?

We could expose every Playwright method as an individual MCP tool. Instead, we expose 5 tools that cover common workflows:

- **Fewer round-trips**: The primary goal. A "click a button" workflow is 1 call, not 4.
- **Built-in best practices**: Each tool auto-waits for elements, handles load states, and returns updated page state. The AI does not need to remember to snapshot after every action.
- **Composability**: The tools are designed to be composed naturally. Navigate, then interact, then extract. Each step returns enough context for the next.

### Why ARIA snapshots as the primary state representation?

ARIA snapshots provide a structured, accessible representation of the page that is much smaller than raw HTML and more semantically meaningful than DOM dumps. They work well as context for language models because they focus on the interactive and content elements.

## Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npx tsx test.ts` and verify all tests pass
5. Run `npm run build` and verify it compiles without errors
6. Submit a pull request with a clear description of what changed and why
