#!/usr/bin/env bash
set -euo pipefail

REPO="${1:?Usage: $0 <owner/repo> <max_iterations_per_issue>}"
MAX_ITER="${2:?Usage: $0 <owner/repo> <max_iterations_per_issue>}"
LOG_DIR="./logs"

mkdir -p "$LOG_DIR"

echo "Ralph loop: $REPO | max $MAX_ITER iter/issue"

# Fetch all open issue numbers once, sorted ascending
mapfile -t ISSUE_NUMS < <(
  gh issue list --repo "$REPO" --state open --limit 100 \
    --json number --jq '.[].number' | sort -n
)

if [[ ${#ISSUE_NUMS[@]} -eq 0 ]]; then
  echo "No open issues. Done."
  exit 0
fi

for NUM in "${ISSUE_NUMS[@]}"; do
  # Re-check: may have been closed by a prior claude iteration
  STATE=$(gh issue view "$NUM" --repo "$REPO" --json state --jq '.state')
  if [[ "$STATE" == "CLOSED" ]]; then
    echo "Issue #$NUM already closed, skipping."
    continue
  fi

  TITLE=$(gh issue view "$NUM" --repo "$REPO" --json title --jq '.title')
  echo ""
  echo "━━━ Issue #$NUM: $TITLE ━━━"

  # HITL checkpoint
  if [[ "$TITLE" == *"HITL:"* ]]; then
    echo "HITL review required."
    echo "URL: https://github.com/$REPO/issues/$NUM"
    echo ""
    echo "Complete the review, then press Enter to continue..."
    read -r
    echo "Resuming..."
    continue
  fi

  # Inner iteration loop
  CLOSED=false
  for ((ITER = 1; ITER <= MAX_ITER; ITER++)); do
    echo "  [iter $ITER/$MAX_ITER] Issue #$NUM..."

    ISSUE_DATA=$(gh issue view "$NUM" --repo "$REPO" --json title,body)
    ISSUE_TITLE=$(echo "$ISSUE_DATA" | jq -r '.title')
    ISSUE_BODY=$(echo "$ISSUE_DATA" | jq -r '.body')

    PROMPT="You are an autonomous software engineer working on the GitHub repository '$REPO'.

  /tdd Implement the following GitHub issue completely. Submit a PR. CI must be green. When done, close it:
  gh issue close $NUM --repo $REPO

Issue #$NUM: $ISSUE_TITLE

$ISSUE_BODY"

    LOG_FILE="$LOG_DIR/issue-${NUM}-iter-${ITER}.log"

    # Run claude (non-interactive, fresh context each call)
    claude --print "$PROMPT" --dangerously-skip-permissions 2>&1 | tee "$LOG_FILE" || true

    # Check closure
    STATE=$(gh issue view "$NUM" --repo "$REPO" --json state --jq '.state')
    if [[ "$STATE" == "CLOSED" ]]; then
      echo "  Issue #$NUM closed."
      CLOSED=true
      break
    fi
  done

  if [[ "$CLOSED" == false ]]; then
    echo "  WARNING: Issue #$NUM not closed after $MAX_ITER iterations. Moving on."
  fi
done

echo ""
echo "Ralph loop complete."
