---
name: test-generation
description: >-
  Guides the generation of rigorous unit, service integration, and Supertest end-to-end API test suites.
  Use when writing tests for new service methods, covering edge cases, or verifying transactional rollbacks.
---

# Test Generation Workflow (test-generation)

Generates meaningful, comprehensive automated test suites for the Handloom platform.

## Execution Lifecycle

### 1. UNDERSTAND

- Identify target module, service methods, mathematical edge cases, and boundary conditions.

### 2. INSPECT

- Inspect existing test patterns (e.g., `apps/api/src/modules/auth/auth.service.spec.ts`).
- Review DTO validation constraints and potential failure points.

### 3. PLAN

- Plan test scenarios:
  - Happy path (standard successful execution).
  - Validation failure (missing required fields, negative stock, invalid email).
  - Business rule violations (insufficient available yarn, unauthorized role).
  - Concurrency & race condition handling.

### 4. IMPLEMENT

- Write unit tests using Jest (`*.spec.ts`).
- Mock external dependencies (`prisma`, `logger`) cleanly without monkey-patching globals.
- Write Supertest live HTTP assertions in `apps/api/test/app.e2e-spec.ts`.

### 5. TEST

- Execute the newly generated tests:
  - `pnpm test`
  - `pnpm --filter @handloom/api test:e2e`
- Ensure all tests pass with 0 failures.

### 6. REVIEW

- Check test assertions for meaningful expectations (never use empty `expect(true).toBe(true)`).

### 7. REPORT

- Report number of test suites added, pass counts, code coverage metrics, and edge cases verified.
