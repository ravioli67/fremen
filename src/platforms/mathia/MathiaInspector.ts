
import type { Page } from "playwright";
import type {
  MathiaPageInfo,
  MathiaInspectionResult
} from "./MathiaTypes.js";

export class MathiaInspector {
  constructor(private readonly page: Page) {}

  async inspect(): Promise<MathiaInspectionResult> {
    try {
      const pageInfo = await this.page.evaluate(() => {
        const headings = Array.from(
          document.querySelectorAll("h1, h2, h3, h4")
        ).map(element => element.textContent?.trim() ?? "")
          .filter(Boolean);

        const buttons = Array.from(
          document.querySelectorAll("button")
        ).map(element =>
          element.getAttribute("aria-label") ||
          element.textContent?.trim() ||
          ""
        ).filter(Boolean);

        const links = Array.from(
          document.querySelectorAll("a")
        ).map(element => ({
          text: element.textContent?.trim() ?? "",
          href: element.getAttribute("href")
        }));

        const forms = Array.from(
          document.querySelectorAll("input, textarea, select")
        ).map(element => ({
          label:
            element.getAttribute("aria-label") ||
            element.getAttribute("placeholder") ||
            element.getAttribute("name") ||
            "",
          type: element.tagName.toLowerCase()
        }));

        return {
          url: location.href,
          title: document.title,
          headings,
          buttons,
          links,
          forms,
          timestamp: new Date().toISOString()
        };
      });

      return {
        success: true,
        page: pageInfo as MathiaPageInfo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error
          ? error.message
          : "Unknown inspection error"
      };
    }
  }
}
