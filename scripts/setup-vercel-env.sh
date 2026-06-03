#!/usr/bin/env bash
# Push the /api/mcp env vars to the command-center Vercel project for both
# production and preview, reading real values from .env.mcp.local (gitignored).
#
# Prereqs:
#   npm i -g vercel
#   vercel login
#   vercel link                 # select the command-center project
#   cp .env.mcp.example .env.mcp.local && fill in real values
#
# Usage:
#   bash scripts/setup-vercel-env.sh [env-file]   # default: .env.mcp.local
#
# Re-running is safe: each var is removed then re-added so values stay current.
# Trigger a redeploy afterwards for the changes to take effect.
set -euo pipefail

ENV_FILE="${1:-.env.mcp.local}"
if [ ! -f "$ENV_FILE" ]; then
  echo "error: $ENV_FILE not found. Copy .env.mcp.example and fill it in." >&2
  exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
  echo "error: vercel CLI not found. Run: npm i -g vercel && vercel login && vercel link" >&2
  exit 1
fi

VARS=(
  MCP_BEARER_TOKEN
  GITHUB_TOKEN
  TODOIST_TOKEN
  TWILIO_ACCOUNT_SID
  TWILIO_AUTH_TOKEN
  TWILIO_FROM
  TWILIO_TO
  NWB_POSTGRES_READONLY_URL
)

# Load the env file without leaking values into the shell's history/output.
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

for target in production preview; do
  for name in "${VARS[@]}"; do
    val="${!name:-}"
    if [ -z "$val" ]; then
      echo "skip  $name ($target): empty in $ENV_FILE"
      continue
    fi
    vercel env rm "$name" "$target" -y >/dev/null 2>&1 || true
    printf '%s' "$val" | vercel env add "$name" "$target" >/dev/null
    echo "set   $name ($target)"
  done
done

echo
echo "Done. Redeploy for changes to take effect:  vercel --prod"
