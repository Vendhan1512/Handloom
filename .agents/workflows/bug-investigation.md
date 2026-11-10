# Workflow: Bug Investigation (bug-investigation)

Evidence-based approach to debugging and fixing defects across the platform.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Read error trace, symptom description, reproduction steps, and expected behavior.
2. **INSPECT:** Inspect application logs, stack traces, and relevant source code files.
3. **PLAN:** Formulate root cause hypothesis. Design minimal reproduction test case.
4. **IMPLEMENT:** Write failing test reproducing the defect. Apply surgical fix.
5. **TEST:** Verify reproduction test passes. Run full test suite: `pnpm test` and `pnpm test:e2e`.
6. **REVIEW:** Inspect `git diff` to ensure fix is surgical and free of side effects.
7. **REPORT:** Detail root cause, reproduction test, resolution code, and verification results.
