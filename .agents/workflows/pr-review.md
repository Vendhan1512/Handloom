# Workflow: Pull Request Review (pr-review)

Evaluates pull requests and branch diffs against the Handloom Quality Gates.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Read PR title, description, linked task ID, and intended business scope.
2. **INSPECT:** Inspect `git diff develop...HEAD` (or `origin/main...HEAD`). Check all modified files.
3. **PLAN:** Review against 10 Code Review Criteria in `docs/CODE_REVIEW.md`.
4. **IMPLEMENT:** Provide constructive line-level feedback (`BLOCKER`, `WARNING`, `SUGGESTION`, `PRAISE`).
5. **TEST:** Verify PR branch passes `pnpm typecheck`, `pnpm test`, and `pnpm build` locally.
6. **REVIEW:** Check Conventional Commits and verify zero committed secrets or artifacts.
7. **REPORT:** Deliver PR decision (`APPROVE`, `REQUEST_CHANGES`, `COMMENT`) and action items.
