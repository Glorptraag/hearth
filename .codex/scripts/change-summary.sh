#!/usr/bin/env bash

set -euo pipefail

mode="worktree"
target_a=""
target_b=""

usage() {
  cat <<'EOF'
Usage:
  ./.codex/scripts/change-summary.sh
  ./.codex/scripts/change-summary.sh --staged
  ./.codex/scripts/change-summary.sh --commit <sha>
  ./.codex/scripts/change-summary.sh --range <base> <head>

Outputs a structured markdown snapshot of the requested diff scope.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --staged)
      mode="staged"
      shift
      ;;
    --commit)
      mode="commit"
      target_a="${2:-}"
      [[ -n "$target_a" ]] || { usage; exit 1; }
      shift 2
      ;;
    --range)
      mode="range"
      target_a="${2:-}"
      target_b="${3:-}"
      [[ -n "$target_a" && -n "$target_b" ]] || { usage; exit 1; }
      shift 3
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage
      exit 1
      ;;
  esac
done

echo "# Change Summary Input"
echo
echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "- Repo: $(basename "$(git rev-parse --show-toplevel)")"
echo "- Branch: $(git branch --show-current 2>/dev/null || echo detached)"
echo "- Mode: $mode"
echo
echo "## Worktree Status"
echo
git status --short || true
echo

case "$mode" in
  worktree)
    echo "## Diff Stat"
    echo
    git diff --stat
    echo
    echo "## Changed Files"
    echo
    git diff --name-only
    echo
    echo "## Patch"
    echo
    git diff --minimal
    ;;
  staged)
    echo "## Diff Stat"
    echo
    git diff --cached --stat
    echo
    echo "## Changed Files"
    echo
    git diff --cached --name-only
    echo
    echo "## Patch"
    echo
    git diff --cached --minimal
    ;;
  commit)
    echo "## Commit"
    echo
    git show --stat --summary --format=fuller "$target_a"
    echo
    echo "## Changed Files"
    echo
    git show --name-only --format='' "$target_a"
    echo
    echo "## Patch"
    echo
    git show --minimal --format=medium "$target_a"
    ;;
  range)
    echo "## Commit Range"
    echo
    git log --oneline "$target_a..$target_b"
    echo
    echo "## Diff Stat"
    echo
    git diff --stat "$target_a..$target_b"
    echo
    echo "## Changed Files"
    echo
    git diff --name-only "$target_a..$target_b"
    echo
    echo "## Patch"
    echo
    git diff --minimal "$target_a..$target_b"
    ;;
esac
