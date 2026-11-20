/**
 * Main Fremen framework entry point.
 * Provides initialization, session management, platform registration, and coordination.
 */

import { BrowserManager } from "../browser/BrowserManager.js";
import type { SessionOptions } from "../browser/BrowserManager.js";
import type { BrowserSession } from "../browser/BrowserSession.js";
import FremenLogger from "../utils/Logger.js";
import { FremenError, errorMessage } from "../utils/errors.js";
import type { AbstractPlatform } from "./Platform.js";

export interface FremenConfig {
  /** Whether to run in headless mode. */
  headless?: boolean;
}

export class Fremen {
  private browserManager: BrowserManager | null = null;
  private readonly sessions = new Map<string, BrowserSession>();
  private readonly platforms = new Map<string, AbstractPlatform>();
  private readonly logger = FremenLogger.getInstance();

  constructor(private readonly config: FremenConfig = {}) {}

  /** Initialize and launch the browser. */
  async initialize(): Promise<void> {
    if (this.browserManager) {
      this.logger.warn("Fremen already initialized");
      return;
    }

    const manager = new BrowserManager();
    await manager.launchBrowser(this.config);
    this.browserManager = manager;
    this.logger.info("Fremen framework initialized", { config: this.config });
  }

  /** Get a named browser session, or null if it does not exist. */
  getSession(name: string): BrowserSession | null {
    return this.sessions.get(name) ?? null;
  }

  /** Create a new named browser session. Session names must be unique. */
  async createSession(name: string, options?: SessionOptions): Promise<BrowserSession> {
    if (!this.browserManager) {
      throw new FremenError("Cannot create session: Fremen is not initialized");
    }
    if (this.sessions.has(name)) {
      throw new FremenError(`Session "${name}" already exists`);
    }

    const session = await this.browserManager.getSession(options);
    if (!session) {
      throw new FremenError("Cannot create session: no browser available");
    }

    // Re-check: another createSession call may have claimed the name while we awaited.
    if (this.sessions.has(name)) {
      await session.close();
      throw new FremenError(`Session "${name}" already exists`);
    }

    this.sessions.set(name, session);
    return session;
  }

  /** Register a platform integration. Platform names must be unique. */
  registerPlatform(platform: AbstractPlatform): void {
    const name = platform.getPlatformName();
    if (this.platforms.has(name)) {
      throw new FremenError(`Platform "${name}" is already registered`);
    }

    this.platforms.set(name, platform);
    this.logger.info("Platform registered", { platform: name });
  }

  /** Get a registered platform by name. */
  getPlatform(name: string): AbstractPlatform | undefined {
    return this.platforms.get(name);
  }

  /** List all registered platforms. */
  getRegisteredPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }

  /** Gracefully shut down platforms, sessions, and the browser. */
  async shutdown(): Promise<void> {
    if (!this.browserManager) {
      this.logger.warn("Fremen not initialized");
      return;
    }

    for (const [name, platform] of this.platforms) {
      try {
        await platform.close();
      } catch (error) {
        this.logger.warn("Error closing platform", { platform: name, error: errorMessage(error) });
      }
    }

    for (const [name, session] of this.sessions) {
      try {
        await session.close();
      } catch (error) {
        this.logger.warn("Error closing session", { session: name, error: errorMessage(error) });
      }
    }

    const manager = this.browserManager;
    this.browserManager = null;
    this.platforms.clear();
    this.sessions.clear();
    await manager.shutdown();
  }

  /** Check if the framework is initialized. */
  isActive(): boolean {
    return this.browserManager !== null;
  }
}

/** Factory function for creating Fremen instances with defaults. */
export function createFremen(config?: Partial<FremenConfig>): Fremen {
  return new Fremen({ headless: true, ...config });
}
