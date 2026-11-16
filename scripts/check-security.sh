#!/usr/bin/env bash
# Security gate: the rules of SECURITY_RULES.md that a machine can check, on every push ("the gate", section 11).
# The same file in every Clafina repository; what differs is .security-rules.json (this language's patterns).
#   scripts/check-security.sh            fails on a violation the baseline does not list (exit 1), on a baseline
#                                        that gained an entry against the base (exit 1), on a secret in the pushed
#                                        lines (exit 1), on a failed dependency audit (exit 1), on an expired
#                                        exception (exit 1); and on a run that analysed too little, a rule whose
#                                        paths match no file, or a missing tool (exit 2)
#   scripts/check-security.sh --full     also runs the dependency audit when no lockfile changed (CI does this)
#   scripts/check-security.sh --ratchet  only the baseline-may-not-grow check
#   scripts/check-security.sh --shrink   after fixing violations: rewrite the baseline from today's tree;
#                                        refused if it would gain any entry
#   scripts/check-security.sh --init     once, in the commit that brings the gate to a repository: write the
#                                        baseline from today's tree. Where the base already has the gate, it only
#                                        adds the entries of rules the base's rules file does not have (a new rule
#                                        brings its old violations once); every other entry stays as it was
# Runs from: the pre-push hook, the repo's lint command, and CI. The baseline only ever shrinks.
# Never bless a new violation, never push with --no-verify.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
DEFAULT_BRANCH=master
# shellcheck disable=SC1091
[ -f ci/repo.env ] && . ci/repo.env
RULES="${SECURITY_RULES:-.security-rules.json}"
BASELINE="${SECURITY_BASELINE:-.security-baseline.json}"
EXCEPTIONS="${SECURITY_EXCEPTIONS:-.security-exceptions.json}"
MAX_EXCEPTION_DAYS=30
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
command -v jq >/dev/null || { echo "security: jq is required" >&2; exit 2; }
[ -f "$RULES" ] || { echo "security: $RULES is missing: a repository without rules is not checked" >&2; exit 2; }
jq -e . "$RULES" >/dev/null 2>&1 || { echo "security: $RULES is not valid JSON" >&2; exit 2; }

KEY='def key: "\(.rule)|\(.file)|\(.text)|\(.n)";'

# The base this push is compared with: where the branch left the default branch, or the previous commit.
base_ref() {
  local base; base="$(git merge-base HEAD "origin/$DEFAULT_BRANCH" 2>/dev/null || true)"
  if [ -z "$base" ] || [ "$base" = "$(git rev-parse HEAD)" ]; then base="$(git rev-parse --verify -q HEAD~1 2>/dev/null || true)"; fi
  printf '%s' "$base"
}

# The names of the pattern rules the base's rules file has (a JSON array in $TMP/base-rules.json).
base_rules() {
  git show "$1:$RULES" 2>/dev/null | jq '[.rules[]?.name]' > "$TMP/base-rules.json" 2>/dev/null || echo '[]' > "$TMP/base-rules.json"
  [ -s "$TMP/base-rules.json" ] || echo '[]' > "$TMP/base-rules.json"
}

# Every baseline entry must already be in the base's baseline: entries can go, never come (except for a rule the
# base did not have, whose old violations come once, in the commit that adds the rule).
ratchet() {
  local base; base="$(base_ref)"
  [ -n "$base" ] || { echo "security: no base commit to compare the baseline with" >&2; return 1; }
  if ! git cat-file -e "$base:scripts/check-security.sh" 2>/dev/null; then
    echo "security: base ${base:0:8} predates the gate; this is the one-time bootstrap"; return 0
  fi
  git show "$base:$BASELINE" > "$TMP/base.json" 2>/dev/null || echo '[]' > "$TMP/base.json"
  base_rules "$base"
  local grew
  # An entry may be new only for a rule the base did not have: that rule's old violations, brought once.
  grew="$(jq -rn --slurpfile b "$TMP/base.json" --slurpfile n "$1" --slurpfile r "$TMP/base-rules.json" "$KEY"'
    ($b[0] | map(key) | INDEX(.)) as $old | ($r[0] | INDEX(.)) as $had
    | $n[0][] | select($old[key] == null and $had[.rule] != null) | "  \(key)"')"
  if [ -n "$grew" ]; then
    printf 'security: FAILED, the baseline gained entries against %s. It may only shrink:\n%s\n' "${base:0:8}" "$grew" >&2
    echo "Fix the code instead; the rules are in SECURITY_RULES.md." >&2
    return 1
  fi
}

