#!/usr/bin/env bash
set -euo pipefail

# Run only in cloud environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

service postgresql start
"$(dirname "$0")/../setup.sh"
