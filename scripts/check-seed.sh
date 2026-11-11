#!/usr/bin/env bash
# Confirms the API holds exactly the seeded data, so every laptop and every test run
# starts from the same state. Read-only: it only sends GET requests.
#
# Usage: bash scripts/check-seed.sh
#   API_BASE   default http://localhost:9966/petclinic/api
#   API_AUTH   "user:password" when PETCLINIC_SECURITY_ENABLE=true (use a seeded user)
#
# Expected counts come from spring-petclinic-rest/src/main/resources/db/h2/data.sql.
# If that file changes, update this table and docs/environment.md together.
set -uo pipefail

API_BASE="${API_BASE:-http://localhost:9966/petclinic/api}"
auth=()
[ -n "${API_AUTH:-}" ] && auth=(-u "$API_AUTH")

expected=(
  "owners 10"
  "pets 13"
  "visits 4"
  "vets 6"
  "pettypes 6"
  "specialties 3"
)

status=0
for row in "${expected[@]}"; do
  set -- $row
  resource=$1 want=$2
  body=$(curl -sf ${auth[@]+"${auth[@]}"} -H 'Accept: application/json' "$API_BASE/$resource") || {
    printf '  \033[31mFAIL\033[0m %-12s request failed (is the API up? security on without API_AUTH?)\n' "$resource"
    status=1; continue
  }
  got=$(printf '%s' "$body" | python3 -c 'import sys,json; print(len(json.load(sys.stdin)))' 2>/dev/null || echo "?")
  if [ "$got" = "$want" ]; then
    printf '  \033[32mOK\033[0m   %-12s %s\n' "$resource" "$got"
  else
    printf '  \033[31mFAIL\033[0m %-12s expected %s, got %s\n' "$resource" "$want" "$got"
    status=1
  fi
done

[ $status -eq 0 ] && echo "Seed data matches." || echo "Seed data does NOT match - run scripts/reset.sh"
exit $status