# Pattern rules. Each: {name, rule, why, pattern (ERE), paths [glob pathspecs], exclude [glob pathspecs]?, allow (ERE)?}.
# A hit is a tracked line that matches pattern and not allow. Identity: rule, file, the trimmed line, and which
# of the identical lines in that file it is (line numbers move; text does not).
scan() {
  : > "$TMP/hits.tsv"; : > "$TMP/stale"; local analysed=0 i count
  count="$(jq '.rules | length' "$RULES")"
  for ((i = 0; i < count; i++)); do
    local name pattern allow; local -a specs=()
    name="$(jq -r ".rules[$i].name" "$RULES")"
    pattern="$(jq -r ".rules[$i].pattern" "$RULES")"
    allow="$(jq -r ".rules[$i].allow // \"\"" "$RULES")"
    # Glob pathspecs: "**/" is zero or more folders, so src/**/*.ts includes src/main.ts (a plain pathspec needs a
    # folder there and skipped it), and "*" stays inside one folder.
    while IFS= read -r p; do specs+=(":(glob)$p"); done < <(jq -r ".rules[$i].paths[]" "$RULES")
    while IFS= read -r p; do specs+=(":(glob,exclude)$p"); done < <(jq -r ".rules[$i].exclude // [] | .[]" "$RULES")
    # The gate's own files name the patterns they look for.
    specs+=(":(exclude)$RULES" ":(exclude)$BASELINE" ":(exclude)$EXCEPTIONS" ":(exclude)scripts/check-security.sh")
    # Counted with git grep, not git ls-files: ls-files drops or ignores exclude pathspecs that do not share the
    # include's leading folder (git 2.50: "src/modules :(exclude)zz" listed nothing), while grep applies them.
    local files; files="$(git grep -lI -e '' -- "${specs[@]}" 2>/dev/null | wc -l | tr -d ' ')"
    if [ "$files" -eq 0 ]; then echo "$name" >> "$TMP/stale"; continue; fi
    analysed=$((analysed + files))
    git grep -nIE -e "$pattern" -- "${specs[@]}" 2>/dev/null | while IFS= read -r hit; do
      local file rest text; file="${hit%%:*}"; rest="${hit#*:}"; text="${rest#*:}"
      if [ -n "$allow" ] && printf '%s' "$text" | grep -qE -e "$allow"; then continue; fi
      text="$(printf '%s' "$text" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//' | cut -c1-200)"
      printf '%s\t%s\t%s\n' "$name" "$file" "$text"
    done >> "$TMP/hits.tsv" || true
  done
  echo "$analysed" > "$TMP/analysed"
  jq -Rn '[inputs | split("\t") | {rule: .[0], file: .[1], text: (.[2:] | join("\t"))}]
    | group_by([.rule, .file, .text]) | map(to_entries | map(.value + {n: (.key + 1)})) | add // []
    | sort_by([.rule, .file, .text, .n])' "$TMP/hits.tsv" > "$TMP/now.json"
}

# Files that must say something: {name, rule, why, file, pattern (ERE)}; "file" may be a glob pathspec matching several.
required() {
  local i count failed=0; count="$(jq '.require // [] | length' "$RULES")"
  for ((i = 0; i < count; i++)); do
    local name file pattern why; name="$(jq -r ".require[$i].name" "$RULES")"; file="$(jq -r ".require[$i].file" "$RULES")"
    pattern="$(jq -r ".require[$i].pattern" "$RULES")"; why="$(jq -r ".require[$i].why // \"\"" "$RULES")"
    local found=0 f
    while IFS= read -r f; do
      found=1
      grep -qE -e "$pattern" "$f" || { printf '  %s: %s must match /%s/ (%s)\n' "$name" "$f" "$pattern" "$why" >&2; failed=1; }
    done < <(git ls-files -- ":(glob)$file")
    [ "$found" -eq 1 ] || { printf '  %s: no tracked file matches %s (%s)\n' "$name" "$file" "$why" >&2; failed=1; }
  done
  return "$failed"
}

