---
name: run-app
description: Start the app and drive it with a headless browser. Use whenever needed to test functionality in a running version of the app.
---

# Run the app

## Start

```sh
pnpm dev:start
```

Starts all dev services, waits until they are ready to accept connections, and prints the web app URL. It is idempotent, so may be run if the app is already running. Servers hot-reload on code changes.

Use the app URL that the command prints, as the hostname depends on the environment:

- **Local session in a dev container**: `https://<workspace>.tiles.test`, where `<workspace>` corresponds to the Git worktree.
- **Cloud session** (`CLAUDE_CODE_REMOTE=true`): `http://localhost:3000`.

## Sign in

Open `<app-url>/sign-in/test-user` to sign in as a test user (a development-only route).

## Browse

You can use the `chrome-devtools` MCP server to control a headless Chromium instance to browse the app.

Use `chrome-devtools-host` (only available in a local session) if the user needs to follow along. It attaches to a Chrome instance already running on the host.

In development, uploaded images and fonts are served from a local R2 bucket by the dev CDN.

## Debugging

- `pnpm dev:logs` prints the last 100 lines of combined server output.
- `pnpm dev:stop` then `pnpm dev:start` restarts all services.
