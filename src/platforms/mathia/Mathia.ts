
import type { Page } from "playwright";
import { MathiaInspector } from "./MathiaInspector.js";

export class Mathia {
  public readonly inspector: MathiaInspector;

  constructor(private readonly page: Page) {
    this.inspector = new MathiaInspector(page);
  }

  async getPageInfo() {
    return this.inspector.inspect();
  }

  async getCurrentUrl(): Promise<string> {
    return this.page.url();
  }
}