# Secrets in the lines this push adds. Formats that are never a placeholder; the full scan (gitleaks, trufflehog)
# runs in CI. Not ratcheted and not excusable: a real key that reached a commit is rotated, then removed.
SECRET_PATTERNS='-----BEGIN ([A-Z]+ )?PRIVATE KEY-----|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk_live_[A-Za-z0-9]{20,}|rk_live_[A-Za-z0-9]{20,}|sk-ant-[A-Za-z0-9_-]{40,}|AIza[0-9A-Za-z_-]{35}|npm_[A-Za-z0-9]{36}|glpat-[A-Za-z0-9_-]{20,}|dop_v1_[a-f0-9]{64}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}'
secrets() {
  local base; base="$(base_ref)"; [ -n "$base" ] || return 0
  local found
  found="$(git diff --no-color -U0 "$base" HEAD -- . ":(exclude)scripts/check-security.sh" 2>/dev/null \
    | grep -E '^\+[^+]' | grep -nE -e "$SECRET_PATTERNS" | sed -E 's/^([0-9]+):\+?(.{0,24}).*/  added line \1: \2…/' || true)"
  [ -z "$found" ] && return 0
  printf 'security: FAILED, this push adds what looks like a live credential (rule 3.2):\n%s\n' "$found" >&2
  echo "Rotate it now (it is in a commit), then remove it from the branch history before pushing." >&2
  return 1
}

