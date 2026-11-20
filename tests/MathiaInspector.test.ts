import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { MathiaInspector } from "../src/platforms/mathia/MathiaInspector.js";

describe("MathiaInspector", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it("inspects a page correctly", async () => {
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

    const result = await new MathiaInspector(page).inspect();

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.page?.title).toBe("Fremen Test");
    expect(result.page?.headings).toEqual(["Mathia Dashboard", "Current Activity"]);
    expect(result.page?.buttons).toContain("Continue");
    expect(result.page?.links[0]?.text).toBe("Activity");
    expect(result.page?.links[0]?.href).toBe("/activity");
    expect(result.page?.forms[0]?.label).toBe("Search activities");
  });

  it("prefers aria-label for buttons", async () => {
    await page.setContent(`<body><button aria-label="Continue Lesson">Go</button></body>`);
    const result = await new MathiaInspector(page).inspect();
    expect(result.page?.buttons).toEqual(["Continue Lesson"]);
  });

  it("handles empty pages gracefully", async () => {
    await page.setContent("<html><body></body></html>");
    const result = await new MathiaInspector(page).inspect();

    expect(result.success).toBe(true);
    expect(result.page?.headings).toHaveLength(0);
    expect(result.page?.loading).toBe(false);
  });

  it("detects loading indicators", async () => {
    await page.setContent(`<body><div class="loading" data-loading="true">Loading...</div></body>`);
    const result = await new MathiaInspector(page).inspect();

    expect(result.success).toBe(true);
    expect(result.page?.loading).toBe(true);
  });

  it("reports a structured error when the page is closed", async () => {
    const inspector = new MathiaInspector(page);
    await page.close();

    const result = await inspector.inspect();

    expect(result.success).toBe(false);
    expect(result.page).toBeUndefined();
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]?.detail).toBeTruthy();
  });
});
