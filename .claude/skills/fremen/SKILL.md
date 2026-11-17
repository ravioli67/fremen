# Fremen — Initial Core Implementation

We are building Fremen, a modular educational-platform browser automation framework.

## Objective

Implement the initial Fremen Core and reusable browser infrastructure.

## Requirements

1. Create a `BrowserManager` class responsible for browser lifecycle management.
2. Create a `BrowserSession` abstraction for managing an active browser session.
3. Create a `PageInspector` class that can:
   - Retrieve the current page URL.
   - Retrieve the page title.
   - Capture a screenshot.
   - Retrieve the accessibility snapshot using supported Playwright APIs.
   - Extract visible headings, links, and buttons.
4. Create a `Platform` interface for future integrations.
5. Create a `Fremen` entry point that coordinates the browser and platform modules.
6. Implement structured logging.
7. Add Vitest tests for the core components.
8. Use TypeScript with strict type checking.
9. Handle browser launch failures and disconnected sessions gracefully.
10. Document the architecture in README.md.

## Architecture

- `src/core/`
- `src/browser/`
- `src/platforms/`
- `src/utils/`
- `tests/`

## Constraints

- Do not implement Mathia-specific functionality yet.
- Do not implement credential collection or automated login.
- Do not hardcode browser credentials.
- Do not introduce unnecessary dependencies.
- Do not modify existing Git remotes or repository history.
- Do not commit changes automatically.

## Deliverables

A functional, tested Fremen Core that can launch a browser, inspect a page, and close the browser cleanly.