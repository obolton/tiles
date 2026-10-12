# Tiles

This project is an advanced document editor for creating and sharing engaging, dynamic pages for a wide range of purposes, including documents, presentations, notes, landing pages, dashboards, galleries, portfolios, guides and much more, for both personal and business use cases.

Some notable features:

- An intuitive WYSIWYG page editor with view/edit modes and drag-and-drop functionality.
- A variety of dynamic content types, including text, images, videos, maps, tables, charts and links.
- Support for rich text (using a `ProseMirror`-based editor) with a wide range of formatting options, including advanced node types like dropdowns, mentions, code blocks, checklists and dates.
- Realtime collaboration, built on `Y.js` and `Hocuspocus`.
- Section containers that can be used to create a variety of layouts, including freeform sections (useful for creating presentation slides, for example) and horizontal, vertical and grid containers (useful for creating galleries or lists).
- Theming and styling features, with customizable text colors, backgrounds, gradients, fonts and animations.
- Dock zones to attach items to the edges of the viewport.

The user experience is intended to be highly intuitive, usable, accessible and delightful to use, with an emphasis on polish and performance.

## Project Structure

- Monorepo with packages in `packages/*`.
  - `api`: API server using Node with tRPC and Prisma.
  - `doc`: Document schema and utilities.
  - `fonts`: Font registry, manifest and the script that syncs fonts to R2.
  - `web`: Web frontend using Vite, Web Components and a custom JSX runtime.
    - `src/elements`: Web Components
    - `src/components`: JSX components
    - `src/routes`: Routing
    - `src/jsx`: JSX runtime
    - `src/utils`: Utilities
  - `image-upload-worker`: Cloudflare Worker for media uploads.
  - `dev-cdn`: Dev-only Cloudflare Worker that serves uploaded media and fonts from the local R2 buckets.
- Shared config files live in the repo root.

## Dependencies

- Use `pnpm` for dependency management and scripts.
- Always request permission before modifying dependencies.

## Workflow

- After making changes, run the check script (`pnpm check`) to check types, linting, formatting and run unit tests.
- Fix any failures reported and re-run until it passes.
- Formatting failures can be auto-fixed with `pnpm format`.
- Run `pnpm generate` to generate updated types after changing the Prisma schema, CSS Modules, or Worker bindings.
- To run the app and verify changes in a browser, use the `run-app` skill.

## Scripts

**Note**: Always use `pnpm` for running scripts. Do not use `npm` or `npx`.

- `pnpm check`: Run all status checks (typecheck, lint, format, tests).
- `pnpm generate`: Generate TypeScript types (e.g. for CSS Modules, Prisma client, Cloudflare workers).
- `pnpm fonts:sync`: Sync fonts to R2.
- `pnpm typecheck`: Check types.
- `pnpm lint:compact`: Lint TypeScript and CSS files (with concise, LLM-friendly output).
- `pnpm format`: Format files with oxfmt.
- `pnpm format:check`: Check formatting without writing changes.
- `pnpm test:compact`: Run unit tests with Vitest (with concise, LLM-friendly output).
- `pnpm build`: Build all packages in dependency order.
- `pnpm storybook`: Run Storybook for UI component development.

### Testing tiers

- `pnpm test:compact` runs unit tests across all packages (included in `pnpm check`).
- `pnpm --filter web test:browser` runs browser-based tests with Playwright (not included in `pnpm check`).
- `pnpm test:e2e` runs the end-to-end tests with Playwright (not part of `pnpm check`).

### Important notes

- Typecheck, lint and format scripts are fast and can be run across the whole workspace. Avoid scoping scripts to packages unless specifically needed.
- Scripts can be scoped to a package using `pnpm --filter <package>`, e.g. `pnpm --filter api typecheck` to typecheck the `api` package only.

## Coding Style

### General

- Use TypeScript with ES modules and two-space indentation.
- Comments should be terse and used sparingly to explain subtle behavior or constraints, not simply describing what code is doing.
- Use the `@/*` path alias that resolves to each package's `src` directory and avoid relative `../../` imports.
- Avoid type assertions (e.g. the `!` operator and `as type`) in favor of more type-safe options where possible.

### CSS

- Use CSS Modules for component-specific styles, with a `.module.css` file adjacent to the JSX component file.
- Use shared class names and nested rules to reduce duplication in CSS files.

## Testing Guidelines

- Use Vitest for unit tests and Storybook for UI component tests and documentation.
- Colocate test files with code in `__tests__` directories.
- Package test helpers:
  - `src/test/mocks`: Shared mocks
  - `src/test/fixtures`: Fixtures

### Unit tests

- Use `__tests__/*.test.ts` files.
- Use `describe` blocks for each function being tested and to provide structure to test suites.
- Mock external services (database, external APIs etc).
- Run tests with `pnpm test:compact` and check coverage with `pnpm test:coverage`.
- Coverage is configured in the root `vitest.config.ts` only (per-package `coverage` options are ignored in projects mode). It reports every `src` file, including untested ones, and writes `coverage/coverage-summary.json` for tracking.
- `pnpm test:coverage` fails if a package drops below its `coverage.thresholds` floor. Coverage is not part of `pnpm check`, so run it after adding or changing tests, and raise a package's floor when its coverage improves.

### Storybook stories

- Use `__tests__/*.stories.tsx` files.

## Web Components

- Use Shadow DOM to isolate structure and style, with adopted stylesheets imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect element properties to attributes and vice versa.
