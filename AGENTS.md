# Tiles

This project is an advanced document editor for creating and sharing engaging, dynamic pages for a wide range of purposes, including documents, presentations, notes, landing pages, dashboards, galleries, portfolios, guides and much more, for both personal and business use cases.

Some notable features:

- An intuitive WYSIWYG page editor with view/edit modes and drag-and-drop functionality.
- A variety of dynamic content types, including text, images, videos, maps, tables, charts and links.
- Support for rich text (using a ProseMirror-based editor) with a wide range of formatting options, including advanced node types like dropdowns, mentions, code blocks, checklists and dates.
- Section containers that can be used to create a variety of layouts, including freeform sections (useful for creating presentation slides, for example) and horizontal, vertical and grid containers (useful for creating galleries or lists).
- Theming and styling features, with customizable text colors, backgrounds, gradients, fonts and animations.
- Dock zones to attach items to the edges of the viewport.

The user experience is intended to be highly intuitive, usable, accessible and delightful to use, with an emphasis on polish and performance.

## Project Structure

- Monorepo with packages in `packages/*`.
  - `packages/api`: API server using Node with tRPC and Prisma.
  - `packages/web`: Web frontend using Vite, Web Components and a custom JSX runtime.
    - `src/elements`: Web Components
    - `src/components`: JSX components
    - `src/routes`: Routing
    - `src/jsx`: JSX runtime
    - `src/utils`: Utilities
  - `packages/image-upload-worker`: Cloudflare Worker for media uploads.
- Shared config files live in the repo root.
- Uses `pnpm` for package management and scripts.

## Scripts

- `pnpm generate`: Generate types for all packages (e.g. CSS Modules, Prisma client, Cloudflare workers).
- `pnpm check`: Check types, linting and formatting for all packages.
- `pnpm typecheck`: Check types only.
- `pnpm lint`: Lint TypeScript and CSS files.
- `pnpm test`: Run Vitest test suites.
- `pnpm build`: Build all packages in dependency order.
- `pnpm format` Format files with Prettier.
- `pnpm storybook`: Run Storybook for UI component development.

### Important notes

- All scripts are fast, so prefer running them across the whole workspace. However, scripts can be run for a specific package using the pnpm `--filter <package>` option, e.g. `pnpm --filter api test` to run tests for the `api` package only.

## Coding Style

- Use TypeScript with ES modules and two-space indentation.
- Use the `@/*` path alias that resolves to each package's `src` directory; avoid relative `../../` imports.
- Prefer pure functions and typed helpers; keep tRPC routers, JSX components, and Workers focused on orchestration and call shared utilities.
- Prefer `instanceof` checks over type assertions for type narrowing.
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
- Run tests with `pnpm test` and check coverage with `pnpm test:coverage`.

### Storybook stories

- Use `__tests__/*.stories.tsx` files.

## Web Components

- Use Shadow DOM to isolate structure and style, with adopted stylesheets imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect element properties to attributes and vice versa.

## UI Patterns

- Use optimistic UI updates where possible.

## Environment & Security Notes

- During development, environment variables are loaded from an untracked `.env` file. Never commit secrets.
