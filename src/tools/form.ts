/**
 * geno_fill_form — Fill an entire form in one call.
 *
 * Instead of: snapshot → type field 1 → type field 2 → ... → click submit (N MCP calls)
 * Just: fill_form (1 MCP call, geno-vla fills all fields locally)
 */

import { z } from 'zod';
import type { BrowserManager } from '../browser.js';
import type { ToolDef } from './types.js';

export const fillFormSchema = z.object({
  fields: z.array(z.object({
    selector: z.string().describe('Playwright selector for the form field'),
    value: z.string().describe('Value to fill in'),
    action: z.enum(['type', 'select', 'check', 'uncheck']).default('type')
      .describe('How to fill the field'),
  })).describe('List of form fields to fill'),
  submit: z.string().optional()
    .describe('Selector for submit button. If provided, clicks it after filling all fields.'),
});

export type FillFormParams = z.infer<typeof fillFormSchema>;

export const fillFormTool: ToolDef<FillFormParams> = {
  schema: {
    name: 'geno_fill_form',
    description: 'Fill an entire form in one call. Provide all field selectors and values, optionally submit. All fields are filled locally without round-trips.',
    inputSchema: fillFormSchema,
  },

  async handle(browser: BrowserManager, params: FillFormParams) {
    const page = browser.page;
    const results: string[] = [];

    for (const field of params.fields) {
      const locator = page.locator(field.selector);
      await locator.waitFor({ state: 'visible', timeout: 5_000 });

      switch (field.action) {
        case 'type':
          await locator.clear();
          await locator.fill(field.value);
          break;
        case 'select':
          await locator.selectOption(field.value);
          break;
        case 'check':
          await locator.check();
          break;
        case 'uncheck':
          await locator.uncheck();
          break;
      }
      results.push(`- Filled \`${field.selector}\` with "${field.value}" (${field.action})`);
    }

    if (params.submit) {
      const submitLocator = page.locator(params.submit);
      await submitLocator.waitFor({ state: 'visible', timeout: 5_000 });
      await submitLocator.click();
      results.push(`- Clicked submit: \`${params.submit}\``);

      // Wait for navigation/response after submit
      await page.waitForLoadState('domcontentloaded').catch(() => {});
      await page.waitForTimeout(200);
    }

    const snapshot = await browser.ariaSnapshot();

    return {
      content: [
        {
          type: 'text' as const,
          text: [
            `## Form filled`,
            ...results,
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
