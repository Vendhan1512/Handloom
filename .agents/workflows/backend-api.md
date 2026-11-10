# Workflow: Backend API Implementation (backend-api)

Guides creation and extension of NestJS domain modules in `apps/api`.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Define endpoint contracts, HTTP methods, payloads, envelopes, and role requirements.
2. **INSPECT:** Inspect `apps/api/src/modules/` and shared types in `packages/types/src/domain.ts`.
3. **PLAN:** Define class-validator DTOs, transactions (`prisma.$transaction`), and audit logs.
4. **IMPLEMENT:** Create DTOs, service, controller, and module. Guard with `JwtAuthGuard` and `RolesGuard`.
5. **TEST:** Write unit tests (`*.spec.ts`) and Supertest e2e tests (`apps/api/test/app.e2e-spec.ts`).
6. **REVIEW:** Check API standards, error envelope consistency, and logging security.
7. **REPORT:** Document endpoints, request/response examples, and test results.
