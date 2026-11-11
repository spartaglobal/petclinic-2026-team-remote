# Runs an OWASP ZAP baseline (passive) scan against a locally running petclinic REST API.
#
# Prerequisites:
#   - Docker Desktop running
#   - The API running on the host:  ./mvnw spring-boot:run   (http://localhost:9966/petclinic)
#
# Usage:
#   ./zap/run-zap-baseline.ps1
#   ./zap/run-zap-baseline.ps1 -Target http://host.docker.internal:9966/petclinic/v3/api-docs
#
# The scan starts at the springdoc OpenAPI document; ZAP's OpenAPI add-on parses it
# while spidering, so every documented endpoint gets requested and passively scanned.
# Reports are written to zap/reports/. Exit code: 0 = pass (WARNs allowed via -I), 1 = a FAIL rule was hit.

param(
    [string]$Target = "http://host.docker.internal:9966/petclinic/v3/api-docs",
    [string]$Image = "ghcr.io/zaproxy/zaproxy:stable",
    [int]$SpiderMinutes = 2
)

$zapDir = $PSScriptRoot
New-Item -ItemType Directory -Force (Join-Path $zapDir "reports") | Out-Null

docker run --rm `
    --add-host=host.docker.internal:host-gateway `
    -v "${zapDir}:/zap/wrk:rw" `
    $Image `
    zap-baseline.py `
        -t $Target `
        -c zap-baseline.conf `
        -m $SpiderMinutes `
        -r reports/zap-baseline-report.html `
        -J reports/zap-baseline-report.json `
        -w reports/zap-baseline-report.md `
        -I

exit $LASTEXITCODE
