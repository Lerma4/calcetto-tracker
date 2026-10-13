#!/bin/sh
set -eu

if [ "${REQUIRE_EXISTING_DB:-false}" = "true" ] && [ ! -s ./data/sqlite.db ]; then
  echo "Database missing or empty: restore /app/data/sqlite.db before starting" >&2
  exit 1
fi

if [ "${AUTO_DB_PUSH_ON_START:-false}" = "true" ]; then
  echo "AUTO_DB_PUSH_ON_START=true: applying schema changes with drizzle-kit push"
  npx drizzle-kit push
else
  echo "Skipping automatic schema sync. Set AUTO_DB_PUSH_ON_START=true to enable it."
fi

exec node .output/server/index.mjs
