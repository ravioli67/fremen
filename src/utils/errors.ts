/**
 * Shared error types and helpers for the Fremen framework.
 */

/** Base class for all Fremen errors. Preserves the underlying cause. */
export class FremenError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = new.target.name;
  }
}

/** Thrown when Chromium fails to launch. */
export class BrowserLaunchError extends FremenError {}

/** Thrown when creating or closing a browser session fails. */
export class BrowserSessionError extends FremenError {}

/** Convert an unknown thrown value into a printable message. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
