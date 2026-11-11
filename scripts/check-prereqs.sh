#!/usr/bin/env bash
# Checks this laptop has what the team environment needs. Changes nothing.
# Usage: bash scripts/check-prereqs.sh
set -uo pipefail

ok=0
pass() { printf '  \033[32mOK\033[0m   %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m %s\n' "$1"; ok=1; }
warn() { printf '  \033[33mWARN\033[0m %s\n' "$1"; }

echo "Required (containers):"
if ! command -v docker >/dev/null; then
  fail "docker not installed - install Docker Desktop"
elif ! docker info >/dev/null 2>&1; then
  fail "Docker is installed but not running - start Docker Desktop"
else
  pass "Docker running ($(docker version --format '{{.Server.Version}}'))"
  cv=$(docker compose version --short 2>/dev/null || echo 0)
  # additional_contexts needs Compose 2.17+
  if [ "$(printf '%s\n2.17.0\n' "$cv" | sort -V | head -1)" = "2.17.0" ]; then
    pass "Docker Compose $cv"
  else
    fail "Docker Compose $cv is too old (need 2.17+) - update Docker Desktop"
  fi
fi

for p in 9966 8080; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1 && ! docker compose ps --status running 2>/dev/null | grep -q ":$p->"; then
    warn "port $p is already in use by something else (stop it before 'docker compose up')"
  fi
done

echo "Optional (only for running things outside Docker):"
if command -v java >/dev/null; then
  jv=$(java -version 2>&1 | awk -F'"' '/version/{print $2}' | cut -d. -f1)
  [ "${jv:-0}" -ge 21 ] && pass "Java $jv (21+ needed)" || warn "Java $jv - need 21+ for ./mvnw"
else
  warn "java not installed - fine if you only use Docker"
fi
if command -v node >/dev/null; then
  nv=$(node -v | sed 's/^v//')
  case "$nv" in 24.*) pass "Node $nv (matches .nvmrc)";; *) warn "Node $nv - project wants 24.x (.nvmrc); Angular CLI will refuse it";; esac
else
  warn "node not installed - fine if you only use Docker"
fi

exit $ok
