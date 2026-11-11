#!/usr/bin/env bash
# Builds and starts the service (API :9966, front end :8080), waits until both are
# healthy, then checks the seed data. Safe to run again at any time.
# Usage: bash scripts/env-up.sh
set -euo pipefail
cd "$(dirname "$0")/.."

bash scripts/check-prereqs.sh

# Report folders the containers write into (ZAP runs as uid 1000, so it needs write access).
mkdir -p spring-petclinic-rest/zap/reports spring-petclinic-rest/src/test/postman/reports \
         spring-petclinic-angular/playwright-report spring-petclinic-angular/test-results
chmod a+w spring-petclinic-rest/zap/reports

echo "Building and starting the service..."
docker compose up -d --build --wait api frontend

bash scripts/check-seed.sh

cat <<EOF

Ready.
  Front end   http://localhost:8080
  API         http://localhost:9966/petclinic/api
  Swagger UI  http://localhost:9966/petclinic/swagger-ui.html
  Health      http://localhost:9966/petclinic/actuator/health
EOF
