#!/usr/bin/env bash
# Runs an OWASP ZAP baseline (passive) scan against a locally running petclinic REST API.
#
# Prerequisites:
#   - Docker running
#   - The API running on the host:  ./mvnw spring-boot:run   (http://localhost:9966/petclinic)
#
# Usage:
#   ./zap/run-zap-baseline.sh
#   TARGET=http://host.docker.internal:9966/petclinic/v3/api-docs ./zap/run-zap-baseline.sh
#
# The scan starts at the springdoc OpenAPI document; ZAP's OpenAPI add-on parses it
# while spidering, so every documented endpoint gets requested and passively scanned.
# Reports are written to zap/reports/. Exit code: 0 = pass (WARNs allowed via -I), 1 = a FAIL rule was hit.

set -euo pipefail

TARGET="${TARGET:-http://host.docker.internal:9966/petclinic/v3/api-docs}"
IMAGE="${IMAGE:-ghcr.io/zaproxy/zaproxy:stable}"
SPIDER_MINUTES="${SPIDER_MINUTES:-2}"

ZAP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "${ZAP_DIR}/reports"

# The ZAP container runs as user "zap" (uid 1000); make sure it can write the reports.
chmod a+w "${ZAP_DIR}/reports"

docker run --rm \
    --add-host=host.docker.internal:host-gateway \
    -v "${ZAP_DIR}:/zap/wrk:rw" \
    "${IMAGE}" \
    zap-baseline.py \
        -t "${TARGET}" \
        -c zap-baseline.conf \
        -m "${SPIDER_MINUTES}" \
        -r reports/zap-baseline-report.html \
        -J reports/zap-baseline-report.json \
        -w reports/zap-baseline-report.md \
        -I
