export { Fremen, createFremen } from "./core/Fremen.js";
export type { FremenConfig } from "./core/Fremen.js";
export { AbstractPlatform } from "./core/Platform.js";
export type {
  PlatformContext,
  PlatformInspectionReport,
  ElementInteractionInfo,
  NavigationResult,
  RouteDetection,
} from "./core/Platform.js";
export { BrowserManager } from "./browser/BrowserManager.js";
export type { BrowserConfig, SessionOptions } from "./browser/BrowserManager.js";
export { BrowserSession } from "./browser/BrowserSession.js";
export { PageInspector, LOADING_SELECTOR } from "./browser/PageInspector.js";
export type {
  PageInspectionResult,
  Heading,
  InteractiveElement,
  AccessibilityInfo,
} from "./browser/PageInspector.js";
export { FremenError, BrowserLaunchError, BrowserSessionError } from "./utils/errors.js";
export { default as FremenLogger } from "./utils/Logger.js";
export type { LogLevel } from "./utils/Logger.js";
export * from "./platforms/mathia/index.js";
