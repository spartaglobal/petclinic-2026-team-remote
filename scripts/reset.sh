#!/usr/bin/env bash
# Puts the API back to its seeded state by recreating its container. The database is
# in memory, so a new container reloads schema.sql and data.sql from scratch.
# The front end holds no data, so it is left running.
# Usage: bash scripts/reset.sh
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Resetting API to seeded data..."
docker compose up -d --force-recreate --no-deps --wait api

bash scripts/check-seed.sh
