# Repository Guidelines

## Project Structure & Module Organization

- `packages/api`: API server using Node with tRPC and Prisma, with application code in `src`; development scripts live in `scripts`.
- `packages/web`: Web frontend using Vite, Web Components and a custom JSX runtime; UI code is under `src/components`, `src/elements`, and `src/pages`, with helpers in `src/utils` and `src/jsx`.
- `packages/image-upload-worker`: Cloudflare Worker handling media uploads; keep worker code small and dependency-light.
- Root configs (`tsconfig.json`, `vitest.workspace.ts`, lint settings) and SSL certs live at the repo root. Update them cautiously because all workspaces consume them.

## Build, Test, and Development Commands

- `pnpm dev`: Starts API (Ports via `.env`) and web dev servers.
- `pnpm --filter api build` / `pnpm --filter web build`: Produces deployable artifacts; API bundles with `esbuild`, web builds client + SSR worker with Vite.
- `pnpm db:push` and `pnpm db:seed`: Apply Prisma schema changes and load seed data; run after editing `packages/api/prisma` files.
- `pnpm lint`: Runs `oxlint` plus `stylelint` for the web workspace; keep output clean before opening a PR.
- `pnpm test`, `pnpm --filter <pkg> test`, and `pnpm test:coverage`: Execute Vitest suites across packages with optional coverage.

## Coding Style & Naming Conventions

- Use TypeScript with ES modules and two-space indentation.
- Use the `@/*` path alias that resolves to each package's `src` directory; avoid relative `../../` imports.
- Prefer pure functions and typed helpers; keep tRPC routers, JSX components, and Workers focused on orchestration and call shared utilities.
- Prefer `instanceof` checks over type assertions for type narrowing.
- Use CSS modules for component-specific styles, with a `.module.css` file adjacent to the JSX component file.
- Use shared class names and nested rules to reduce duplication in CSS files.
- Run `pnpm exec prettier --check "**/*.{ts,tsx,css}"` before committing when touching formatting-heavy files.

## Testing Guidelines

- Use Vitest for unit tests.
- Use `describe` blocks for each function being tested, and to provide structure to test suites.
- Place test files beside code in `__tests__` directories using `*.test.ts` files.
- Mock external services (database, Cloudflare API etc) with existing test utilities rather than hitting the network; review current fixtures before adding new ones.
- New features require at least one failing test before implementation and a coverage check via `pnpm test:coverage` when practical.

## Commit & Pull Request Guidelines

- Follow the existing short, imperative commit style (`Add column editing events`, `Update seed script`); keep the subject under ~72 characters and skip trailing punctuation.
- Each PR should include: what changed and why, manual test notes or screenshots for UI tweaks, linked issue numbers, and any migration or seed steps required.
- Before requesting review, ensure `pnpm lint`, `pnpm test`, and relevant build commands succeed; include that status in the PR description.

## Web Components

- Custom elements live in `src/elements` with Shadow DOM and CSS imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect properties to attributes and vice versa.
- Prefer ARIA properties (`ariaPressed`, `ariaSelected`) over `setAttribute` for accessibility attributes.

## UI Patterns

- Prefer optimistic UI updates - update the DOM before API calls complete for better responsiveness.

## Environment & Security Notes

- During development, environment variables are loaded from an untracked `.env` file in the workspace root. Never commit secrets.
