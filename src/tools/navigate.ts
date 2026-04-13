/**
 * geno_navigate — Smart navigation that handles the full lifecycle locally.
 *
 * Instead of: navigate → wait → snapshot → return (3 MCP calls)
 * Just: navigate (1 MCP call, geno-vla handles wait+snapshot internally)
 */

import { z } from 'zod';
import type { BrowserManager } from '../browser.js';
import type { ToolDef } from './types.js';

export const navigateSchema = z.object({
  url: z.string().describe('URL to navigate to'),
  waitUntil: z.enum(['load', 'domcontentloaded', 'networkidle', 'commit'])
    .default('domcontentloaded')
    .describe('When to consider navigation complete. Use "commit" for fastest, "networkidle" for most thorough.'),
});

export type NavigateParams = z.infer<typeof navigateSchema>;

export const navigateTool: ToolDef<NavigateParams> = {
  schema: {
    name: 'geno_navigate',
    description: 'Navigate to a URL. Waits for the page to be ready and returns the page state (ARIA snapshot). Handles redirects, loading, and errors automatically.',
    inputSchema: navigateSchema,
  },

  async handle(browser: BrowserManager, params: NavigateParams) {
    const page = browser.page;

    const response = await page.goto(params.url, {
      waitUntil: params.waitUntil,
      timeout: 30_000,
    });

    // Auto-wait for the page to stabilize
    await page.waitForLoadState('domcontentloaded');

    const snapshot = await browser.ariaSnapshot();
    const url = page.url();
    const title = await page.title();
    const status = response?.status() ?? null;

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `## Page loaded`,
            `- URL: ${url}`,
            `- Title: ${title}`,
            `- Status: ${status}`,
            ``,
            `## Snapshot`,
            '```yaml',
            snapshot,
            '```',
          ].join('\n'),
        },
      ],
    };
  },
};
