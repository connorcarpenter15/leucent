#!/usr/bin/env bash
# scripts/smoke.sh — end-to-end smoke test for a deployed Leucent stack.
#
# Usage:
#   scripts/smoke.sh https://web.example https://rt.example https://ai.example
#
# The script is idempotent and only does GET-style health probes plus one
# unauthenticated POST against the AI orchestrator's /health. It does NOT
# create real interview rows — full e2e against an authenticated session
# requires interactive login, which lives in apps/web/e2e/ (TBD).

set -euo pipefail

WEB="${1:-http://localhost:3000}"
RT="${2:-http://localhost:4000}"
AI="${3:-http://localhost:5000}"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
hr() { printf '%.0s-' {1..72}; echo; }

probe() {
  local label="$1"; shift
  local url="$1"; shift
  printf '  %-28s ' "$label"
  if code=$(curl -s -o /tmp/leucent_smoke.out -w '%{http_code}' --max-time 10 "$url"); then
    if [[ "$code" == "200" ]]; then
      green "OK ($code)"
    else
      red "FAIL ($code)"
      sed 's/^/      /' /tmp/leucent_smoke.out | head -5
      return 1
    fi
  else
    red "FAIL (network)"
    return 1
  fi
}

echo "Leucent smoke test"
hr
probe "web /"                  "$WEB/"
probe "web /login"             "$WEB/login"
probe "realtime /health"       "$RT/health"
probe "ai /health"             "$AI/health"
hr
green "All public endpoints reachable."
echo
echo "Next: interactively sign up at $WEB/signup, create an interview,"
echo "open the candidate join link in an incognito window, and verify that"
echo "edits in the Monaco editor appear in the interviewer's console tab."
