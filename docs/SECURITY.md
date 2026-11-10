# Handloom Application Security & Compliance Architecture (docs/SECURITY.md)

## 1. Security Philosophy & Threat Model

The Handloom platform manages valuable material assets (silk, zari, cotton), proprietary weaving CAD designs, weaver piece-rate disbursements, and statutory cooperative records. The security model adheres to **Zero Trust**, **Defense in Depth**, and **Strict Tenant Isolation**.

### Core Threat Vectors

1. **Cross-Tenant Data Leakage:** Unauthorized access across cooperative societies or private mills sharing the database infrastructure.
2. **Privilege Escalation:** A weaver or supervisor attempting to modify wage rates, clear advances, or alter raw silk custody balances.
3. **Session Hijacking / Credential Theft:** Stealing active supervisor session tokens on public or shared depot terminals.
4. **Data Tampering:** Modifying historical yarn stock ledger records or cut-piece inspection grades.

---

## 2. Authentication & Session Security

### Cryptographic Hashing

- User passwords are encrypted using **bcryptjs** with an adaptive work factor (salt rounds: 12).
- Plaintext passwords or unsalted hashes are strictly prohibited.

### Token Architecture & Refresh Rotation

- **Access Tokens:** Short-lived JWTs (default: 15 minutes) signed with HMAC-SHA256 containing minimal payload (`sub`, `email`, `role`, `tenantId`).
- **Refresh Tokens:** Long-lived tokens (7 days) stored as cryptographic SHA-256 hashes in the `sessions` table.
- **Single-Use Refresh Token Rotation:** Every refresh invocation revokes the existing refresh token hash and issues a brand-new token pair. If a revoked token is replayed, the session family is immediately invalidated, alerting the system to potential theft.
- **Session Revocation:** Logout explicitly sets `revoked_at` in the database, immediately terminating token refresh capabilities.

---

## 3. Role-Based Access Control (RBAC)

The platform enforces fine-grained authorization using the following hierarchical roles:

| Role            | Scope            | Permitted Operations                                                                  |
| :-------------- | :--------------- | :------------------------------------------------------------------------------------ |
| `SUPER_ADMIN`   | Global           | Platform monitoring, tenant provisioning, system health diagnostics.                  |
| `SOCIETY_ADMIN` | Tenant           | Society user management, role assignments, piece-rate master configuration.           |
| `SUPERVISOR`    | Tenant           | Yarn lot issuance, pre-loom batch assignments, loom card issuance, cut-piece receipt. |
| `MASTER_WEAVER` | Tenant / Cluster | Technical design oversight, punch card setup, loom troubleshooting, artisan coaching. |
| `WEAVER`        | Personal / Loom  | View assigned job cards, report cut pieces, review personal wage slips and advances.  |
| `INSPECTOR`     | Tenant           | Quality grading, defect logging, rework approvals, half-rate damage determinations.   |
| `ACCOUNTANT`    | Tenant           | Wage settlement approvals, advance disbursements, supplier payments, tax ledgers.     |

All mutating endpoints require both `JwtAuthGuard` and `RolesGuard` (`@Roles(...)`). Frontend role checks are treated as convenience filters and are never trusted as security gates.

---

## 4. Multi-Tenant Isolation & Row-Level Security

- Every domain query is scoped by `tenant_id`.
- Queries are executed through transactional helpers (`withTenantContext` in `packages/database/src/tenant.ts`) setting PostgreSQL session variables (`SET LOCAL app.current_tenant_id`).
- PostgreSQL Row-Level Security policies reject any query attempting to select, insert, or update rows belonging to a different tenant.

---

## 5. Input Validation, Injection & Web Vulnerability Defenses

### SQL Injection Prevention

- All database interactions utilize **Prisma ORM** parameterized queries.
- Raw SQL queries (`$queryRaw`) must use parameterized template literals (`$queryRaw\`SELECT ... WHERE tenant_id = ${tenantId}\``), never runtime string concatenation.

### Cross-Site Scripting (XSS)

- The Next.js frontend escapes all dynamic string interpolation by default.
- Markdown rendering or raw HTML injection is strictly sanitized using DOMPurify.

### Cross-Origin Resource Sharing (CORS)

- Configured in `apps/api/src/main.ts` with explicit domain whitelists matching society tenant subdomains (e.g., `https://salem.handloom.org`). Wildcard origins (`*`) are prohibited in production.

---

## 6. Audit Logging & Non-Repudiation

- Critical business events emit an immutable record into the `audit_logs` table:
  - User authentication and logout.
  - Material issues, returns, and inventory adjustments.
  - Quality rejections and damage deductions.
  - Wage calculations, advance approvals, and payouts.
- Every audit log records: `tenant_id`, `user_id`, `action`, `entity`, `entity_id`, `details` (JSON), `ip_address`, `user_agent`, and UTC `created_at`.
- The audit table is strictly append-only; update and delete privileges are revoked from the application user in PostgreSQL.

---

## 7. Secrets Management & Credential Safety

- **No Secrets in Code:** Passwords, API keys, and connection strings must never be committed to Git.
- **Template Standardization:** All required configuration keys are declared with dummy values in `.env.example`.
- **Sensitive Log Redaction:** The `@handloom/logger` Pino serializer automatically redacts:
  - `password`, `passwordHash`, `token`, `authorization`, `cookie`, `secret`, `jwtSecret`.
- **AI Agent Directive:** AI coding assistants must never be provided production credentials, private keys, or sensitive customer data in prompts.

---

## 8. Incident Response & Vulnerability Management

- **Automated Dependency Auditing:** GitHub Dependabot and CI security scans run on every pull request.
- **Compromise Procedure:**
  1. Revoke the affected JWT secret, triggering global re-authentication.
  2. Invalidate active sessions in `sessions` table.
  3. Rotate database credentials and notify affected cooperative administrators.
