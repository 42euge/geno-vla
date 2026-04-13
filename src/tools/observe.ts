/**
 * geno_observe — Smart page observation with optional screenshot.
 *
 * Returns ARIA snapshot by default. Optionally includes a screenshot
 * for visual verification. Supports scoping to a specific element.
 */

import { z } from 'zod';
import type { BrowserManager } from '../browser.js';
import type { ToolDef } from './types.js';

export const observeSchema = z.object({
  includeScreenshot: z.boolean().default(false)
    .describe('Include a screenshot in the response for visual verification'),
  selector: z.string().optional()
    .describe('Scope observation to a specific element'),
  fullPage: z.boolean().default(false)
    .describe('Take full page screenshot (only when includeScreenshot is true)'),
});

export type ObserveParams = z.infer<typeof observeSchema>;

export const observeTool: ToolDef<ObserveParams> = {
  schema: {
    name: 'geno_observe',
    description: 'Observe the current page state. Returns an ARIA snapshot and optionally a screenshot. Use this when you need to understand what is on the page.',
    inputSchema: observeSchema,
  },

  async handle(browser: BrowserManager, params: ObserveParams) {
    const page = browser.page;
    const snapshot = await browser.ariaSnapshot(params.selector);
    const url = page.url();
    const title = await page.title();

    const content: Array<{ type: 'text'; text: string } | { type: 'image'; data: string; mimeType: string }> = [
      {
        type: 'text' as const,
        text: [
          `## Page state`,
          `- URL: ${url}`,
          `- Title: ${title}`,
          ``,
          `## Snapshot`,
          '```yaml',
          snapshot,
          '```',
        ].join('\n'),
      },
    ];

    if (params.includeScreenshot) {
      const screenshotBuffer = await browser.screenshot({
        fullPage: params.fullPage,
        element: params.selector,
      });
      content.push({
        type: 'image' as const,
        data: screenshotBuffer.toString('base64'),
        mimeType: 'image/png',
      });
    }

    return { content };
  },
};
