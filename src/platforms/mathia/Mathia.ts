/**
 * Main Mathia integration that coordinates inspection and navigation.
 */

import { AbstractPlatform } from "../../core/Platform.js";
import type {
  ElementInteractionInfo,
  NavigationResult,
  PlatformContext,
  PlatformInspectionReport,
} from "../../core/Platform.js";
import { MathiaInspector } from "./MathiaInspector.js";
import { MathiaNavigator } from "./MathiaNavigator.js";
import type { MathiaPageInfo, NavigationDestination } from "./MathiaTypes.js";

/**
 * Carnegie Learning Mathia integration.
 * Inspection is read-only; navigation only loads pages and never submits work.
 */
export class Mathia extends AbstractPlatform {
  private readonly inspector: MathiaInspector;
  private readonly navigator: MathiaNavigator;

  constructor(context: PlatformContext) {
    super(context, "mathia");
    this.inspector = new MathiaInspector(context.page);
    this.navigator = new MathiaNavigator(context);
  }

  async inspect(): Promise<PlatformInspectionReport> {
    const result = await this.inspector.inspect();

    if (!result.success || !result.page) {
      this.loggerInstance.warn("Mathia inspection failed", {
        errors: result.errors.map((e) => e.detail),
      });
      return this.createEmptyReport(result.errors.map((e) => e.detail));
    }

    const page = result.page;
    return {
      pageType: "mathia-page",
      url: page.url,
      title: page.title,
      headings: page.headings,
      interactiveElements: this.extractInteractiveElements(page),
      loadingState: page.loading,
      warnings: page.loading ? ["Page appears to still be loading"] : [],
    };
  }

  async navigate(to: string): Promise<NavigationResult> {
    return this.navigator.navigate(to);
  }

  override async detectCurrentRoute(): Promise<string> {
    return this.navigator.detectCurrentRoute();
  }

  /** Get navigation destinations discovered on the current page. */
  getAvailableDestinations(): Promise<NavigationDestination[]> {
    return this.navigator.getAvailableDestinations();
  }

  private extractInteractiveElements(page: MathiaPageInfo): ElementInteractionInfo[] {
    const elements: ElementInteractionInfo[] = [];

    for (const label of page.buttons) {
      elements.push({ type: "button", label });
    }
    for (const link of page.links) {
      if (link.text) elements.push({ type: "link", label: link.text });
    }
    for (const form of page.forms) {
      if (form.label) elements.push({ type: "form", label: form.label });
    }

    return elements;
  }

  private createEmptyReport(details: string[]): PlatformInspectionReport {
    return {
      pageType: "unknown",
      url: this.page.url(),
      title: "",
      headings: [],
      interactiveElements: [],
      loadingState: false,
      warnings: ["Inspection failed", ...details],
    };
  }
}
