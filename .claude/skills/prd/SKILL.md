---
name: prd
description: I create a PRD (Product Requirements Document) for a feature, following the project’s standard structure; I use this whenever I need to outline the requirements for a new feature before it’s implemented.
---

# PRD generator

Create a PRD (Product Requirements Document) for the following feature: $ARGUMENTS

Save the result to a file named 'docs/prd-$ARGUMENTS.md' (use an English translation and kebab-case)

If the 'docs' directory does not exist, create it

## Document structure

# PRD: {Feature Name}

**Date**: {Current Date}
**Status**: Draft

## Objective

One or two sentences explaining what the feature is and why the user needs it.

## User Scenarios

- User {action} -> {Result}

## In Scope

A specific list of what is included in the feature.

## Out of Scope

What is explicitly not being addressed in this iteration.

## Technical Constraints

Known limitations that must be taken into account.

## Definition of Done (Acceptance Criteria)

- [ ] Criterion 1
- [ ] Criterion 2

## Guidelines

- Be specific—no fluff.
- Acceptance criteria must be verifiable.
- Do not describe *how* to implement it—focus only on *what* is needed and *why*.
- If the description is too brief, ask clarifying questions to ensure a full understanding before creating the document.
