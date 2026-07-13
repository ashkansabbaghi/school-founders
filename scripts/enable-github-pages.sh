#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install it and run: gh auth login" >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Run 'gh auth login' first (needs repo admin access)." >&2
  exit 1
fi

REPO="${1:-}"
if [ -z "${REPO}" ]; then
  if ! REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null)"; then
    echo "Could not detect repository. Pass owner/repo as the first argument." >&2
    exit 1
  fi
fi

API="repos/${REPO}/pages"

status="$(gh api "${API}" --silent --include 2>&1 | awk '/HTTP\/[0-9.]+ ([0-9]+)/ { print $2; exit }' || true)"

if [ "${status:-404}" = "404" ]; then
  if ! gh api -X POST "${API}" -f build_type=workflow; then
    echo "" >&2
    echo "Failed to enable Pages (often 403 = missing admin/Pages permissions)." >&2
    echo "Ensure your gh account is a repo admin, or enable manually:" >&2
    echo "  https://github.com/${REPO}/settings/pages → GitHub Actions" >&2
    exit 1
  fi
else
  gh api -X PUT "${API}" -f build_type=workflow
fi

gh api "${API}" --jq '{build_type, status, html_url}'
