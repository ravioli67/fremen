/**
 * Represents a single isolated browser context (cookies, storage, pages).
 */

import { randomUUID } from "node:crypto";
import type { BrowserContext, Page } from "playwright";
import FremenLogger from "../utils/Logger.js";
import { BrowserSessionError, errorMessage } from "../utils/errors.js";

export class BrowserSession {
  private readonly sessionId = randomUUID();
  private closed = false;

  constructor(
    private readonly context: BrowserContext,
    private readonly logger: FremenLogger = FremenLogger.getInstance()
  ) {}

  /** Get the underlying Playwright context. Throws if the session is closed. */
  getContext(): BrowserContext {
    if (this.closed) {
      throw new BrowserSessionError("Browser session is already closed");
    }
    return this.context;
  }

  /** Unique identifier for this session (useful for logging). */
  getSessionId(): string {
    return this.sessionId;
  }

  /** Open a new page inside this session. */
  async newPage(): Promise<Page> {
    return this.getContext().newPage();
  }

  /** Close the session and release its pages. Safe to call more than once. */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }
    this.closed = true;
    try {
      await this.context.close();
      this.logger.debug("Browser session closed", { sessionId: this.sessionId });
    } catch (error) {
      this.logger.error("Error closing browser session", {
        sessionId: this.sessionId,
        error: errorMessage(error),
      });
      throw new BrowserSessionError("Failed to close browser session", error);
    }
  }

  isActive(): boolean {
    return !this.closed;
  }
}
