# Workflow: New Feature Implementation (new-feature)

Guides end-to-end implementation of a new handloom business feature.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Analyze requirements, business domain context, and non-functional constraints.
2. **INSPECT:** Inspect related modules, schema models, and exported interfaces in `@handloom/types`.
3. **PLAN:** Detail file modifications (schema, types, DTOs, services, controllers, UI, tests).
4. **IMPLEMENT:** Surgical code changes. Enforce strict typing, Decimal precision, and class-validator DTOs.
5. **TEST:** Run `pnpm typecheck`, `pnpm test`, `pnpm --filter @handloom/api test:e2e`, and `pnpm build`.
6. **REVIEW:** Inspect line diffs via `git status` and `git diff`.
7. **REPORT:** Output structured completion report: Modified files, executed tests, and Git metadata.
