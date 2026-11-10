---
name: security-review
description: >-
  Audits code and configuration for security vulnerabilities, multi-tenant leaks, injection risks, and secret exposure.
  Use when reviewing endpoints handling sensitive financial operations, auth logic, or public ingress.
---

# Security Review Workflow (security-review)

Performs a focused security inspection across the Handloom monorepo.

## Execution Lifecycle

### 1. UNDERSTAND

- Define scope: Authentication flows, RBAC enforcement, multi-tenant boundaries, or external payload ingress.

### 2. INSPECT

- Search for sensitive keywords (`password`, `secret`, `jwt`, `token`, `key`).
- Inspect controller guards: Verify `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`.
- Inspect database queries for tenant scoping (`tenant_id = user.tenantId`).

### 3. PLAN

- Check against OWASP Top 10 vulnerabilities:
  - Injection (SQL, command).
  - Broken Object Level Authorization (BOLA / IDOR).
  - Broken Authentication & Session Management.
  - Security Misconfiguration (CORS, error stack leaks).

### 4. IMPLEMENT (AUDIT)

- Flag any missing authorization decorators or unparameterized queries.
- Propose surgical remediations.
- Require human approval before rotating production keys or modifying access policies.

### 5. TEST

- Execute authorization test suites asserting `401 Unauthorized` and `403 Forbidden` responses.
- Verify that tenant cross-access attempts fail.

### 6. REVIEW

- Confirm no credentials exist in `.env`, test fixtures, or Git commit history.

### 7. REPORT

- Document security posture, identified risks, remediation status, and compliance confirmation.
