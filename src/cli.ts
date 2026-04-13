#!/usr/bin/env node

/**
 * geno-vla CLI
 *
 * Usage:
 *   geno-vla                    # Start MCP server on stdio
 *   geno-vla --headless=false   # Start with visible browser
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BrowserManager } from './browser.js';
import { createServer } from './server.js';

async function main() {
  const args = process.argv.slice(2);
  const headless = !args.includes('--headless=false');
  const chromePathArg = args.find((a) => a.startsWith('--chrome-path='));
  const chromePath = chromePathArg ? chromePathArg.split('=').slice(1).join('=') : undefined;

  const browser = new BrowserManager();
  await browser.launch({ headless, chromePath });

  const server = createServer(browser);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Clean up on exit
  const cleanup = async () => {
    await browser.close();
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('geno-vla failed to start:', err);
  process.exit(1);
});
