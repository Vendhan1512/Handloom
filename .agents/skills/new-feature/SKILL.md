---
name: new-feature
description: >-
  Orchestrates the end-to-end implementation of a new handloom business feature across the monorepo.
  Use when building domain capabilities such as catalog specifications, yarn inventory, or wage workflows.
---

# New Feature Implementation Workflow (new-feature)

Guides the phased implementation of a new domain capability in the Handloom platform.

## Execution Lifecycle

### 1. UNDERSTAND

- Analyze requirements, business domain context (e.g., silk count, reed/pick spec, weaver wage formula), and non-functional constraints.

### 2. INSPECT

- Examine related modules, schema models, and exported interfaces in `@handloom/types`.
- Check active git branch and ensure working tree is clean.

### 3. PLAN

- Detail file modifications:
  - Database schema models and migrations (if needed).
  - Shared domain types and DTO interfaces.
  - Backend controller, service, and DTOs.
  - Frontend components and TanStack Query hooks.
  - Unit and end-to-end test suites.

### 4. IMPLEMENT

- Make surgical, targeted code modifications.
- Enforce strict typing (`strict: true`), Decimal arithmetic for money and weight, and class-validator DTOs.
- Require human approval before any destructive schema modification or production configuration change.

### 5. TEST

- Run local quality gate commands:
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm --filter @handloom/api test:e2e`
  - `pnpm build`

### 6. REVIEW

- Inspect line diffs via `git status` and `git diff`. Verify no unverified artifacts or credentials are staged.

### 7. REPORT

- Output structured completion report: Modified files, executed tests, actual command outputs, and Git commit metadata.
