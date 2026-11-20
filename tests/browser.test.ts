import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { chromium } from "playwright";
import { BrowserManager } from "../src/browser/BrowserManager.js";
import { BrowserLaunchError } from "../src/utils/errors.js";

describe("BrowserManager", () => {
  let manager: BrowserManager;

  beforeEach(() => {
    manager = new BrowserManager();
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await manager.shutdown();
  });

  it("is inactive before launch", () => {
    expect(manager.isActive()).toBe(false);
    expect(manager.getBrowserId()).toBeNull();
  });

  it("returns no session before launch", async () => {
    expect(await manager.getSession()).toBeNull();
  });

  it("launches a browser successfully", async () => {
    expect(await manager.launchBrowser({ headless: true })).toBe(true);
    expect(manager.isActive()).toBe(true);
    expect(manager.getBrowserId()).not.toBeNull();
  });

  it("handles repeated and concurrent launches with one browser", async () => {
    const spy = vi.spyOn(chromium, "launch");

    const results = await Promise.all([
      manager.launchBrowser({ headless: true }),
      manager.launchBrowser({ headless: true }),
    ]);
    expect(results).toEqual([true, true]);
    expect(await manager.launchBrowser({ headless: true })).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("creates and closes a session", async () => {
    await manager.launchBrowser({ headless: true });
    const session = await manager.getSession();

    expect(session).not.toBeNull();
    expect(session!.getSessionId()).toBeTruthy();
    expect(session!.isActive()).toBe(true);

    await session!.close();
    expect(session!.isActive()).toBe(false);
    expect(() => session!.getContext()).toThrow("already closed");
    await expect(session!.close()).resolves.toBeUndefined();
  });

  it("shuts down and becomes inactive", async () => {
    await manager.launchBrowser({ headless: true });
    await manager.shutdown();
    expect(manager.isActive()).toBe(false);
    expect(await manager.getSession()).toBeNull();
  });

  it("wraps launch failures in BrowserLaunchError and keeps the cause", async () => {
    const cause = new Error("boom");
    vi.spyOn(chromium, "launch").mockRejectedValueOnce(cause);

    const error = await manager.launchBrowser().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(BrowserLaunchError);
    expect((error as BrowserLaunchError).cause).toBe(cause);
    expect(manager.isActive()).toBe(false);
  });
});
