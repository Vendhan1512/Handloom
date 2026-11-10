# Workflow: Security Review (security-review)

Performs focused security inspection across code, endpoints, and database queries.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Define scope (auth flows, RBAC enforcement, multi-tenant boundaries).
2. **INSPECT:** Search for credential keywords. Verify `@Roles(...)` and `tenantId` query scoping.
3. **PLAN:** Check against OWASP Top 10 (Injection, BOLA/IDOR, Broken Auth, Misconfig).
4. **IMPLEMENT:** Flag missing authorization decorators or unparameterized queries. Propose remediations.
5. **TEST:** Execute authorization tests asserting `401 Unauthorized` and `403 Forbidden`.
6. **REVIEW:** Confirm zero credentials exist in `.env`, test fixtures, or Git commit history.
7. **REPORT:** Document security posture, identified risks, and compliance confirmation.
