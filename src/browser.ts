/**
 * Direct Playwright browser management.
 * No MCP overhead — geno-vla owns the browser directly.
 *
 * Uses the system Chrome (not Chrome for Testing) so that Google login works,
 * and a persistent user-data directory so cookies/sessions survive restarts.
 */

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from 'node:fs';

/** Default path to the regular Google Chrome application on macOS. */
const SYSTEM_CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Base directory for geno-vla Chrome profiles. */
const PROFILES_BASE = join(homedir(), '.geno', 'chrome-profiles');

/** Lockfile to prevent multiple instances from colliding. */
function acquireProfile(): string {
  mkdirSync(PROFILES_BASE, { recursive: true });
  // Try profile slots 0-9; pick the first unlocked one
  for (let i = 0; i < 10; i++) {
    const dir = join(PROFILES_BASE, `slot-${i}`);
    const lock = join(dir, '.geno-lock');
    mkdirSync(dir, { recursive: true });
    if (!existsSync(lock)) {
      // Claim this slot
      writeFileSync(lock, String(process.pid));
      // Clean lock on exit
      const cleanup = () => { try { rmSync(lock); } catch {} };
      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      return dir;
    }
    // Check if the locking process is still alive
    try {
      const pid = parseInt(readFileSync(lock, 'utf8').trim(), 10);
      process.kill(pid, 0); // throws if process doesn't exist
    } catch {
      // Stale lock — reclaim
      rmSync(lock);
      writeFileSync(lock, String(process.pid));
      const cleanup = () => { try { rmSync(lock); } catch {} };
      process.on('exit', cleanup);
      process.on('SIGINT', cleanup);
      process.on('SIGTERM', cleanup);
      return dir;
    }
  }
  throw new Error('All 10 Chrome profile slots are in use');
}

export class BrowserManager {
  private _context: BrowserContext | null = null;
  private _page: Page | null = null;
  private _profileDir: string | null = null;

  async launch(options?: { headless?: boolean; chromePath?: string }): Promise<void> {
    const executablePath = options?.chromePath ?? SYSTEM_CHROME_PATH;
    this._profileDir = acquireProfile();

    // launchPersistentContext stores cookies, localStorage, and session data
    // to disk so Google login (and other auth) persists across restarts.
    this._context = await chromium.launchPersistentContext(this._profileDir, {
      headless: options?.headless ?? true,
      executablePath,
      channel: undefined,
    });

    // Persistent context opens a blank page by default
    const pages = this._context.pages();
    this._page = pages.length > 0 ? pages[0] : await this._context.newPage();
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
    await this._context?.close();
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
