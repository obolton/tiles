#!/bin/bash
set -e

WORKSPACE="$1"

# Create shared network
docker network inspect tiles-dev >/dev/null 2>&1 || docker network create tiles-dev

# Start shared services
docker compose -f .devcontainer/shared/docker-compose.yml up -d

# Trust Caddy CA certificate
if [ "$(uname)" = "Darwin" ]; then
  CADDY_CA="/data/caddy/pki/authorities/local/root.crt"
  LOGIN_KEYCHAIN=~/Library/Keychains/login.keychain-db

  # Check if Caddy's CA is already trusted
  if ! security find-certificate -c "Caddy Local Authority" "$LOGIN_KEYCHAIN" &>/dev/null; then
    TMP_CERT=$(mktemp)

    # Wait for Caddy to generate its CA certificate
    until docker cp "tiles-caddy:$CADDY_CA" "$TMP_CERT" 2>/dev/null; do
      sleep 1
    done

    echo "Installing Caddy CA certificate..."
    security add-trusted-cert -r trustRoot -k "$LOGIN_KEYCHAIN" "$TMP_CERT"
    rm "$TMP_CERT"
  fi
fi

# Write environment variables
if [ ! -f .devcontainer/.env ]; then
  cat > .devcontainer/.env << EOF
WORKSPACE=${WORKSPACE}
DATABASE_NAME=tiles
EOF
fi
