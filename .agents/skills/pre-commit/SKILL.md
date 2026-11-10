---
name: pre-commit
description: >-
  Executes the mandatory local pre-commit verification gate before staging and committing changes.
  Use immediately before running git commit to verify TypeScript, unit tests, e2e tests, and build status.
---

# Pre-Commit Verification Workflow (pre-commit)

Guarantees that no broken builds, type errors, or untested regressions are committed to Git.

## Execution Lifecycle

### 1. UNDERSTAND

- Identify changes made during the current development turn.

### 2. INSPECT

- Run `git status` to verify modified and untracked files.
- Ensure no unintended files (`.env`, `dist/`, `.next/`, scratch files) are present.

### 3. PLAN

- Execute the 4 mandatory verification commands in sequence.

### 4. IMPLEMENT (EXECUTE GATES)

```bash
# Gate 1: Typecheck all monorepo packages
pnpm typecheck

# Gate 2: Run all unit and service tests
pnpm test

# Gate 3: Run live API E2E tests
pnpm --filter @handloom/api test:e2e

# Gate 4: Run production build
pnpm build
```

### 5. TEST

- Verify all 4 gates exit with code 0.
- If any command fails, halt immediately and resolve the issue before proceeding.

### 6. REVIEW

- Run `git diff` to review all staged lines.
- Verify commit message follows Conventional Commits format (`feat`, `fix`, `docs`, `test`, `chore`).

### 7. REPORT

- Report all passed gates, test counts, build duration, and confirm readiness for `git commit` and `git push`.
