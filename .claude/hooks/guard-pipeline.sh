#!/usr/bin/env bash
# Pipeline guard hook — enforces content pipeline prerequisites.
# Runs as PreToolUse on Write.
#
# Rules:
#   1. Writing to articles/en/*.md → research file must exist
#   2. Writing to articles/zh/*.md → EN counterpart must exist

set -uo pipefail

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only guard article writes
case "$FILE_PATH" in
  */src/content/articles/en/*.md) ;;
  */src/content/articles/zh/*.md) ;;
  *) exit 0 ;;
esac

FILENAME=$(basename "$FILE_PATH")
PROJECT_ROOT=$(echo "$FILE_PATH" | sed 's|/src/content/articles/.*||')

# --- Rule 1: EN article needs research file ---
if echo "$FILE_PATH" | grep -q '/articles/en/'; then
  # Extract domain and stage from the file content being written
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')

  if [ -z "$CONTENT" ]; then
    exit 0  # Edit tool, not Write — content not in input, skip
  fi

  DOMAIN=$(echo "$CONTENT" | grep -m1 '^domain:' | sed 's/domain:[[:space:]]*"*\([^"]*\)"*/\1/')
  STAGE=$(echo "$CONTENT" | grep -m1 '^stage:' | sed 's/stage:[[:space:]]*"*\([^"]*\)"*/\1/')
  IS_OVERVIEW=$(echo "$CONTENT" | grep -m1 '^is_overview:' | sed 's/is_overview:[[:space:]]*//')

  if [ -z "$DOMAIN" ]; then
    exit 0  # Can't determine domain, skip guard
  fi

  if [ "$IS_OVERVIEW" = "true" ]; then
    RESEARCH_FILE="$PROJECT_ROOT/src/content/research/$DOMAIN/overview.md"
  elif [ -n "$STAGE" ]; then
    RESEARCH_FILE="$PROJECT_ROOT/src/content/research/$DOMAIN/$STAGE.md"
  else
    exit 0  # No stage or overview, skip
  fi

  if [ ! -f "$RESEARCH_FILE" ]; then
    cat <<EOF
{
  "decision": "block",
  "reason": "PIPELINE GATE: No research file found at $RESEARCH_FILE. Every article must have research before writing. See PIPELINE.md Stage 0."
}
EOF
    exit 0
  fi
fi

# --- Rule 2: ZH article needs EN counterpart ---
if echo "$FILE_PATH" | grep -q '/articles/zh/'; then
  EN_FILE="$PROJECT_ROOT/src/content/articles/en/$FILENAME"
  if [ ! -f "$EN_FILE" ]; then
    cat <<EOF
{
  "decision": "block",
  "reason": "PIPELINE GATE: No English article found at $EN_FILE. Write the EN article first, then translate. See PIPELINE.md Stage 1."
}
EOF
    exit 0
  fi
fi

exit 0
