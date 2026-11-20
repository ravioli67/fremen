/**
 * Manages the Chromium browser lifecycle.
 * Handles launching, session creation, and safe shutdown.
 */

import { randomUUID } from "node:crypto";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import FremenLogger from "../utils/Logger.js";
import { BrowserLaunchError, BrowserSessionError, errorMessage } from "../utils/errors.js";
import { BrowserSession } from "./BrowserSession.js";

export interface BrowserConfig {
  /** Run headless (true) or with a visible window (false). */
  headless: boolean;
}

export interface SessionOptions {
  /** Path to a Playwright storage-state file used to restore an authenticated session. */
  storageStatePath?: string;
}

const DEFAULT_CONFIG: BrowserConfig = { headless: true };

export class BrowserManager {
  private browser: Browser | null = null;
  private browserId: string | null = null;
  private launchPromise: Promise<Browser> | null = null;
  private readonly logger = FremenLogger.getInstance();

  /**
   * Launch Chromium. Resolves true once a browser is available.
   * Concurrent and repeated calls share a single browser instance.
   */
  async launchBrowser(config?: Partial<BrowserConfig>): Promise<boolean> {
    if (this.browser?.isConnected()) {
      return true;
    }

    if (this.launchPromise) {
      await this.launchPromise;
      return this.isActive();
    }

    const finalConfig: BrowserConfig = { ...DEFAULT_CONFIG, ...config };
    this.logger.info(`Launching Chromium in ${finalConfig.headless ? "headless" : "headed"} mode`, {
      config: finalConfig,
    });

    const pending = this.doLaunch(finalConfig);
    this.launchPromise = pending;
    try {
      this.browser = await pending;
      this.browserId = randomUUID();
      this.logger.debug("Browser launched successfully", { browserId: this.browserId });
      return true;
    } finally {
      if (this.launchPromise === pending) {
        this.launchPromise = null;
      }
    }
  }

  private async doLaunch(config: BrowserConfig): Promise<Browser> {
    try {
      return await chromium.launch({ headless: config.headless });
    } catch (error) {
      this.logger.error("Failed to launch Chromium", { error: errorMessage(error) });
      throw new BrowserLaunchError("Failed to launch Chromium browser", error);
    }
  }

  /**
   * Create a new isolated browser session (context).
   * Returns null if the browser has not been launched.
   */
  async getSession(options?: SessionOptions): Promise<BrowserSession | null> {
    if (!this.browser?.isConnected()) {
      this.logger.warn("No active browser instance available");
      return null;
    }

    try {
      const context = await this.browser.newContext(
        options?.storageStatePath ? { storageState: options.storageStatePath } : {}
      );
      const session = new BrowserSession(context, this.logger);
      this.logger.debug("Browser session created", { sessionId: session.getSessionId() });
      return session;
    } catch (error) {
      this.logger.error("Failed to create browser session", { error: errorMessage(error) });
      throw new BrowserSessionError("Failed to create browser session", error);
    }
  }

  /** Gracefully close the browser and release all resources. */
  async shutdown(): Promise<void> {
    if (this.launchPromise) {
      try {
        await this.launchPromise;
      } catch {
        return; // Launch failed, so there is nothing to shut down.
      }
    }

    const browser = this.browser;
    if (!browser) {
      this.logger.warn("No browser to shut down");
      return;
    }

    const browserId = this.browserId;
    this.browser = null;
    this.browserId = null;

    try {
      await browser.close();
      this.logger.info("Browser shut down successfully", { browserId });
    } catch (error) {
      this.logger.error("Error during browser shutdown", { error: errorMessage(error) });
    }
  }

  /** True while a connected browser instance exists. */
  isActive(): boolean {
    return this.browser?.isConnected() ?? false;
  }

  /** Identifier of the current browser instance (useful for logging). */
  getBrowserId(): string | null {
    return this.browserId;
  }
}
