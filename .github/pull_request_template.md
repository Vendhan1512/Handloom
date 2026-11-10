## Description & Summary of Changes

<!-- Provide a clear, concise explanation of the changes made and the problem being solved. -->

## Related Task or Issue

- Closes Task/Issue: #<!-- e.g. TASK-8.1.5 -->

## Business Requirements Addressed

<!-- Reference relevant handloom operational rules from docs/BUSINESS_RULES.md -->

- [ ] Material custody and inventory tracking (Yarn lots, winding, warping, stock ledger)
- [ ] Production and loom allocations (Job cards, cut-piece tracking, web progress)
- [ ] Quality inspection and defect management (Grading, half-rate damage policy)
- [ ] Wage accounting and advance recovery (Piece rates, weekly settlements)
- [ ] Tenant administration and security governance
- [ ] Infrastructure, CI/CD, or documentation

## Implementation Details

<!-- Detail the key architectural and code changes across apps/ and packages/ -->

- **Packages Affected:**
  - [ ] `apps/web` (Next.js 15 frontend)
  - [ ] `apps/api` (NestJS 11 backend)
  - [ ] `packages/database` (Prisma schema & migrations)
  - [ ] `packages/types` (Shared domain interfaces)
  - [ ] `packages/logger` (Pino logging)
  - [ ] `packages/config` (Shared configs)
  - [ ] `.github` / `docs` (DevOps & documentation)

## Impact Assessments

### 1. Database & Migration Impact

- [ ] **No schema changes**
- [ ] **Schema updated:** New migration included via `prisma migrate dev`
- [ ] **Non-destructive:** Follows Expand-and-Contract (no drops of active columns/tables)
- [ ] **Decimal types verified:** Exact precision used for weights (`Decimal(12, 3)`) and currency (`Decimal(14, 2)`)

### 2. API Compatibility Impact

- [ ] **No breaking changes:** Backward-compatible with existing API consumers
- [ ] **New endpoints added:** Documented with Swagger / OpenAPI decorators
- [ ] **DTO validation enforced:** Whitelist validation with class-validator
- [ ] **Response envelopes:** Standardized via `TransformInterceptor` and `HttpExceptionFilter`

### 3. Security & Authorization Impact

- [ ] Endpoints protected with `JwtAuthGuard` and `RolesGuard` (`@Roles(...)`)
- [ ] Sensitive fields (passwords, tokens, keys) automatically redacted in logger
- [ ] No hardcoded secrets, connection strings, or credentials present

### 4. Multi-Tenant Isolation Impact

- [ ] Every database query explicitly filters by `tenantId`
- [ ] Operations wrapped in `withTenantContext(user.tenantId, tx => ...)`
- [ ] Row-Level Security (RLS) constraints preserved

## Verification & Tests Performed

<!-- List actual commands executed locally and real results obtained. Do not fabricate results. -->

- [ ] `pnpm typecheck` passed (0 TypeScript errors across 6 workspaces)
- [ ] `pnpm test` passed (Unit and service test suites passing)
- [ ] `pnpm --filter @handloom/api test:e2e` passed (Live HTTP supertest suites passing)
- [ ] `pnpm build` passed (Full monorepo compilation successful)

### Test Output Summary:

```text
<!-- Paste terminal summary of test execution here -->
```

## Screenshots / UI Previews (if applicable)

<!-- Attach desktop and tablet screenshots for frontend UI changes -->

## Deployment & Configuration Impact

- [ ] Requires new environment variables (declared in `.env.example`)
- [ ] Requires database migration execution (`prisma migrate deploy`)
- [ ] Zero operational downtime expected

## Rollback Considerations

<!-- Describe the procedure to safely revert this change if an unexpected production issue arises -->

- Rollback strategy: `git revert <commit-hash>`

---

## Reviewer Checklist

<!-- Reviewers must check all items before approving according to docs/CODE_REVIEW.md -->

- [ ] Code adheres to the 10 Code Review Dimensions in `docs/CODE_REVIEW.md`
- [ ] No floating-point math used for money or physical material quantities
- [ ] Multi-tenant isolation verified; zero cross-tenant data leak vectors
- [ ] Conventional Commit message standard followed
- [ ] CI pipeline is green
