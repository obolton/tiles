#!/usr/bin/env bash
set -euo pipefail

pnpm install
pnpm --filter api db:push
pnpm generate
pnpm --filter api db:seed
pnpm fonts:sync
