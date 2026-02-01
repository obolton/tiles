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
  - `packages/image-upload-worker`: Cloudflare Worker handling media uploads.
- Shared config files live in the repo root.

## Scripts

- `pnpm check`: Check types, linting and formatting for all packages.
- `pnpm typecheck`: Check types only.
- `pnpm lint`: Lint TypeScript and CSS files.
- `pnpm test`: Run Vitest test suites.
- `pnpm build`: Build all packages in dependency order.
- `pnpm format` and `pnpm format:check`: Format files with Prettier or check formatting.
- `pnpm storybook`: Run Storybook for UI component development.
- `pnpm generate`: Generate types for all packages (e.g. Prisma client, Cloudflare workers).

### Important notes

- Scripts can be run for a specific package using the `--filter <package>` option, e.g. `pnpm --filter api test` to run the tests for the `api` package.

## Coding Style

- Use TypeScript with ES modules and two-space indentation.
- Use the `@/*` path alias that resolves to each package's `src` directory; avoid relative `../../` imports.
- Prefer pure functions and typed helpers; keep tRPC routers, JSX components, and Workers focused on orchestration and call shared utilities.
- Prefer `instanceof` checks over type assertions for type narrowing.
- Use CSS modules for component-specific styles, with a `.module.css` file adjacent to the JSX component file.
- Use shared class names and nested rules to reduce duplication in CSS files.
- Run `pnpm format:check` before committing.

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

## Commit & Pull Request Guidelines

- Follow the existing short, imperative commit style (`Add column editing events`, `Update seed script`); keep the subject under ~72 characters and skip trailing punctuation.
- Each PR should include: what changed and why, manual test notes or screenshots for UI tweaks, linked issue numbers, and any migration or seed steps required.
- Before requesting review, ensure `pnpm check` and `pnpm test` succeed.

## Web Components

- Use Shadow DOM to isolate structure and style, with adopted stylesheets imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect element properties to attributes and vice versa.

## UI Patterns

- Use optimistic UI updates where possible.

## Environment & Security Notes

- During development, environment variables are loaded from an untracked `.env` file in the workspace root. Never commit secrets.
