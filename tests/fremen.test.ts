import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Fremen, createFremen } from "../src/core/Fremen.js";
import { AbstractPlatform } from "../src/core/Platform.js";
import type { NavigationResult, PlatformInspectionReport } from "../src/core/Platform.js";

class TestPlatform extends AbstractPlatform {
  closed = false;

  async inspect(): Promise<PlatformInspectionReport> {
    return {
      pageType: "test",
      url: this.page.url(),
      title: "",
      headings: [],
      interactiveElements: [],
    };
  }

  async navigate(to: string): Promise<NavigationResult> {
    return { success: true, targetUrl: to };
  }

  override async close(): Promise<void> {
    this.closed = true;
  }
}

describe("Fremen Framework", () => {
  let framework: Fremen;

  beforeEach(() => {
    framework = createFremen({ headless: true });
  });

  afterEach(async () => {
    await framework.shutdown();
  });

  it("starts inactive and becomes active after initialize", async () => {
    expect(framework.isActive()).toBe(false);
    await framework.initialize();
    expect(framework.isActive()).toBe(true);
  });

  it("ignores repeated initialization", async () => {
    await framework.initialize();
    await expect(framework.initialize()).resolves.toBeUndefined();
    expect(framework.isActive()).toBe(true);
  });

  it("rejects session creation before initialization", async () => {
    await expect(framework.createSession("early")).rejects.toThrow("not initialized");
  });

  it("creates and retrieves named sessions", async () => {
    await framework.initialize();

    const first = await framework.createSession("main-session");
    const second = await framework.createSession("secondary-session");

    expect(first.getSessionId()).not.toBe(second.getSessionId());
    expect(framework.getSession("main-session")).toBe(first);
    expect(framework.getSession("missing")).toBeNull();
  });

  it("rejects duplicate session names without leaking the old session", async () => {
    await framework.initialize();
    const first = await framework.createSession("main");

    await expect(framework.createSession("main")).rejects.toThrow("already exists");
    expect(first.isActive()).toBe(true);
    expect(framework.getSession("main")).toBe(first);
  });

  it("registers and retrieves platforms", async () => {
    await framework.initialize();
    const session = await framework.createSession("main");
    const page = await session.newPage();
    const platform = new TestPlatform({ page, browserSession: session }, "test");

    framework.registerPlatform(platform);

    expect(framework.getRegisteredPlatforms()).toEqual(["test"]);
    expect(framework.getPlatform("test")).toBe(platform);
    expect(() => framework.registerPlatform(platform)).toThrow("already registered");
  });

  it("shuts down platforms, sessions and the browser", async () => {
    await framework.initialize();
    const session = await framework.createSession("main");
    const page = await session.newPage();
    const platform = new TestPlatform({ page, browserSession: session }, "test");
    framework.registerPlatform(platform);

    await framework.shutdown();

    expect(platform.closed).toBe(true);
    expect(session.isActive()).toBe(false);
    expect(framework.isActive()).toBe(false);
    expect(framework.getRegisteredPlatforms()).toEqual([]);
    expect(framework.getSession("main")).toBeNull();
  });
});
