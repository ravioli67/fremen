import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { Mathia } from "../src/platforms/mathia/Mathia.js";
import { MathiaNavigator } from "../src/platforms/mathia/MathiaNavigator.js";
import { BrowserSession } from "../src/browser/BrowserSession.js";
import { startServer, type TestServer } from "./helpers/server.js";

const dashboard = `
  <html><head><title>Mathia Dashboard</title></head>
  <body>
    <h1>Welcome</h1>
    <h2>Today's Activities</h2>
    <button aria-label="Continue Lesson">Continue Lesson</button>
    <a href="/activity">Activities</a>
    <a href="/settings">Profile</a>
    <a href="/activity">Activities again</a>
    <a href="mailto:help@example.com">Help</a>
    <input type="text" aria-label="Search activities" />
  </body></html>`;

describe("Mathia integration", () => {
  let browser: Browser;
  let server: TestServer;
  let context: BrowserContext;
  let page: Page;
  let session: BrowserSession;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    server = await startServer({
      "/": dashboard,
      "/activity": "<html><head><title>Activity</title></head><body><h1>Activity</h1></body></html>",
      "/old": { redirectTo: "/activity" },
    });
  });

  afterAll(async () => {
    await server.close();
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
    session = new BrowserSession(context);
  });

  afterEach(async () => {
    await session.close();
  });

  describe("MathiaNavigator", () => {
    it("navigates to an absolute URL", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      const result = await navigator.navigate(`${server.url}/activity`);

      expect(result.success).toBe(true);
      expect(result.navigationType).toBe("direct");
      expect(result.verificationStatus).toBe("success");
      expect(result.matchedRoute).toBe("/activity");
    });

    it("resolves relative paths against the current page", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      await navigator.navigate(server.url);
      const result = await navigator.navigate("/activity");

      expect(result.success).toBe(true);
      expect(await navigator.detectCurrentRoute()).toBe("/activity");
    });

    it("reports redirects as partial verification", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      const result = await navigator.navigate(`${server.url}/old`);

      expect(result.success).toBe(true);
      expect(result.navigationType).toBe("redirected");
      expect(result.verificationStatus).toBe("partial");
      expect(result.matchedRoute).toBe("/activity");
    });

    it("returns a failure for HTTP errors instead of throwing", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      const result = await navigator.navigate(`${server.url}/missing`);

      expect(result.success).toBe(false);
      expect(result.navigationType).toBe("error");
      expect(result.verificationStatus).toBe("failed");
      expect(result.error).toContain("404");
    });

    it("returns a failure for relative paths when no page is loaded", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      const result = await navigator.navigate("/about");

      expect(result.success).toBe(false);
      expect(result.error).toContain("absolute URL");
    });

    it("refuses non-http protocols", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      const result = await navigator.navigate("file:///etc/passwd");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unsupported protocol");
    });

    it("returns a failure when the server is unreachable", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session }, 2_000);
      const result = await navigator.navigate("http://127.0.0.1:1/");

      expect(result.success).toBe(false);
      expect(result.navigationType).toBe("error");
    });

    it("detects the current route", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      await page.goto(`${server.url}/activity?x=1`);
      expect(await navigator.detectCurrentRoute()).toBe("/activity?x=1");
    });

    it("discovers unique http(s) destinations from page links", async () => {
      const navigator = new MathiaNavigator({ page, browserSession: session });
      await page.goto(server.url);

      const destinations = await navigator.getAvailableDestinations();

      expect(destinations.map((d) => d.route)).toEqual(["/activity", "/settings"]);
      expect(destinations.map((d) => d.category)).toEqual(["activity", "settings"]);
    });
  });

  describe("Mathia platform", () => {
    it("identifies itself and inspects the page through the shared interface", async () => {
      const mathia = new Mathia({ page, browserSession: session });
      await page.goto(server.url);

      const report = await mathia.inspect();

      expect(mathia.getPlatformName()).toBe("mathia");
      expect(report.title).toBe("Mathia Dashboard");
      expect(report.headings).toEqual(["Welcome", "Today's Activities"]);
      expect(report.loadingState).toBe(false);
      expect(report.interactiveElements).toContainEqual({ type: "button", label: "Continue Lesson" });
      expect(report.interactiveElements).toContainEqual({ type: "form", label: "Search activities" });
    });

    it("returns an empty report with warnings when inspection fails", async () => {
      const mathia = new Mathia({ page, browserSession: session });
      await page.close();

      const report = await mathia.inspect();

      expect(report.pageType).toBe("unknown");
      expect(report.warnings?.[0]).toBe("Inspection failed");
    });

    it("delegates navigation and route detection", async () => {
      const mathia = new Mathia({ page, browserSession: session });

      const result = await mathia.navigate(`${server.url}/activity`);

      expect(result.success).toBe(true);
      expect(await mathia.detectCurrentRoute()).toBe("/activity");
      expect(mathia.getCurrentUrl()).toBe(`${server.url}/activity`);
    });
  });
});
