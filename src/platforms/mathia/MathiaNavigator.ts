import type { Page } from "playwright";
import type { PlatformContext } from "../../core/Platform.js";
import FremenLogger from "../../utils/Logger.js";
import { errorMessage } from "../../utils/errors.js";
import type { MathiaNavigationResult, NavigationDestination } from "./MathiaTypes.js";

/**
 * Named shortcuts to Mathia routes (name -> path or absolute URL).
 * Intentionally empty: real routes must be verified against the live
 * application before being added here. Destinations can also be discovered
 * from the current page with `getAvailableDestinations()`.
 */
export const MATHIA_ROUTES: Readonly<Record<string, string>> = {};

const DEFAULT_TIMEOUT_MS = 15_000;

export class MathiaNavigator {
  private readonly page: Page;
  private readonly logger = FremenLogger.getInstance();

  constructor(context: PlatformContext, private readonly timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.page = context.page;
  }

  /** Navigate to a named route, a path relative to the current page, or an absolute http(s) URL. */
  async navigate(to: string): Promise<MathiaNavigationResult> {
    let target: URL;
    try {
      target = this.resolveTarget(to);
    } catch (error) {
      return this.failure(errorMessage(error));
    }

    try {
      const response = await this.page.goto(target.href, {
        waitUntil: "domcontentloaded",
        timeout: this.timeoutMs,
      });
      const finalUrl = this.page.url();
      const matchedRoute = routeOf(finalUrl);

      if (response && !response.ok()) {
        return this.failure(`HTTP ${response.status()} for ${target.href}`, finalUrl, matchedRoute);
      }

      const redirected = response?.request().redirectedFrom() != null;
      return {
        success: true,
        targetUrl: finalUrl,
        matchedRoute,
        navigationType: redirected ? "redirected" : "direct",
        verificationStatus: redirected ? "partial" : "success",
      };
    } catch (error) {
      this.logger.warn("Mathia navigation failed", { target: target.href, error: errorMessage(error) });
      return this.failure(errorMessage(error), target.href);
    }
  }

  /** Get the current route (path + query), or the raw URL for non-http pages. */
  async detectCurrentRoute(): Promise<string> {
    return routeOf(this.page.url());
  }

  /** Discover navigation destinations from the links on the current page. */
  async getAvailableDestinations(): Promise<NavigationDestination[]> {
    try {
      const anchors = await this.page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]")).map((element) => ({
          label: element.getAttribute("aria-label")?.trim() || element.textContent?.trim() || "",
          href: (element as HTMLAnchorElement).href,
        }))
      );

      const seen = new Set<string>();
      const destinations: NavigationDestination[] = [];
      for (const { label, href } of anchors) {
        if (!label || seen.has(href)) continue;
        let url: URL;
        try {
          url = new URL(href);
        } catch {
          continue;
        }
        if (url.protocol !== "http:" && url.protocol !== "https:") continue;
        seen.add(href);
        destinations.push({
          label,
          route: `${url.pathname}${url.search}`,
          category: categorize(label, url.pathname),
        });
      }
      return destinations;
    } catch (error) {
      this.logger.warn("Could not read destinations", { error: errorMessage(error) });
      return [];
    }
  }

  private resolveTarget(to: string): URL {
    const mapped = Object.hasOwn(MATHIA_ROUTES, to) ? MATHIA_ROUTES[to]! : to;
    const current = this.page.url();
    const base = /^https?:/i.test(current) ? current : undefined;

    let url: URL;
    try {
      url = new URL(mapped, base);
    } catch {
      throw new Error(`Cannot resolve "${to}": use an absolute URL when no page is loaded`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`Unsupported protocol "${url.protocol}"`);
    }
    return url;
  }

  private failure(error: string, targetUrl?: string, matchedRoute?: string): MathiaNavigationResult {
    return {
      success: false,
      targetUrl,
      matchedRoute,
      error,
      navigationType: "error",
      verificationStatus: "failed",
    };
  }
}

function routeOf(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // fall through
  }
  return rawUrl;
}

function categorize(label: string, path: string): NavigationDestination["category"] {
  const text = `${label} ${path}`.toLowerCase();
  if (/setting|profile|account/.test(text)) return "settings";
  if (/course|lesson|unit|workspace/.test(text)) return "course";
  if (/activit|practice|assessment|quiz|problem/.test(text)) return "activity";
  if (/dashboard|home/.test(text)) return "dashboard";
  return "other";
}
