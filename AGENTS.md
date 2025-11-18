# Repository Guidelines

## Project Structure & Module Organization

- `packages/api`: API server using Node with tRPC and Prisma, with application code in `src`; development scripts live in `scripts`.
- `packages/web`: Web frontend using Vite, Web Components and a custom JSX runtime; UI code is under `src/components`, `src/elements`, and `src/pages`, with helpers in `src/utils` and `src/jsx`.
- `packages/image-upload-worker`: Cloudflare Worker handling media uploads; keep worker code small and dependency-light.
- Root configs (`tsconfig.json`, `vitest.workspace.ts`, lint settings) and SSL certs live at the repo root. Update them cautiously because all workspaces consume them.

## Build, Test, and Development Commands

- `npm run dev`: Starts API (Ports via `.env`) and web dev servers.
- `npm run build --workspace=api` / `--workspace=web`: Produces deployable artifacts; API bundles with `esbuild`, web builds client + SSR worker with Vite.
- `npm run db:push` and `npm run db:seed`: Apply Prisma schema changes and load seed data; run after editing `packages/api/prisma` files.
- `npm run lint`: Runs `oxlint` plus `stylelint` for the web workspace; keep output clean before opening a PR.
- `npm run test`, `npm run test --workspace=<pkg>`, and `npm run test:coverage`: Execute Vitest suites across packages with optional coverage.

## Coding Style & Naming Conventions

- Use TypeScript with ES modules and two-space indentation.
- Use the `@/*` path alias that resolves to each package's `src` directory; avoid relative `../../` imports.
- Prefer pure functions and typed helpers; keep tRPC routers, JSX components, and Workers focused on orchestration and call shared utilities.
- Use CSS modules for component-specific styles, with a `.module.css` file adjacent to the JSX component file.
- Use shared class names and nested rules to reduce duplication in CSS files.
- Run `npx prettier --check "**/*.{ts,tsx,css}"` before committing when touching formatting-heavy files.

## Testing Guidelines

- Use Vitest for unit tests.
- Use `describe` blocks for each function being tested, and to provide structure to test suites.
- Place test files beside code in `__tests__` directories using `*.test.ts` files.
- Mock external services (database, Cloudflare API etc) with existing test utilities rather than hitting the network; review current fixtures before adding new ones.
- New features require at least one failing test before implementation and a coverage check via `npm run test:coverage` when practical.

## Commit & Pull Request Guidelines

- Follow the existing short, imperative commit style (`Add column editing events`, `Update seed script`); keep the subject under ~72 characters and skip trailing punctuation.
- Each PR should include: what changed and why, manual test notes or screenshots for UI tweaks, linked issue numbers, and any migration or seed steps required.
- Before requesting review, ensure `npm run lint`, `npm run test`, and relevant build commands succeed; include that status in the PR description.

## Environment & Security Notes

- During development, environment variables are loaded from an untracked `.env` file in the workspace root. Never commit secrets.
