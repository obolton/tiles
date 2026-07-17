#!/bin/bash
set -e

WORKSPACE="$1"

shared_compose() {
  docker compose -f .devcontainer/shared/docker-compose.yml "$@"
}

# Start shared services
shared_compose up -d

# Export the Caddy root CA certificate, waiting for Caddy to generate it
CADDY_CA=/data/caddy/pki/authorities/local/root.crt
CA_DIR=.devcontainer/.generated/caddy
CA_CERT="$CA_DIR/root.crt"
mkdir -p "$CA_DIR"
TEMP_CERT=$(mktemp "$CA_DIR/.root.crt.XXXXXX")
trap 'rm -f "$TEMP_CERT"' EXIT

for ((attempt = 1; attempt <= 30; attempt++)); do
  shared_compose cp "caddy:$CADDY_CA" "$TEMP_CERT" 2>/dev/null && break
  if [ "$attempt" -eq 30 ]; then
    echo "Failed to export the Caddy root CA certificate:" >&2
    shared_compose logs caddy >&2
    exit 1
  fi
  sleep 1
done

# Validate the export, then atomically replace the previous copy (bind-mounted into containers)
openssl x509 -in "$TEMP_CERT" -noout -text | grep -q "CA:TRUE" ||
  { echo "The exported file is not a valid CA certificate." >&2; exit 1; }
openssl verify -CAfile "$TEMP_CERT" "$TEMP_CERT" >/dev/null 2>&1 ||
  { echo "The exported CA certificate is not a valid self-signed root." >&2; exit 1; }
if [ -f "$CA_CERT" ] && ! cmp -s "$TEMP_CERT" "$CA_CERT"; then
  echo "The Caddy root CA has changed. Restart the dev container to trust it." >&2
fi
chmod 644 "$TEMP_CERT"
mv "$TEMP_CERT" "$CA_CERT"

# Trust the Caddy CA on the host (matched by fingerprint so a regenerated CA is installed)
if [ "$(uname)" = "Darwin" ]; then
  LOGIN_KEYCHAIN=~/Library/Keychains/login.keychain-db
  FINGERPRINT=$(openssl x509 -in "$CA_CERT" -noout -fingerprint -sha256 | cut -d= -f2 | tr -d :)

  if ! security find-certificate -a -Z "$LOGIN_KEYCHAIN" 2>/dev/null | grep -q "$FINGERPRINT"; then
    echo "Installing Caddy CA certificate..."
    security add-trusted-cert -r trustRoot -k "$LOGIN_KEYCHAIN" "$CA_CERT"
  fi
fi

# Write environment variables
if [ ! -f .devcontainer/.env ]; then
  cat > .devcontainer/.env << EOF
WORKSPACE=${WORKSPACE}
DATABASE_NAME=${WORKSPACE}
EOF
fi
