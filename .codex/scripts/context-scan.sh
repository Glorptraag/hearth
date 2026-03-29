#!/usr/bin/env bash

set -euo pipefail

target="${1:-src}"

if [[ ! -e "$target" ]]; then
  echo "Path does not exist: $target" >&2
  exit 1
fi

echo "# Context Scan"
echo
echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "- Target: $target"
echo

if [[ -d "$target" ]]; then
  echo "## Top Files"
  echo
  rg --files "$target" | head -40
  echo

  echo "## Entry-Point Candidates"
  echo
  rg --files "$target" | rg '(^|/)(page|layout|route|index|client)\.(ts|tsx|js|jsx|md)$' || true
  echo

  echo "## Exported Symbols"
  echo
  rg -n '^(export |export default |async function |function |const [A-Z][A-Za-z0-9_]*)' "$target" -g '*.ts' -g '*.tsx' -g '*.js' -g '*.jsx' | head -120 || true
  echo

  echo "## Nearby Canonical Docs"
  echo
  rg --files docs | rg 'planner|portfolio|report|notification|settings|marketplace|module|badge|capabilit|story|onboarding|dashboard|logger|data|architecture' || true
else
  echo "## File Preview"
  echo
  sed -n '1,220p' "$target"
fi
