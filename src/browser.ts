/**
 * Direct Playwright browser management.
 * No MCP overhead — geno-vla owns the browser directly.
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

export class BrowserManager {
  private _browser: Browser | null = null;
  private _context: BrowserContext | null = null;
  private _page: Page | null = null;

  async launch(options?: { headless?: boolean }): Promise<void> {
    this._browser = await chromium.launch({
      headless: options?.headless ?? true,
    });
    this._context = await this._browser.newContext();
    this._page = await this._context.newPage();
  }

  get page(): Page {
    if (!this._page) throw new Error('Browser not launched. Call launch() first.');
    return this._page;
  }

  get context(): BrowserContext {
    if (!this._context) throw new Error('Browser not launched. Call launch() first.');
    return this._context;
  }

  async newPage(): Promise<Page> {
    this._page = await this.context.newPage();
    return this._page;
  }

  async switchToPage(index: number): Promise<Page> {
    const pages = this.context.pages();
    if (index < 0 || index >= pages.length)
      throw new Error(`Invalid page index ${index}. ${pages.length} pages open.`);
    this._page = pages[index];
    return this._page;
  }

  async close(): Promise<void> {
    await this._browser?.close();
    this._browser = null;
    this._context = null;
    this._page = null;
  }

  /**
   * Get ARIA snapshot of current page — the primary state representation for Claude.
   */
  async ariaSnapshot(root?: string): Promise<string> {
    const page = this.page;
    const locator = root ? page.locator(root) : page.locator('body');
    return await locator.ariaSnapshot();
  }

  /**
   * Take screenshot and return as Buffer.
   */
  async screenshot(options?: { fullPage?: boolean; element?: string }): Promise<Buffer> {
    if (options?.element) {
      return await this.page.locator(options.element).screenshot();
    }
    return await this.page.screenshot({ fullPage: options?.fullPage });
  }
}
