#!/bin/sh
set -eu

: "${WORKSPACE:?WORKSPACE must be set}"

# Fix directory ownership
mkdir -p /pnpm/store /home/node/.claude
chown node:node /pnpm/store /home/node/.claude

# Create node_modules directories with correct ownership for volume mounts
mkdir -p \
    "/projects/${WORKSPACE}/node_modules" \
    "/projects/${WORKSPACE}/packages/api/node_modules" \
    "/projects/${WORKSPACE}/packages/web/node_modules" \
    "/projects/${WORKSPACE}/packages/image-upload-worker/node_modules"
chown node:node "/projects/${WORKSPACE}/node_modules" \
    "/projects/${WORKSPACE}/packages/api/node_modules" \
    "/projects/${WORKSPACE}/packages/web/node_modules" \
    "/projects/${WORKSPACE}/packages/image-upload-worker/node_modules"

# Trust the Caddy root CA
CA_SOURCE=/run/caddy-ca/root.crt
if [ -f "$CA_SOURCE" ]; then
    cp "$CA_SOURCE" /usr/local/share/ca-certificates/caddy-root.crt
    update-ca-certificates
    runuser -u node -- sh -ec '
        mkdir -p /home/node/.pki/nssdb
        [ -f /home/node/.pki/nssdb/cert9.db ] || certutil -d sql:/home/node/.pki/nssdb -N --empty-password
        if certutil -d sql:/home/node/.pki/nssdb -L -n "Caddy Local CA" >/dev/null 2>&1; then
            certutil -d sql:/home/node/.pki/nssdb -D -n "Caddy Local CA"
        fi
        certutil -d sql:/home/node/.pki/nssdb -A -t "C,," -n "Caddy Local CA" -i /run/caddy-ca/root.crt
    '
fi

# Bridge the Chrome DevTools port to the shared Chrome instance on the host
socat TCP-LISTEN:9222,bind=127.0.0.1,fork,reuseaddr TCP:host.docker.internal:9222 &

# Drop to node user and execute the command
exec runuser -u node -- "$@"