# Exceptions: [{rule, file, reason, owner, expires: "YYYY-MM-DD"}]. Each excuses that rule in that file until it
# expires. An expired one, one with no reason or owner, or one longer than MAX_EXCEPTION_DAYS fails the gate.
exceptions() {
  [ -f "$EXCEPTIONS" ] || { echo '[]' > "$TMP/exc.json"; return 0; }
  jq -e 'type == "array"' "$EXCEPTIONS" >/dev/null 2>&1 || { echo "security: $EXCEPTIONS must be a JSON array" >&2; return 1; }
  local today limit bad; today="$(date -u +%Y-%m-%d)"
  limit="$(date -u -v+${MAX_EXCEPTION_DAYS}d +%Y-%m-%d 2>/dev/null || date -u -d "+${MAX_EXCEPTION_DAYS} days" +%Y-%m-%d)"
  bad="$(jq -r --arg today "$today" --arg limit "$limit" '.[]
    | select((.reason // "") == "" or (.owner // "") == "" or (.expires // "") == "" or .expires < $today or .expires > $limit)
    | "  \(.rule) in \(.file): expires \(.expires // "never") (needs a reason, an owner, and an expiry from \($today) to \($limit))"' "$EXCEPTIONS")"
  if [ -n "$bad" ]; then printf 'security: FAILED, exceptions that have expired or are not valid:\n%s\n' "$bad" >&2; return 1; fi
  cp "$EXCEPTIONS" "$TMP/exc.json"
}

# Dependency audit: the commands in rules.audit, when a lockfile changed in this push, or always with --full.
audit() {
  local count; count="$(jq '.audit // [] | length' "$RULES")"; [ "$count" -gt 0 ] || return 0
  if [ "${1:-}" != full ]; then
    local base lock changed=0; base="$(base_ref)"
    while IFS= read -r lock; do
      [ -n "$base" ] && git diff --quiet "$base" HEAD -- "$lock" 2>/dev/null || changed=1
    done < <(jq -r '.lockfiles // [] | .[]' "$RULES")
    [ "$changed" -eq 1 ] || { echo "security: no lockfile changed; dependency audit left to CI (--full)"; return 0; }
  fi
  local i cmd tool
  for ((i = 0; i < count; i++)); do
    cmd="$(jq -r ".audit[$i]" "$RULES")"; tool="${cmd%% *}"
    command -v "$tool" >/dev/null || { echo "security: '$tool' is required for the dependency audit (rule 5.5)" >&2; exit 2; }
    echo "security: $cmd"
    if ! bash -c "$cmd" > "$TMP/audit.log" 2>&1; then
      tail -25 "$TMP/audit.log" >&2
      echo "security: FAILED, the dependency audit found High or Critical issues, or could not run (rule 5.5)." >&2
      return 1
    fi
  done
}

case "${1:-}" in
  --ratchet) [ -f "$BASELINE" ] || echo '[]' > "$BASELINE"; ratchet "$BASELINE"; exit $? ;;
esac

scan
analysed="$(cat "$TMP/analysed")"; floor="$(jq -r '.min_files // 0' "$RULES")"
if [ -s "$TMP/stale" ]; then
  printf 'security: these rules match no tracked file; a rule that looks at nothing checks nothing:\n' >&2
  sed 's/^/  /' "$TMP/stale" >&2; exit 2
fi
if [ "$floor" -le 0 ] || [ "$analysed" -lt "$floor" ]; then
  echo "security: analysed $analysed files across the rules, fewer than the floor min_files=$floor in $RULES (a floor above 0 is required)" >&2; exit 2
fi

if [ "${1:-}" = --init ]; then
  base="$(base_ref)"
  if [ -n "$base" ] && git cat-file -e "$base:scripts/check-security.sh" 2>/dev/null; then
    # The gate is already here: keep the baseline, add only the old violations of rules the base did not have.
    base_rules "$base"; [ -f "$BASELINE" ] || echo '[]' > "$BASELINE"
    jq -n --slurpfile b "$BASELINE" --slurpfile n "$TMP/now.json" --slurpfile r "$TMP/base-rules.json" '
      ($r[0] | INDEX(.)) as $had
      | ($b[0] + [$n[0][] | select($had[.rule] == null)]) | unique_by([.rule, .file, .text, .n]) | sort_by([.rule, .file, .text, .n])' \
      > "$TMP/merged.json"
    added=$(( $(jq length "$TMP/merged.json") - $(jq length "$BASELINE") ))
    cp "$TMP/merged.json" "$BASELINE"
    echo "security: the gate is already here (base ${base:0:8}); added $added old violations of rules new against the base"; exit 0
  fi
  cp "$TMP/now.json" "$BASELINE"; echo "security: baseline written, $(jq length "$BASELINE") old violations to pay off"; exit 0
fi

if [ "${1:-}" = --shrink ]; then
  [ -f "$BASELINE" ] || echo '[]' > "$BASELINE"
  added="$(jq -rn --slurpfile b "$BASELINE" --slurpfile n "$TMP/now.json" "$KEY"'
    ($b[0] | map(key) | INDEX(.)) as $old | $n[0][] | select($old[key] == null) | "  \(key)"')"
  if [ -n "$added" ]; then printf 'security: refused, --shrink would add entries:\n%s\n' "$added" >&2; exit 1; fi
  cp "$TMP/now.json" "$BASELINE"; echo "security: baseline rewritten, $(jq length "$BASELINE") entries left"; exit 0
fi

[ -f "$BASELINE" ] || echo '[]' > "$BASELINE"
status=0
exceptions || status=1
ratchet "$BASELINE" || status=1
new="$(jq -rn --slurpfile b "$BASELINE" --slurpfile n "$TMP/now.json" --slurpfile e "$TMP/exc.json" --slurpfile r "$RULES" "$KEY"'
  ($b[0] | map(key) | INDEX(.)) as $old
  | ($r[0].rules | map({key: .name, value: .}) | from_entries) as $rule
  | $n[0][] | select($old[key] == null)
  | select(. as $v | ($e[0] // []) | any(.rule == $v.rule and .file == $v.file) | not)
  | "  \(.file): \(.text)\n      rule \($rule[.rule].rule // "?") \(.rule): \($rule[.rule].why // "")"' 2>/dev/null || true)"
if [ -n "$new" ]; then
  printf 'security: FAILED, new violations (SECURITY_RULES.md):\n%s\n' "$new" >&2; status=1
fi
if ! required 2> "$TMP/req.err"; then
  printf 'security: FAILED, required settings are missing:\n' >&2; cat "$TMP/req.err" >&2; status=1
fi
secrets || status=1
if [ "${1:-}" = --full ] || [ "${CI:-}" = true ]; then audit full || status=1; else audit || status=1; fi
if [ "$status" -ne 0 ]; then echo "security: push refused. Fix the code; do not bypass the gate." >&2; exit 1; fi
echo "security: ok ($analysed files analysed, $(jq length "$BASELINE") old violations still to pay off)"
