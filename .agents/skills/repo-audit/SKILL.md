---
name: repo-audit
description: >-
  Executes a comprehensive, read-only architectural, security, and dependency audit of the Handloom repository.
  Use when analyzing project structure, assessing tech stack health, or validating alignment with business goals.
---

# Repository Audit Workflow (repo-audit)

Perform a comprehensive read-only audit of the Handloom Operations Management Platform without altering workspace files or executing destructive operations.

## Execution Lifecycle

### 1. UNDERSTAND

- Identify target audit scope: Monorepo structure, backend modules, frontend architecture, database schema, security boundaries, or test coverage.

### 2. INSPECT

- Read package manifests (`package.json`, `pnpm-workspace.yaml`, `turbo.json`).
- Inspect actual implementations in `apps/api/src/`, `apps/web/src/`, and `packages/database/prisma/schema.prisma`.
- Inspect Git branch and status (`git status`, `git log -n 5`).
- Verify installed vs. declared dependencies.

### 3. PLAN

- Formulate an audit checklist comparing existing code against the 1,000–10,000 concurrent user scalability target and multi-tenant isolation rules.

### 4. IMPLEMENT (READ-ONLY)

- Synthesize technical findings. Do not edit, delete, or generate code.
- Categorize each feature as `IMPLEMENTED`, `PLANNED`, or `UNVERIFIED`.

### 5. TEST

- Verify code health by running non-destructive checks:
  - `pnpm typecheck`
  - `pnpm test`

### 6. REVIEW

- Verify findings against physical source files. Ensure zero fabricated claims or assumed features.

### 7. REPORT

- Deliver structured audit report: Executive summary, verified architecture, implemented vs. planned features, security observations, and recommended next steps.
