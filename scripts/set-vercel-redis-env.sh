#!/usr/bin/env bash
# Push Upstash Redis credentials from .env to the linked Vercel project.
# Prereq: npx vercel login && npx vercel link
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env (copy from .env.example and fill Upstash values)." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

if [[ -z "${UPSTASH_REDIS_REST_URL:-}" || -z "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
  echo "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in .env." >&2
  exit 1
fi

add_env() {
  local name="$1"
  local value="$2"
  local environment="$3"
  # Remove existing value for this environment if present, then add.
  npx --yes vercel env rm "$name" "$environment" -y >/dev/null 2>&1 || true
  printf '%s' "$value" | npx --yes vercel env add "$name" "$environment"
  echo "Set $name ($environment)"
}

for environment in production preview development; do
  add_env UPSTASH_REDIS_REST_URL "$UPSTASH_REDIS_REST_URL" "$environment"
  add_env UPSTASH_REDIS_REST_TOKEN "$UPSTASH_REDIS_REST_TOKEN" "$environment"
done

echo "Done. Redeploy the mock API so the new env is applied:"
echo "  npx vercel --prod"
