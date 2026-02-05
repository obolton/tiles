#!/bin/sh
set -e

# Trust all Git repositories under /projects
for dir in /projects/*/; do
    git config --system --add safe.directory "$dir"
done

# Set ownership for pnpm store
mkdir -p /pnpm/store
chown -R node:node /pnpm/store

# Create node_modules directories with correct ownership for volume mounts
if [ -n "$WORKSPACE" ]; then
    mkdir -p \
        "/projects/${WORKSPACE}/node_modules" \
        "/projects/${WORKSPACE}/packages/api/node_modules" \
        "/projects/${WORKSPACE}/packages/web/node_modules" \
        "/projects/${WORKSPACE}/packages/image-upload-worker/node_modules"
    chown -R node:node "/projects/${WORKSPACE}/node_modules" \
        "/projects/${WORKSPACE}/packages/api/node_modules" \
        "/projects/${WORKSPACE}/packages/web/node_modules" \
        "/projects/${WORKSPACE}/packages/image-upload-worker/node_modules"
fi

# Drop to node user and execute the command
exec su node -s /bin/zsh -c "$*"
