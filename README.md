# Fremen

**Modular Educational Platform Automation Framework**

Fremen is a TypeScript-based browser automation framework designed to provide reusable browser infrastructure and platform-specific integrations for educational applications.

The project uses Playwright and Model Context Protocol (MCP) to provide browser inspection, navigation, and controlled interaction through AI coding agents.

## Supported Platforms

| Platform | Integration | Status |
|---|---|---|
| Carnegie Learning Mathia | Fremen Mathia | In Development |
| Edpuzzle | Fremen Edpuzzle | Planned |
| Newsela | Fremen Newsela | Planned |

## Architecture

Fremen is designed around a modular architecture.

```text
fremen/
│
├── .claude/
│   └── skills/
│       └── fremen/
│           └── SKILL.md
│
├── src/
│   ├── core/
│   │   ├── Fremen.ts
│   │   └── Platform.ts
│   │
│   ├── browser/
│   │   ├── BrowserManager.ts
│   │   ├── BrowserSession.ts
│   │   └── PageInspector.ts
│   │
│   ├── platforms/
│   │   └── mathia/
│   │       ├── Mathia.ts
│   │       ├── MathiaInspector.ts
│   │       ├── MathiaNavigator.ts
│   │       ├── MathiaTypes.ts
│   │       └── index.ts
│   │
│   ├── agents/
│   └── utils/
│
├── tests/
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

Actual implementation may evolve as development progresses.

## Technology Stack

- **TypeScript:** Primary development language.
- **Node.js:** Runtime environment.
- **Playwright:** Browser automation.
- **Playwright MCP:** AI-agent browser interaction.
- **Claude Code:** Primary development agent.
- **Vitest:** Automated testing.

## Getting Started

### Requirements

- Node.js 20+
- npm
- Git
- Claude Code

### Installation

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd fremen
```

Install dependencies:

```bash
npm install
```

Install Playwright Chromium:

```bash
npx playwright install chromium
```

### Development

Run tests:

```bash
npx vitest run
```

Run tests in watch mode:

```bash
npx vitest
```

## Fremen Core

Fremen Core provides shared infrastructure for all platform integrations.

Its responsibilities include:

- Browser lifecycle management.
- Browser session management.
- Page inspection.
- Structured logging.
- Error handling.
- Platform registration and coordination.

## Platform Integrations

Each platform receives its own isolated integration.

### Mathia

The first integration targets Carnegie Learning Mathia.

Planned functionality:

- Dashboard inspection.
- Lesson navigation.
- Activity identification.
- Mathematical problem inspection.
- Interface and accessibility analysis.
- Assistance with mathematical reasoning.
- Detection of unexpected application states.

### Edpuzzle

Planned functionality:

- Interface inspection.
- Video and lesson navigation.
- Accessibility support.
- Learning-content assistance.

### Newsela

Planned functionality:

- Article navigation.
- Reading-interface inspection.
- Content organization.
- Reading comprehension assistance.

## Development Principles

1. Modular architecture.
2. Strict TypeScript typing.
3. Reusable browser infrastructure.
4. Accessibility-first element selection.
5. Automated testing.
6. Secure session management.
7. Minimal unnecessary dependencies.
8. Clear documentation.

## Security and Responsible Use

Fremen is intended to assist with navigation, accessibility, repetitive operations, and learning.

The framework must:

- Respect authentication and access controls.
- Protect credentials, cookies, and session data.
- Never expose private user information.
- Avoid manipulating grades or progress records.
- Avoid secretly submitting graded assignments.
- Require user authorization for consequential actions.

## Development Status

**Current stage:** Initial framework development.

The browser infrastructure and Mathia integration are being developed incrementally.

## License

TBD.