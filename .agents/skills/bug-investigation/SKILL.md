---
name: bug-investigation
description: >-
  Guides the systematic triage, reproduction, root-cause analysis, and resolution of software bugs.
  Use when investigating failing tests, unexpected API errors, transaction deadlocks, or UI discrepancies.
---

# Bug Investigation Workflow (bug-investigation)

Provides an evidence-based approach to debugging and fixing issues across the Handloom platform.

## Execution Lifecycle

### 1. UNDERSTAND

- Read error trace, symptom description, reproduction steps, affected tenant, and expected behavior.

### 2. INSPECT

- Inspect relevant application logs, stack traces, and test output.
- Locate source code files implicated in the call stack.

### 3. PLAN

- Formulate hypothesis for root cause (e.g., race condition in stock decrement, missing null check, unhandled promise rejection).
- Plan a minimal reproduction test case.

### 4. IMPLEMENT

- Write a failing unit or integration test reproducing the exact defect.
- Apply surgical fix to resolve the root cause without side effects.
- Maintain documentation integrity and preserve existing comments.

### 5. TEST

- Run reproduction test to verify it passes.
- Run full test suite: `pnpm test`.
- Run e2e tests: `pnpm --filter @handloom/api test:e2e`.

### 6. REVIEW

- Inspect `git diff` to ensure fix is surgical and does not alter unrelated logic.

### 7. REPORT

- Detail root cause, reproduction test, resolution code, and verification results.
