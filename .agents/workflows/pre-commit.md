# Workflow: Pre-Commit Verification (pre-commit)

Guarantees no broken builds, type errors, or untested regressions are committed to Git.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Identify changes made during current development turn.
2. **INSPECT:** Run `git status` to verify modified and untracked files.
3. **PLAN:** Execute the 4 mandatory verification commands in sequence.
4. **IMPLEMENT (GATES):**
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm --filter @handloom/api test:e2e`
   - `pnpm build`
5. **TEST:** Verify all 4 gates exit with code 0. Halt immediately on failure.
6. **REVIEW:** Run `git diff` to review staged lines. Check Conventional Commit format.
7. **REPORT:** Report passed gates, test counts, build duration, and confirm commit readiness.
