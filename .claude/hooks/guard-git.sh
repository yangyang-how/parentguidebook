#!/bin/bash
# Guard git commit and push operations.
# Called by Claude Code PreToolUse hook on all Bash commands.
# Reads tool input JSON from stdin, checks if it's a git commit/push,
# and blocks if on main or on a branch with a merged PR.
#
# Exit codes:
#   0 = allow
#   2 = block (Claude Code PreToolUse convention)

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)

# If not a bash command or no command field, allow
if [ -z "$COMMAND" ]; then
  exit 0
fi

# Only guard git commit and git push
IS_COMMIT=false
IS_PUSH=false
if echo "$COMMAND" | grep -qE '^\s*git\s+commit'; then
  IS_COMMIT=true
elif echo "$COMMAND" | grep -qE '^\s*git\s+push'; then
  IS_PUSH=true
elif echo "$COMMAND" | grep -qE 'git\s+commit'; then
  # Also catch chained commands like "git add . && git commit ..."
  IS_COMMIT=true
elif echo "$COMMAND" | grep -qE 'git\s+push'; then
  IS_PUSH=true
fi

# If not a git commit or push, allow
if ! $IS_COMMIT && ! $IS_PUSH; then
  exit 0
fi

# --- Guard 1: Block commits/pushes on main/master ---
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
  if $IS_COMMIT; then
    echo "BLOCKED: Do not commit directly to $BRANCH. Create a feature branch first." >&2
  else
    echo "BLOCKED: Do not push directly to $BRANCH. Use a PR." >&2
  fi
  exit 2
fi

# --- Guard 2: Block commits/pushes on branches with merged PRs ---
MERGED=$(gh pr list --state merged --head "$BRANCH" --json number --jq 'length' 2>/dev/null)

# Fail closed: if we can't check, block
if [ -z "$MERGED" ]; then
  echo "BLOCKED: Could not verify if branch '$BRANCH' has a merged PR. Check gh auth." >&2
  exit 2
fi

if [ "$MERGED" -gt 0 ]; then
  echo "BLOCKED: Branch '$BRANCH' already has a merged PR. Create a new branch:" >&2
  echo "  git checkout main && git pull && git checkout -b new-branch-name" >&2
  exit 2
fi

# All checks passed
exit 0
