# Workflow: Test Generation (test-generation)

Generates automated unit, service integration, and Supertest end-to-end test suites.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Identify target module, service methods, mathematical edge cases, and boundaries.
2. **INSPECT:** Inspect existing test patterns and DTO validation constraints.
3. **PLAN:** Plan happy paths, validation failures, business rule rejections, and race conditions.
4. **IMPLEMENT:** Write Jest tests (`*.spec.ts`) and Supertest assertions in `test/app.e2e-spec.ts`.
5. **TEST:** Execute tests (`pnpm test`, `pnpm test:e2e`). Ensure 100% pass rate.
6. **REVIEW:** Check test assertions for meaningful expectations.
7. **REPORT:** Report test suites added, pass counts, code coverage, and edge cases verified.
