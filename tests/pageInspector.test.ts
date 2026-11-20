import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { chromium, type Browser, type Page } from "playwright";
import { PageInspector } from "../src/browser/PageInspector.js";

describe("PageInspector", () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  // A fresh page per test keeps tests independent of each other.
  beforeEach(async () => {
    page = await browser.newPage();
  });

  afterEach(async () => {
    await page.close();
  });

  it("inspects a simple HTML page", async () => {
    await page.setContent(`
      <html lang="en">
        <head><title>Fremen Test</title></head>
        <body>
          <h1>Mathia Dashboard</h1>
          <h2>Current Activity</h2>
          <button aria-label="Continue">Go</button>
          <a href="/activity">Activity</a>
          <label for="q">Search</label><input id="q" type="text" />
          <input type="hidden" name="csrf" value="x" />
        </body>
      </html>
    `);

    const result = await new PageInspector(page).inspect();

    expect(result.success).toBe(true);
    expect(result.title).toBe("Fremen Test");
    expect(result.headings.map((h) => h.text)).toEqual(["Mathia Dashboard", "Current Activity"]);
    expect(result.headings.map((h) => h.level)).toEqual([1, 2]);

    const labels = result.interactiveElements.map((e) => `${e.type}:${e.label}`);
    expect(labels).toEqual(["button:Continue", "link:Activity", "form:Search"]);
    expect(result.accessibilityInfo.focusableElements).toBe(3);
    expect(result.accessibilityInfo.keyboardAccessible).toBe(true);
    expect(result.accessibilityInfo.screenReaderFriendly).toBe(true);
  });

  it("reports disabled buttons", async () => {
    await page.setContent(`<body><button disabled>Save</button></body>`);
    const result = await new PageInspector(page).inspect();
    expect(result.interactiveElements[0]?.state).toBe("disabled");
  });

  it("handles empty pages gracefully", async () => {
    await page.setContent("<html><body></body></html>");
    const result = await new PageInspector(page).inspect();

    expect(result.success).toBe(true);
    expect(result.headings).toHaveLength(0);
    expect(result.interactiveElements).toHaveLength(0);
    expect(result.loadingState).toBe(false);
  });

  it("detects loading states", async () => {
    await page.setContent(`<body><div aria-busy="true">Loading...</div></body>`);
    const result = await new PageInspector(page).inspect();
    expect(result.loadingState).toBe(true);
  });

  it("detects live regions", async () => {
    await page.setContent(`<body><div aria-live="polite"></div></body>`);
    const result = await new PageInspector(page).inspect();
    expect(result.accessibilityInfo.hasLiveRegion).toBe(true);
  });

  it("returns a failed result instead of throwing when inspection fails", async () => {
    const inspector = new PageInspector(page);
    await page.close();

    const result = await inspector.inspect();

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
    expect(result.headings).toEqual([]);
    expect(result.accessibilityInfo.focusableElements).toBe(0);
  });
});
