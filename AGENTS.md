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
  - `jsx`: JSX runtime.
  - `reactivity`: Reactivity library.
  - `web`: Web frontend using Vite, Web Components and a custom JSX runtime.
    - `src/elements`: Web Components
    - `src/components`: JSX components
    - `src/routes`: Routing
    - `src/utils`: Utilities
  - `image-upload-worker`: Cloudflare Worker for media uploads.
  - `dev-cdn`: Dev-only Cloudflare Worker that serves uploaded media and fonts from the local R2 buckets.
- Shared config files live in the repo root.

## Dependencies

- Use `pnpm` for dependency management and scripts.
- Always request permission before modifying dependencies.

## Workflow

- After making changes, run the check script (`pnpm check`) to check types, linting, formatting and run the tests.
- Fix any failures reported and re-run until the checks pass.
- Formatting failures can be auto-fixed with `pnpm format`.
- Run `pnpm generate` to generate types after changing the Prisma schema, CSS Modules, or Worker bindings.
- To run the app and verify changes in a browser, use the `run-app` skill.

## Scripts

**Note**: Always use `pnpm` for running scripts. Do not use `npm` or `npx`.

- `pnpm check`: Run all status checks (typecheck, lint, format, tests).
- `pnpm generate`: Generate TypeScript types (e.g. for CSS Modules, Prisma client, Cloudflare workers).
- `pnpm fonts:sync`: Sync fonts to R2.
- `pnpm typecheck`: Check types.
- `pnpm lint:compact`: Lint TypeScript and CSS files (compact output).
- `pnpm format`: Format files with oxfmt.
- `pnpm format:check`: Check formatting without writing changes.
- `pnpm test`: Run unit tests with Vitest.
- `pnpm build`: Build all packages.
- `pnpm storybook`: Run Storybook for UI component development.

### Testing tiers

- `pnpm test` runs unit tests across all packages (included in `pnpm check`).
- `pnpm --filter web test:browser` runs browser-mode tests (`*.browser.test.{ts,tsx}`) in headless Chromium with Playwright. It is not included in `pnpm check`, so run it when changing browser tests. CI runs it in a separate `Browser tests` job.
- `pnpm --filter web test:storybook` runs every Storybook story (`*.stories.tsx`) as a browser-mode test with the Storybook Vitest addon: each story is rendered and checked for accessibility violations. It is not included in `pnpm check`, so run it when changing stories or components with stories. CI runs it in the `Browser tests` job.
- `pnpm test:e2e` runs the end-to-end tests with Playwright (not part of `pnpm check`).

### Important notes

- Check scripts (typecheck, lint, test and format) are fast, and can be run across the whole monorepo. Avoid scoping scripts to packages unless specifically needed.
- Scripts can be scoped using `pnpm --filter <package>`, e.g. `pnpm --filter api typecheck` to typecheck the `api` package only.

## Coding Style

### General

- Use TypeScript with ES modules and two-space indentation.
- Comments should be terse and used sparingly, only if needed to explain subtle behavior or constraints, not simply to describe what code is doing or how it has been changed.
- Use the `@/*` path alias that resolves to each package's `src` directory and avoid relative `../../` imports.
- Avoid type assertions (e.g. the `!` operator and `as type`) in favor of more type-safe options where possible.

### CSS

- Use CSS Modules for component-specific styles, with a `.module.css` file adjacent to the JSX component file.
- Use modern CSS features, shared class names and nested rules to reduce repetition in CSS files.

## Testing Guidelines

- Use Vitest for unit tests and Storybook for UI component tests and documentation.
- Colocate test files with code in `__tests__` directories.
- Package test helpers:
  - `src/test/mocks`: Shared mocks
  - `src/test/fixtures`: Fixtures

### Unit tests

- Use `__tests__/*.test.ts` files.
- Use `describe` blocks for each function being tested and to provide structure to test suites.
- Name tests as present-tense sentences describing the behavior, e.g. `test("rejects an unauthenticated caller")`. Titles starting with "should" fail lint.
- Mock external services (database, external APIs etc).
- Run tests with `pnpm test` and check coverage with `pnpm test:coverage`.

### Storybook stories

- Use `__tests__/*.stories.tsx` files.

## Web Components

- Use Shadow DOM to isolate structure and style, with adopted stylesheets imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect element properties to attributes and vice versa.
