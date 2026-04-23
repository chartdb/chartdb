# Contributing to ChartDB

Thank you for your interest in contributing to ChartDB! 💙 We welcome contributions of all kinds — bug fixes, new features, documentation improvements, translations, and more.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Adding Translations](#adding-translations)
- [Code Style](#code-style)
- [Questions?](#questions)
- [License](#license)

## Getting Started

1. **Fork** the repository by clicking the [Fork](https://github.com/chartdb/chartdb/fork) button.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/chartdb.git
   cd chartdb
   ```
3. **Add the upstream remote** so you can keep your fork up to date:
   ```bash
   git remote add upstream https://github.com/chartdb/chartdb.git
   ```
4. If you're new to GitHub pull requests, check out [this video series](https://egghead.io/courses/how-to-contribute-to-an-open-source-project-on-github).

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Useful Commands

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start the development server         |
| `npm run build`      | Lint, type-check, and build for production |
| `npm run lint`       | Run ESLint                           |
| `npm run lint:fix`   | Run ESLint with auto-fix             |
| `npm run test`       | Run tests with Vitest                |
| `npm run test:ui`    | Run tests with the Vitest UI         |
| `npm run test:coverage` | Run tests with coverage report    |

## Making Changes

1. **Sync your fork** with the latest upstream changes:
   ```bash
   git checkout main
   git pull upstream main
   ```
2. **Create a new branch** from `main` for your changes:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```
3. Make your changes, keeping each branch focused on a **single change**.
4. **Run linting and tests** before committing:
   ```bash
   npm run lint
   npm run test
   ```

## Commit Guidelines

Write clear, concise commit messages. We recommend the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add dark mode toggle
fix: resolve table rendering issue on Safari
docs: update CONTRIBUTING.md with setup instructions
```

Common prefixes:
- `feat:` — a new feature
- `fix:` — a bug fix
- `docs:` — documentation changes
- `refactor:` — code restructuring without behavior change
- `test:` — adding or updating tests
- `chore:` — maintenance tasks (dependencies, CI, etc.)

## Submitting a Pull Request

1. **Push** your branch to your fork:
   ```bash
   git push origin feat/my-feature
   ```
2. Open a **Pull Request** on the [chartdb repository](https://github.com/chartdb/chartdb/pulls).
3. In your PR description:
   - Clearly state which issue it addresses (e.g., `Closes #123`).
   - Provide a brief explanation of your approach.
   - Include screenshots if the change is visual.
4. Wait for a maintainer to review your PR. Be responsive to feedback!

## Reporting Bugs

Before reporting, check the [existing issues](https://github.com/chartdb/chartdb/issues) to avoid duplicates.

If the bug hasn't been reported, [create a new issue](https://github.com/chartdb/chartdb/issues/new?labels=bug) with:

- A clear, descriptive title.
- Steps to reproduce the bug.
- Expected behavior vs. actual behavior.
- Browser / OS information if relevant.
- Screenshots or screen recordings if applicable.

## Feature Requests

Have an idea? [Open a feature request](https://github.com/chartdb/chartdb/issues/new?labels=enhancement) and describe:

- The problem you're trying to solve.
- Your proposed solution.
- Any alternatives you've considered.

## Adding Translations

ChartDB supports multiple languages! To add a new translation:

1. Copy the English locale file as a starting point:
   ```bash
   cp src/i18n/locales/en.ts src/i18n/locales/<your-locale>.ts
   ```
2. Translate all the strings in the new file.
3. Register the locale in the i18n configuration.
4. Submit a PR referencing issue [#130](https://github.com/chartdb/chartdb/issues/130).

See the [English translation file](https://github.com/chartdb/chartdb/blob/main/src/i18n/locales/en.ts) for reference.

## Code Style

- Follow the existing code patterns in the repository.
- ESLint is configured — run `npm run lint` to check for issues.
- Use TypeScript types properly; avoid `any` when possible.
- Write tests for new features when applicable.

## Questions?

Feel free to ask in `#contributing` on [Discord](https://discord.gg/QeFwyWSKwC) if you have questions about the process, how to proceed, or anything else.

You can also reach us via [Email](mailto:support@chartdb.io).

## License

By contributing, you agree that your work will be licensed under ChartDB's [license](https://github.com/chartdb/chartdb/blob/main/LICENSE).

---

Thank you for helping make ChartDB better! 💙
