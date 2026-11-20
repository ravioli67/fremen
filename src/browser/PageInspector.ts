/**
 * Generic page inspector for the Fremen framework.
 * Provides structured inspection of page titles, URLs, headings, and interactive elements.
 * Prefers accessible information (aria-label, associated labels) over CSS selectors.
 * All DOM access happens inside the browser via page.evaluate.
 */

import type { Page } from "playwright";
import FremenLogger from "../utils/Logger.js";
import { errorMessage } from "../utils/errors.js";

export interface PageInspectionResult {
  success: boolean;
  url: string;
  title: string;
  headings: Heading[];
  interactiveElements: InteractiveElement[];
  loadingState: boolean;
  accessibilityInfo: AccessibilityInfo;
  timestamp: string;
  error?: string;
}

export interface Heading {
  level: number; // h1=1, h2=2, etc.
  text: string;
  ariaLabel?: string;
}

export interface InteractiveElement {
  type: "button" | "link" | "form";
  label: string;
  accessibilityAttribute: string;
  state: "enabled" | "disabled" | "hidden" | "unknown";
  id?: string;
}

export interface AccessibilityInfo {
  hasLiveRegion: boolean;
  focusableElements: number;
  keyboardAccessible: boolean;
  /** Heuristic: the page has a non-empty title and a declared language. */
  screenReaderFriendly: boolean;
}

/** CSS selector matching common loading indicators. Shared with platform inspectors. */
export const LOADING_SELECTOR = [
  '[aria-busy="true"]',
  '[data-loading="true"]',
  '[role="progressbar"]',
  ".loading",
  ".spinner",
  ".loader",
].join(", ");

const EMPTY_ACCESSIBILITY: AccessibilityInfo = {
  hasLiveRegion: false,
  focusableElements: 0,
  keyboardAccessible: false,
  screenReaderFriendly: false,
};

type RawInspection = Omit<PageInspectionResult, "success" | "timestamp" | "error">;

/**
 * PageInspector provides generic page inspection capabilities.
 * Can be used by platform-specific inspectors as a base.
 */
export class PageInspector {
  private readonly logger = FremenLogger.getInstance();

  constructor(private readonly page: Page) {}

  /** Inspect the current page. Never throws; failures are reported via `success`/`error`. */
  async inspect(): Promise<PageInspectionResult> {
    try {
      const raw = await this.page.evaluate(collectPageInfo, LOADING_SELECTOR);
      this.logger.info("Page inspection completed", { url: raw.url });
      return { success: true, ...raw, timestamp: new Date().toISOString() };
    } catch (error) {
      this.logger.error("Page inspection failed", { error: errorMessage(error) });
      return {
        success: false,
        url: this.page.url(),
        title: "",
        headings: [],
        interactiveElements: [],
        loadingState: false,
        accessibilityInfo: { ...EMPTY_ACCESSIBILITY },
        timestamp: new Date().toISOString(),
        error: errorMessage(error),
      };
    }
  }
}

/**
 * Runs inside the browser. Must be fully self-contained: it cannot reference
 * anything from the surrounding module scope.
 */
function collectPageInfo(loadingSelector: string): RawInspection {
  const accessibleLabel = (element: Element): string => {
    const aria = element.getAttribute("aria-label")?.trim();
    if (aria) return aria;

    const labelledBy = element.getAttribute("aria-labelledby");
    if (labelledBy) {
      const text = labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }

    const labels = (element as HTMLInputElement).labels;
    if (labels && labels.length > 0) {
      const text = Array.from(labels)
        .map((label) => label.textContent?.trim() ?? "")
        .filter(Boolean)
        .join(" ");
      if (text) return text;
    }

    const placeholder = element.getAttribute("placeholder")?.trim();
    if (placeholder) return placeholder;

    const text = element.textContent?.trim();
    if (text) return text;

    return element.getAttribute("title")?.trim() ?? element.getAttribute("name")?.trim() ?? "";
  };

  const elementState = (element: Element): InteractiveElement["state"] => {
    if ((element as HTMLButtonElement).disabled === true) return "disabled";
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return "hidden";
    return "enabled";
  };

  const headings: Heading[] = [];
  document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((element) => {
    const text = element.textContent?.trim() ?? "";
    if (!text) return;
    const ariaLabel = element.getAttribute("aria-label")?.trim() || undefined;
    headings.push({ level: Number(element.tagName.charAt(1)), text, ariaLabel });
  });

  const interactiveElements: InteractiveElement[] = [];
  const collect = (selector: string, type: InteractiveElement["type"]): void => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.tagName === "INPUT" && (element as HTMLInputElement).type === "hidden") return;
      const label = accessibleLabel(element);
      if (!label) return;
      interactiveElements.push({
        type,
        label,
        accessibilityAttribute: element.getAttribute("aria-label") ? "aria-label" : "text",
        state: elementState(element),
        id: element.id || undefined,
      });
    });
  };
  collect("button", "button");
  collect("a[href]", "link");
  collect("input, textarea, select", "form");

  const focusable = document.querySelectorAll(
    [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled]):not([type='hidden'])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])",
    ].join(", ")
  ).length;

  return {
    url: location.href,
    title: document.title,
    headings,
    interactiveElements,
    loadingState: document.querySelector(loadingSelector) !== null,
    accessibilityInfo: {
      hasLiveRegion: document.querySelector("[aria-live]") !== null,
      focusableElements: focusable,
      keyboardAccessible: focusable > 0,
      screenReaderFriendly:
        document.title.trim().length > 0 && document.documentElement.lang.trim().length > 0,
    },
  };
}
