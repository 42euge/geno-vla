import type { z } from 'zod';
import type { BrowserManager } from '../browser.js';

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: z.ZodType;
}

export interface ToolResult {
  [key: string]: unknown;
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mimeType: string }
  >;
  isError?: boolean;
}

export interface ToolDef<T = unknown> {
  schema: ToolSchema;
  handle(browser: BrowserManager, params: T): Promise<ToolResult>;
}
