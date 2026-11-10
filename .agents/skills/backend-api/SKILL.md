---
name: backend-api
description: >-
  Guides the creation and extension of NestJS REST API modules, controllers, services, and DTOs.
  Use when creating backend endpoints, implementing business services, or configuring OpenAPI documentation.
---

# Backend API Implementation Workflow (backend-api)

Guides the creation and extension of NestJS domain modules in `apps/api`.

## Execution Lifecycle

### 1. UNDERSTAND

- Define endpoint contracts: HTTP methods, route paths, request payloads, response envelopes, and role requirements.

### 2. INSPECT

- Inspect `apps/api/src/modules/` for established controller and service patterns.
- Verify shared domain types in `packages/types/src/domain.ts`.

### 3. PLAN

- Define class-validator DTOs with Swagger annotations.
- Plan service business logic, transaction boundaries (`prisma.$transaction`), and audit log emissions.
- Outline controller endpoints and unit test scenarios.

### 4. IMPLEMENT

- Create module files:
  - `dto/create-<entity>.dto.ts`
  - `<domain>.service.ts`
  - `<domain>.controller.ts`
  - `<domain>.module.ts`
- Guard all mutating endpoints with `JwtAuthGuard` and `RolesGuard`.
- Scope all database operations to `user.tenantId` using `withTenantContext`.

### 5. TEST

- Write unit tests (`<domain>.service.spec.ts`, `<domain>.controller.spec.ts`).
- Run `pnpm --filter @handloom/api test`.
- Run live e2e tests via Supertest (`pnpm --filter @handloom/api test:e2e`).

### 6. REVIEW

- Check `git diff` for adherence to API standards, error envelope consistency, and logging security.

### 7. REPORT

- Document new endpoints, request/response examples, and test execution results.
