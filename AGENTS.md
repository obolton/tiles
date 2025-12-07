# Repository Guidelines

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

- `pnpm dev`: Starts API and web dev servers with HMR.
- `pnpm build`: Builds the project for deployment (API with `esbuild`, web frontend with Vite).
- `pnpm tsc`: Runs the TypeScript compiler.
- `pnpm lint`: Lint TypeScript and CSS files (using `oxlint` and `stylelint`).
- `pnpm db:push` and `pnpm db:seed`: Apply Prisma schema changes and load seed data; run after editing `packages/api/prisma` files.
- `pnpm test`, `pnpm --filter <pkg> test`, and `pnpm test:coverage`: Execute Vitest suites across packages with optional coverage.
- Note: When working in a local environment, all dependencies are installed inside a VS Code dev container. Use the `devcontainer` CLI to run all `pnpm` scripts: `devcontainer exec --workspace-folder . <command>`.

## Coding Style

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

- Use Shadow DOM to isolate structure and style, with adopted stylesheets imported via `?inline`.
- Use the `handleEvent` pattern for event handling within components.
- Reflect element properties to attributes and vice versa.

## UI Patterns

- Use optimistic UI updates where possible.

## Environment & Security Notes

- During development, environment variables are loaded from an untracked `.env` file in the workspace root. Never commit secrets.
