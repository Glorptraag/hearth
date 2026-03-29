#!/usr/bin/env bash

set -o pipefail

level="${1:-quick}"
failures=0
warns=0
passes=0

declare -a PASS_ITEMS=()
declare -a FAIL_ITEMS=()
declare -a WARN_ITEMS=()
declare -a CHECK_RESULTS=()
declare -a TEST_SCRIPTS=()
declare -a REFERENCED_ENVS=()
declare -a LOCAL_ENVS=()

usage() {
  cat <<'EOF'
Usage:
  ./.codex/scripts/repo-health.sh quick
  ./.codex/scripts/repo-health.sh standard
  ./.codex/scripts/repo-health.sh full

Runs existing repository checks and prints a markdown report.
EOF
}

add_pass() {
  PASS_ITEMS+=("$1")
  passes=$((passes + 1))
}

add_fail() {
  FAIL_ITEMS+=("$1")
  failures=$((failures + 1))
}

add_warn() {
  WARN_ITEMS+=("$1")
  warns=$((warns + 1))
}

has_pkg_script() {
  local name="$1"
  node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$name'] ? 0 : 1)"
}

find_test_scripts() {
  node -e "const p=require('./package.json'); const keys=Object.keys(p.scripts||{}).filter((k)=>/^test($|:)/.test(k)); console.log(keys.join('\n'))"
}

env_refs() {
  rg --no-filename -o 'process\.env\.([A-Z0-9_]+)' . \
    --glob '!node_modules/**' \
    --glob '!.next/**' \
    --glob '!package-lock.json' \
    -r '$1' | sort -u
}

env_file_keys() {
  if [[ -f .env.local ]]; then
    sed -n 's/^\([A-Z0-9_][A-Z0-9_]*\)=.*/\1/p' .env.local | sort -u
  fi
}

load_array_from_command() {
  local __target="$1"
  shift

  local __line
  while IFS= read -r __line; do
    [[ -z "$__line" ]] && continue
    eval "$__target+=(\"\$__line\")"
  done < <("$@")
}

run_check() {
  local label="$1"
  local interpretation_on_pass="$2"
  shift 2

  local command_string="$*"

  echo "### $label"
  echo
  echo '```bash'
  printf '%s\n' "$command_string"
  echo '```'

  set +e
  local output
  output="$("$@" 2>&1)"
  local status=$?
  set -e

  if [[ -n "$output" ]]; then
    echo '```text'
    printf '%s\n' "$output"
    echo '```'
  else
    echo "_No output_"
  fi

  echo
  echo "- Exit code: $status"
  echo

  if [[ $status -eq 0 ]]; then
    CHECK_RESULTS+=("\`$command_string\`: pass")
    add_pass "$label passed. $interpretation_on_pass"
  else
    CHECK_RESULTS+=("\`$command_string\`: fail")
    add_fail "$label failed. Review the command output above."
  fi
}

