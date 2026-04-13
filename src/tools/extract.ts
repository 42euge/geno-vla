/**
 * geno_extract — Extract structured data from the page.
 *
 * Runs a JavaScript expression in the browser and returns the result.
 * Useful for pulling text, attributes, lists, tables, etc.
 */

import { z } from 'zod';
import type { BrowserManager } from '../browser.js';
import type { ToolDef } from './types.js';

export const extractSchema = z.object({
  expression: z.string()
    .describe('JavaScript expression to evaluate in the page context. Must return a serializable value.'),
});

export type ExtractParams = z.infer<typeof extractSchema>;

export const extractTool: ToolDef<ExtractParams> = {
  schema: {
    name: 'geno_extract',
    description: 'Extract data from the page by evaluating a JavaScript expression. Returns the result as JSON. Use for pulling text, attributes, table data, etc.',
    inputSchema: extractSchema,
  },

  async handle(browser: BrowserManager, params: ExtractParams) {
    const page = browser.page;

    const result = await page.evaluate(params.expression);

    return {
      content: [
        {
          type: 'text' as const,
          text: typeof result === 'string'
            ? result
            : JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
