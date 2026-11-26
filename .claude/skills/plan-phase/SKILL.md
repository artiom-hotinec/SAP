---
name: plan-phase
description: Break down the PRD into implementation phases. Use this approach when you have a completed PRD and need to create a development plan consisting of independent phases.
---

# Plan Generator

Read the PRD from the file: $ARGUMENTS

Create an implementation plan and save it to the file 'docs/plan-$ARGUMENTS.md'

## Plan Structure:

# Plan: {Feature Name}

**PRD:** $ARGUMENTS
**Date:** {Current Date}

## Implementation Phases

### Phase 1: {Name}

**Goal:** What this phase delivers
**Impacts:** Backend / Frontend / Database
**Tasks:**

- [ ] Task 1
- [ ] Task 2

**Definition of Done:** Specific criterion

### Phase 2: {Name}

...

## Rules for Phasing:

- Each phase must yield a functional result.
- Phases should be independent; it should be possible to stop after any phase.
- The first phase should serve as a "tracer bullet" (a minimal end-to-end functional path).
- No more than five tasks per phase.
- Backend and frontend components for a single feature may span different phases.
- Each phase must include planned tests to cover the functionality implemented in that phase.

## Rules

- Read the PRD carefully; the plan must cover all "definition of done" criteria.
- Do not add tasks that are not included in the PRD.
- If the PRD is incomplete, ask for clarification before creating the plan.