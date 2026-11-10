---
name: pr-review
description: >-
  Conducts an automated code review of a pull request or branch against Handloom engineering standards.
  Use when reviewing code changes prior to merging into develop or main branches.
---

# Pull Request Review Workflow (pr-review)

Evaluates pull requests and branch diffs against the Handloom Quality Gates.

## Execution Lifecycle

### 1. UNDERSTAND

- Read PR title, description, linked task ID, and intended business scope.

### 2. INSPECT

- Run `git log -n 5` and `git diff develop...HEAD` (or `origin/main...HEAD`).
- Check all modified, added, and deleted files.

### 3. PLAN

- Review against the 10 Code Review Criteria in `docs/CODE_REVIEW.md`:
  1. Correctness & Business Logic.
  2. Security & Input Validation.
  3. Multi-Tenant Scoping.
  4. Performance & Scalability.
  5. Concurrency & Transactions.
  6. Database Integrity.
  7. Error Handling & Envelopes.
  8. Automated Test Coverage.
  9. Maintainability & Clean Code.
  10. Documentation Integrity.

### 4. IMPLEMENT (REVIEW FEEDBACK)

- Annotate code diffs with line-level constructive comments.
- Classify feedback: `BLOCKER`, `WARNING`, `SUGGESTION`, `PRAISE`.

### 5. TEST

- Verify PR branch passes all automated checks locally:
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm build`

### 6. REVIEW

- Check that PR adheres to Conventional Commits and contains zero committed credentials or build artifacts.

### 7. REPORT

- Deliver structured PR Review Summary: Decision (`APPROVE`, `REQUEST_CHANGES`, `COMMENT`), checklist audit, and action items.
