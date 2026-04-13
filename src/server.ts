/**
 * geno-vla MCP Server
 *
 * Exposes high-level browser automation tools to Claude Code.
 * Each tool call handles the full lifecycle locally (wait, act, verify)
 * instead of requiring multiple round-trips.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BrowserManager } from './browser.js';
import { navigateTool, navigateSchema } from './tools/navigate.js';
import { interactTool, interactSchema } from './tools/interact.js';
import { observeTool, observeSchema } from './tools/observe.js';
import { fillFormTool, fillFormSchema } from './tools/form.js';
import { extractTool, extractSchema } from './tools/extract.js';

export function createServer(browser: BrowserManager): McpServer {
  const server = new McpServer({
    name: 'geno-vla',
    version: '0.1.0',
  });

  // Register tools — each wraps Playwright directly, no MCP-over-MCP
  server.tool(
    navigateTool.schema.name,
    navigateTool.schema.description,
    navigateSchema.shape,
    async (params) => navigateTool.handle(browser, params as any),
  );

  server.tool(
    interactTool.schema.name,
    interactTool.schema.description,
    interactSchema.shape,
    async (params) => interactTool.handle(browser, params as any),
  );

  server.tool(
    observeTool.schema.name,
    observeTool.schema.description,
    observeSchema.shape,
    async (params) => observeTool.handle(browser, params as any),
  );

  server.tool(
    fillFormTool.schema.name,
    fillFormTool.schema.description,
    fillFormSchema.shape,
    async (params) => fillFormTool.handle(browser, params as any),
  );

  server.tool(
    extractTool.schema.name,
    extractTool.schema.description,
    extractSchema.shape,
    async (params) => extractTool.handle(browser, params as any),
  );

  return server;
}
