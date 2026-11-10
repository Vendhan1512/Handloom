# Handloom Code Review Governance & Quality Gate (docs/CODE_REVIEW.md)

## 1. Code Review Philosophy

In the Handloom platform, code review is an essential quality defense boundary. Code manages high-value physical raw materials (silk, zari, fine cotton), statutory cooperative compliance, and artisan compensation.

> **The Golden Review Axiom:**
> **Never accept code merely because it compiles or builds.**
> Code must be verified for mathematical correctness, multi-tenant isolation, concurrency safety, and business-rule adherence.

---

## 2. The 10 Mandatory Review Dimensions

Every pull request and code modification submitted by engineers or AI agents must satisfy the following 10 review checks:

### 1. Correctness & Business Logic

- Does the code adhere to the documented handloom lifecycle in [`docs/BUSINESS_RULES.md`](./BUSINESS_RULES.md)?
- Are material weights verified down to grams?
- Does the implementation maintain the distinction between **Material Issued** (custody transfer) and **Material Consumed** (finished goods deduction)?
- Are damaged yardage piece rates correctly configured (e.g., half-rate rule requiring explicit authorization)?

### 2. Security & Input Sanitization

- Are all incoming request payloads validated using class-validator DTOs with `whitelist: true` and `forbidNonWhitelisted: true`?
- Are endpoints protected with `JwtAuthGuard` and `RolesGuard` (`@Roles(...)`)?
- Is frontend role checking treated solely as UX navigation and never as an authorization gate?
- Are secrets, tokens, or private keys completely absent from source code, logs, and Git history?

### 3. Strict Tenant Isolation

- Does every database query filter explicitly by `tenantId`?
- Are operations executed inside `withTenantContext(user.tenantId, tx => ...)`?
- Can a user from Tenant A access, enumerate, or modify entities belonging to Tenant B? (Must be strictly impossible).

### 4. Performance & Scalability (1k–10k Users)

- Is the API tier completely stateless?
- Are database queries bounded with explicit pagination (`limit`, `offset` / `take`, `skip`)?
- Are N+1 query patterns avoided through eager relation joins or batch lookups?
- Are high-latency tasks (bulk wage settlements, PDF generation) planned for background queues?

### 5. Concurrency & Hot-Row Contention

- Are physical inventory allocations protected against race conditions using atomic conditional decrement queries?
  ```sql
  UPDATE yarn_lots SET available_quantity_kg = available_quantity_kg - :qty
  WHERE id = :id AND available_quantity_kg >= :qty;
  ```
- Are multi-table writes wrapped in atomic database transactions (`prisma.$transaction`)?

### 6. Database Integrity & Decimal Arithmetic

- Are all monetary values, material weights, dimensions, and percentages stored as `Decimal` (`NUMERIC`), never `Float`?
- Are raw stock and wage ledgers append-only? (No `UPDATE` or `DELETE` on historical ledger entries).
- Are foreign keys and status columns properly indexed?

### 7. Standardized Error Handling & Envelopes

- Does the endpoint return the standard API envelope (`TransformInterceptor`)?
- Are error responses formatted consistently through `HttpExceptionFilter`?
- Are built-in NestJS HTTP exceptions used instead of raw generic runtime errors?

### 8. Automated Test Coverage

- Does the pull request include meaningful unit tests covering both happy paths and edge cases?
- Are live HTTP endpoints verified using Supertest (`apps/api/test/app.e2e-spec.ts`)?
- Do tests make meaningful assertions (no empty or trivial `expect(true).toBe(true)`)?

### 9. Maintainability & Code Cleanliness

- Does the code maintain `strict: true` TypeScript typing with zero use of `any`?
- Are shared interfaces, enums, and types consumed from `@handloom/types`?
- Is documentation integrity preserved, retaining all unrelated code comments and docstrings?

### 10. Traceability & Audit Logging

- Do mutating operations emit non-repudiation audit logs into `audit_logs`?
- Does the Git commit follow the Conventional Commits specification?

---

## 3. Review Outcome Classifications

Reviewers must classify their decision into one of three statuses:

| Decision            | Criteria                                                                                                 | Action Required                                                 |
| :------------------ | :------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| **APPROVE**         | Satisfies all 10 criteria, passes all local builds/tests, clean diff.                                    | Ready to merge into `develop` or `main`.                        |
| **REQUEST_CHANGES** | Contains security flaws, tenant isolation gaps, floating-point math, missing tests, or unhandled errors. | Contributor must resolve all blocker comments before re-review. |
| **COMMENT**         | Non-blocking observations, architectural suggestions, or performance ideas.                              | Contributor may address or defer with documented rationale.     |
