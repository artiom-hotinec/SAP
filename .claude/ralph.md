# Ralph Loop — Autonomous Work Guidelines

## How to Pick Up Issues

- Read the title, body, and definition of done (acceptance criteria).
- Verify that the specified branch already exists (if not, create it).
- Work exclusively within that branch—do not create new ones.

## Commit Naming

- Follow the conventions specified in the "skill commit" guidelines.

## Implementation Rules

- Follow TDD (Test-Driven Development): write tests first, then implement the code.
- Run the tests after every final change.
- If the tests remain "red" (failing) after 5 attempts, stop and leave a comment on the issue describing the problem.

## Completion Rules

- Ensure all tests are "green" (passing).
- Verify that all requirements have been met.
- Run `skill /review` to initiate a code review.
- Close the issue.
- Do not create a Pull Request (PR) and do not push; the driver (`node .claude/ralph-start.js`) pushes, opens the PR and runs the review once the milestone has no open issues.
- Do one issue per session, then stop. The driver starts the next session.
