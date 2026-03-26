#!/bin/sh
set -eu

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required"
  exit 1
fi

if [ "${AUTO_DB_PUSH_ON_START:-false}" = "true" ]; then
  echo "AUTO_DB_PUSH_ON_START=true: applying schema changes with drizzle-kit push"
  npm run db:push
else
  echo "Skipping automatic schema sync. Set AUTO_DB_PUSH_ON_START=true to enable it."
fi

exec node .output/server/index.mjs
