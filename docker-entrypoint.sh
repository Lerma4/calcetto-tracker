#!/bin/sh
set -eu

if [ "${AUTO_DB_PUSH_ON_START:-false}" = "true" ]; then
  echo "AUTO_DB_PUSH_ON_START=true: applying schema changes with drizzle-kit push"
  npx drizzle-kit push
else
  echo "Skipping automatic schema sync. Set AUTO_DB_PUSH_ON_START=true to enable it."
fi

exec node .output/server/index.mjs
