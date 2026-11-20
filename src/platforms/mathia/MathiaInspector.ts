import type { Page } from "playwright";
import { LOADING_SELECTOR } from "../../browser/PageInspector.js";
import { errorMessage } from "../../utils/errors.js";
import type { InspectionError, MathiaInspectionResult, MathiaPageInfo } from "./MathiaTypes.js";

type RawPageInfo = Omit<MathiaPageInfo, "timestamp">;

export class MathiaInspector {
  constructor(private readonly page: Page) {}

  async inspect(): Promise<MathiaInspectionResult> {
    try {
      const raw = await this.page.evaluate(collectMathiaPage, LOADING_SELECTOR);
      return {
        success: true,
        page: { ...raw, timestamp: new Date().toISOString() },
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        errors: [{ type: classifyError(error), detail: errorMessage(error), timestamp: new Date() }],
      };
    }
  }
}

function classifyError(error: unknown): InspectionError["type"] {
  const message = errorMessage(error);
  if (/timeout/i.test(message)) return "timeout";
  if (/net::|network|ERR_/i.test(message)) return "network_error";
  return "parse_error";
}

/** Runs inside the browser; must be self-contained. */
function collectMathiaPage(loadingSelector: string): RawPageInfo {
  const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
    .map((element) => element.textContent?.trim() ?? "")
    .filter(Boolean);

  const buttons = Array.from(document.querySelectorAll("button"))
    .map((element) => element.getAttribute("aria-label") || element.textContent?.trim() || "")
    .filter(Boolean);

  const links = Array.from(document.querySelectorAll("a")).map((element) => ({
    text: element.textContent?.trim() ?? "",
    href: element.getAttribute("href"),
  }));

  const forms = Array.from(document.querySelectorAll("input, textarea, select")).map((element) => ({
    label:
      element.getAttribute("aria-label") ||
      element.getAttribute("placeholder") ||
      element.getAttribute("name") ||
      "",
    type: element.tagName.toLowerCase(),
  }));

  return {
    url: location.href,
    title: document.title,
    headings,
    buttons,
    links,
    forms,
    loading: document.querySelector(loadingSelector) !== null,
  };
}
