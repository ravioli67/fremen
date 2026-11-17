
---
name: fremen
description: Develops and maintains Fremen, a modular browser automation framework for educational platforms including Mathia, Edpuzzle, and Newsela. Use when implementing core functionality, browser automation, platform integrations, debugging, or testing.
---

# Fremen Development Skill

## Project Identity

Fremen is a modular browser automation framework.

Its purpose is to provide reusable browser infrastructure
and platform-specific integrations.

## Architecture

- Core: Framework orchestration and platform interfaces.
- Browser: Browser lifecycle, sessions, and inspection.
- Platforms: Individual platform integrations.
- Agents: Agent-specific functionality.
- Utils: Logging, errors, and shared utilities.
- Tests: Automated testing.

## Supported Platforms

1. Carnegie Learning Mathia
2. Edpuzzle
3. Newsela

## Development Principles

- Use TypeScript.
- Prefer modular, reusable implementations.
- Maintain strict type safety.
- Avoid unnecessary dependencies.
- Use Playwright for browser automation.
- Use accessibility-based locators whenever possible.
- Handle asynchronous operations correctly.
- Implement structured error handling.
- Write tests for new functionality.

## Browser Rules

- Inspect pages before interacting.
- Prefer accessible names and semantic locators.
- Never assume selectors are stable without verification.
- Preserve authenticated sessions securely.
- Never expose cookies, tokens, or credentials.

## Platform Integration Rules

Every platform integration should:

- Implement the shared Platform interface.
- Keep platform-specific logic isolated.
- Support page inspection.
- Handle navigation and unexpected page states.
- Document known interface behavior.

## Safety

- Do not bypass authentication or access controls.
- Do not manipulate grades or progress records.
- Do not secretly submit graded work.
- Keep user credentials private.
- Require authorization for consequential actions.

## Git

- Never overwrite the user's existing Git configuration.
- Never force-push.
- Never commit without explicit permission.
- Keep secrets and browser profiles out of version control.

## Development Workflow

1. Inspect the existing implementation.
2. Understand the relevant architecture.
3. Plan changes before implementing them.
4. Implement the smallest appropriate solution.
5. Run relevant tests.
6. Report changed files and test results.
