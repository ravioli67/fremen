/**
 * Base class for all Fremen platform integrations.
 * Every platform implementation must adhere to this contract.
 */

import type { Page } from "playwright";
import type { BrowserSession } from "../browser/BrowserSession.js";
import FremenLogger from "../utils/Logger.js";

export interface PlatformInspectionReport {
  pageType: string;
  url: string;
  title: string;
  headings: string[];
  interactiveElements: ElementInteractionInfo[];
  loadingState?: boolean;
  warnings?: string[];
}

export interface ElementInteractionInfo {
  type: "button" | "link" | "form";
  label: string;
  accessibilityAttribute?: string;
  state?: "enabled" | "disabled" | "hidden";
}

export interface NavigationResult {
  success: boolean;
  targetUrl?: string;
  matchedRoute?: string;
  error?: string;
}

export type RouteDetection = (page: Page) => Promise<string>;

export interface PlatformContext {
  page: Page;
  browserSession: BrowserSession;
}

export abstract class AbstractPlatform {
  protected readonly page: Page;
  protected readonly loggerInstance = FremenLogger.getInstance();

  constructor(
    protected readonly context: PlatformContext,
    protected readonly name: string
  ) {
    this.page = context.page;
  }

  /** Get the platform identifier. */
  getPlatformName(): string {
    return this.name;
  }

  /** Inspect the current page and return a structured report. */
  abstract inspect(): Promise<PlatformInspectionReport>;

  /** Navigate to a target URL or route. Must not throw for ordinary navigation failures. */
  abstract navigate(to: string): Promise<NavigationResult>;

  /** Detect the current page route or section. */
  async detectCurrentRoute(): Promise<string> {
    return this.page.url();
  }

  /** Get the current URL. */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Release platform-held resources. The default does nothing; the page and
   * session are owned and closed by the framework.
   */
  async close(): Promise<void> {}
}
