
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { MathiaInspector } from "../src/platforms/mathia/MathiaInspector.js";

describe("MathiaInspector", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser?.close();
  });

  it("should inspect a page correctly", async () => {
    await page.setContent(`
      <html>
        <head><title>Fremen Test</title></head>
        <body>
          <h1>Mathia Dashboard</h1>
          <h2>Current Activity</h2>
          <button>Continue</button>
          <a href="/activity">Activity</a>
          <input type="text" placeholder="Search activities" />
        </body>
      </html>
    `);

    const inspector = new MathiaInspector(page);
    const result = await inspector.inspect();

    expect(result.success).toBe(true);
    expect(result.page?.title).toBe("Fremen Test");
    expect(result.page?.headings).toContain("Mathia Dashboard");
    expect(result.page?.buttons).toContain("Continue");
    expect(result.page?.links[0].text).toBe("Activity");
    expect(result.page?.forms[0].label).toBe("Search activities");
  });
});
