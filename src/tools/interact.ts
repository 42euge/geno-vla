/**
 * geno_interact — Smart element interaction with auto-wait and verification.
 *
 * Instead of: snapshot → find element → click → snapshot again (4 MCP calls)
 * Just: interact (1 MCP call, geno-vla handles wait+action+verify internally)
 */

import { z } from 'zod';
import type { BrowserManager } from '../browser.js';
import type { ToolDef } from './types.js';

export const interactSchema = z.object({
  action: z.enum(['click', 'type', 'select', 'check', 'uncheck', 'hover', 'focus'])
    .describe('Action to perform on the element'),
  selector: z.string()
    .describe('Playwright selector for the target element (CSS, role=, text=, etc.)'),
  value: z.string().optional()
    .describe('Value for type/select actions'),
  clearFirst: z.boolean().default(false)
    .describe('Clear existing value before typing (only for type action)'),
});

export type InteractParams = z.infer<typeof interactSchema>;

export const interactTool: ToolDef<InteractParams> = {
  schema: {
    name: 'geno_interact',
    description: 'Interact with a page element. Automatically waits for the element to be visible and actionable, performs the action, then returns the updated page state.',
    inputSchema: interactSchema,
  },

  async handle(browser: BrowserManager, params: InteractParams) {
    const page = browser.page;
    const locator = page.locator(params.selector);

    // Auto-wait for element to be actionable
    await locator.waitFor({ state: 'visible', timeout: 10_000 });

    switch (params.action) {
      case 'click':
        await locator.click();
        break;
      case 'type':
        if (!params.value) throw new Error('value is required for type action');
        if (params.clearFirst) await locator.clear();
        await locator.fill(params.value);
        break;
      case 'select':
        if (!params.value) throw new Error('value is required for select action');
        await locator.selectOption(params.value);
        break;
      case 'check':
        await locator.check();
        break;
      case 'uncheck':
        await locator.uncheck();
        break;
      case 'hover':
        await locator.hover();
        break;
      case 'focus':
        await locator.focus();
        break;
    }

    // Wait for any triggered navigation or network activity to settle
    await page.waitForLoadState('domcontentloaded').catch(() => {});
    // Brief settle for JS-driven UI updates
    await page.waitForTimeout(100);

    const snapshot = await browser.ariaSnapshot();

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `## Action completed`,
            `- Action: ${params.action} on \`${params.selector}\``,
            params.value ? `- Value: ${params.value}` : null,
            `- Page URL: ${page.url()}`,
            ``,
            `## Snapshot`,
            '```yaml',
            snapshot,
            '```',
          ].filter(Boolean).join('\n'),
        },
      ],
    };
  },
};