print_list_or_none() {
  local fallback="$1"
  shift
  if [[ $# -eq 0 ]]; then
    echo "- $fallback"
    return
  fi

  local item
  for item in "$@"; do
    echo "- $item"
  done
}

case "$level" in
  quick|standard|full)
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    echo "Unknown level: $level" >&2
    usage
    exit 1
    ;;
esac

set -e

echo "# Repo Health Report"
echo
echo "- Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "- Level: $level"
echo "- Repo: $(basename "$(git rev-parse --show-toplevel)")"
echo "- Branch: $(git branch --show-current 2>/dev/null || echo detached)"
echo

run_check "Worktree State" "This reflects the current modified and untracked files." git status --short

echo "## Static Inspection"
echo

lockfile="none"
if [[ -f package-lock.json ]]; then
  lockfile="package-lock.json"
elif [[ -f pnpm-lock.yaml ]]; then
  lockfile="pnpm-lock.yaml"
elif [[ -f yarn.lock ]]; then
  lockfile="yarn.lock"
fi

if [[ "$lockfile" != "none" ]]; then
  add_pass "Lockfile present: $lockfile."
else
  add_warn "No lockfile found at repo root."
fi

if [[ -d node_modules ]]; then
  add_pass "\`node_modules/\` is present, so local dependencies appear installed."
else
  add_warn "\`node_modules/\` is missing, so install state is incomplete or external to this checkout."
fi

if has_pkg_script lint; then
  add_pass "Repo defines a \`lint\` script."
else
  add_warn "Repo does not define a \`lint\` script."
fi

if has_pkg_script build; then
  add_pass "Repo defines a \`build\` script."
else
  add_warn "Repo does not define a \`build\` script."
fi

if [[ -f tsconfig.json ]] && node -e "const p=require('./package.json'); process.exit((p.devDependencies&&p.devDependencies.typescript)||(p.dependencies&&p.dependencies.typescript)?0:1)"; then
  add_pass "TypeScript config and dependency are present."
else
  add_warn "TypeScript check surface is incomplete or missing."
fi

load_array_from_command TEST_SCRIPTS find_test_scripts
if [[ ${#TEST_SCRIPTS[@]} -eq 0 ]]; then
  add_warn "No repo-defined test script was found."
elif [[ ${#TEST_SCRIPTS[@]} -eq 1 ]]; then
  add_pass "One repo-defined test script is available: \`${TEST_SCRIPTS[0]}\`."
else
  add_warn "Multiple test scripts are defined (\`${TEST_SCRIPTS[*]}\`); automatic selection may be ambiguous."
fi

if [[ -f tsconfig.json ]]; then
  if rg -q "from ['\"]@/" src --glob '*.ts' --glob '*.tsx'; then
    if rg -q '"@/\*"' tsconfig.json; then
      add_pass "Path alias imports (\`@/\`) are in use and tsconfig defines the matching path mapping."
    else
      add_fail "Path alias imports (\`@/\`) are in use but tsconfig does not define a matching path mapping."
    fi
  fi
fi

if [[ -f next.config.ts ]] && [[ -f eslint.config.mjs ]]; then
  version_check="$(node - <<'EOF'
const p=require('./package.json');
function major(v){const m=String(v||'').match(/\d+/); return m ? m[0] : '';}
const next=p.dependencies?.next;
const react=p.dependencies?.react;
const reactDom=p.dependencies?.['react-dom'];
const eslintNext=p.devDependencies?.['eslint-config-next'];
const results=[];
if (react && reactDom && major(react) === major(reactDom)) {
  results.push('PASS: react and react-dom major versions align');
} else if (react || reactDom) {
  results.push('FAIL: react and react-dom major versions do not align');
}
if (next && eslintNext && major(next) === major(eslintNext)) {
  results.push('PASS: next and eslint-config-next major versions align');
} else if (next || eslintNext) {
  results.push('WARN: next and eslint-config-next major versions may be misaligned');
}
console.log(results.join('\n'));
EOF
)"
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    case "$line" in
      PASS:*) add_pass "${line#PASS: }." ;;
      FAIL:*) add_fail "${line#FAIL: }." ;;
      WARN:*) add_warn "${line#WARN: }." ;;
    esac
  done <<< "$version_check"
fi

load_array_from_command REFERENCED_ENVS env_refs
load_array_from_command LOCAL_ENVS env_file_keys
if [[ ${#REFERENCED_ENVS[@]} -gt 0 ]]; then
  add_pass "Environment variable references were discovered and inspected by name only."
fi
for env_name in "${REFERENCED_ENVS[@]}"; do
  found=0
  for local_env in "${LOCAL_ENVS[@]}"; do
    if [[ "$env_name" == "$local_env" ]]; then
      found=1
      break
    fi
  done
  if [[ $found -eq 0 ]]; then
    add_warn "Referenced env var \`$env_name\` is not present in \`.env.local\`."
  fi
done

if [[ -f drizzle.config.ts ]] || [[ -d src/lib/db ]]; then
  if printf '%s\n' "${REFERENCED_ENVS[@]}" | rg -q '^DATABASE_URL$'; then
    add_pass "Database integration is present and \`DATABASE_URL\` is referenced by the repo."
  else
    add_warn "Database integration files exist, but no \`DATABASE_URL\` reference was found during static inspection."
  fi
fi

if [[ -f sanity.config.ts ]] || [[ -d src/lib/sanity ]]; then
  if printf '%s\n' "${REFERENCED_ENVS[@]}" | rg -q '^NEXT_PUBLIC_SANITY_PROJECT_ID$' && printf '%s\n' "${REFERENCED_ENVS[@]}" | rg -q '^NEXT_PUBLIC_SANITY_DATASET$'; then
    add_pass "Sanity integration is present and core Sanity env vars are referenced."
  else
    add_warn "Sanity integration files exist, but the expected core Sanity env refs were not all found."
  fi
fi

if [[ -f src/middleware.ts ]] && rg -q '@clerk/nextjs' package.json src/middleware.ts; then
  add_pass "Auth integration surface is present via Clerk dependency and middleware."
fi

if [[ "$level" == "quick" || "$level" == "standard" || "$level" == "full" ]]; then
  if has_pkg_script lint; then
    run_check "Lint" "The repo-defined lint command completed successfully." npm run lint
  else
    CHECK_RESULTS+=("\`npm run lint\`: skipped")
  fi
fi

if [[ "$level" == "standard" || "$level" == "full" ]]; then
  if [[ -f tsconfig.json ]]; then
    run_check "Typecheck" "TypeScript completed without reported type or import resolution errors." npx tsc --noEmit
  else
    CHECK_RESULTS+=("\`npx tsc --noEmit\`: skipped")
  fi
fi

if [[ "$level" == "standard" || "$level" == "full" ]]; then
  if [[ ${#TEST_SCRIPTS[@]} -eq 1 ]]; then
    run_check "Tests" "The single repo-defined test command completed successfully." npm run "${TEST_SCRIPTS[0]}"
  elif [[ ${#TEST_SCRIPTS[@]} -gt 1 ]]; then
    CHECK_RESULTS+=("\`npm run <test-script>\`: skipped")
  else
    CHECK_RESULTS+=("\`npm run test\`: skipped")
  fi
fi

if [[ "$level" == "full" ]]; then
  if has_pkg_script build; then
    run_check "Build" "The repo-defined build completed successfully." npm run build
  else
    CHECK_RESULTS+=("\`npm run build\`: skipped")
  fi
fi

echo "## PASS"
echo
print_list_or_none "No pass conditions recorded." "${PASS_ITEMS[@]}"
echo

echo "## FAIL"
echo
print_list_or_none "No hard failures recorded." "${FAIL_ITEMS[@]}"
echo

echo "## WARN"
echo
print_list_or_none "No warnings recorded." "${WARN_ITEMS[@]}"
echo

echo "## Checks Run"
echo
print_list_or_none "No commands executed." "${CHECK_RESULTS[@]}"
echo

echo "## Summary"
echo
echo "- Pass items: $passes"
echo "- Fail items: $failures"
echo "- Warn items: $warns"

exit "$failures"
