#!/bin/sh
set -e

# Trust all Git repositories under /projects
for dir in /projects/*/; do
    git config --system --add safe.directory "$dir"
done

# Fix directory ownership
mkdir -p /pnpm/store
chown -R node:node /pnpm/store
mkdir -p /home/node/.claude
chown node:node /home/node/.claude

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
