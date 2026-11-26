---
name: issues
description: Creates GitHub issues and milestones from a plan file. Useful when you have a prepared plan with phases and need to set up a backlog on GitHub.
---

# Plan Generator

Read the plan from the file: $ARGUMENTS

For each phase, create a milestone and corresponding issues on GitHub using the `gh` CLI.

## Workflow

1. Read the plan file.
2. For each phase, create a milestone:
`gh api repos/:owner/:repo/milestones -f title="Phase N: Title"`

3. For each task within a phase, create an issue:
`gh issue create --title "..." --body "..." --label "..." --milestone "..."`

## Issue Format

**Title**: The task text from the plan (excluding brackets `[]`)
**Body**: The task description