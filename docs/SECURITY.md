# Handloom Application Security & Compliance Architecture (docs/SECURITY.md)

## 1. Security Philosophy & Threat Model

The Handloom platform manages valuable physical material assets (pure mulberry silk, certified zari, organic cotton), proprietary weaving CAD jacquard designs, weaver piece-rate disbursements, and statutory cooperative records. The platform security posture strictly adheres to **Zero Trust**, **Defense in Depth**, and **Strict Tenant Isolation**.

### Core Threat Vectors

1. **Cross-Tenant Data Leakage:** Unauthorized access across cooperative societies or private mills sharing the database infrastructure.
2. **Privilege Escalation:** An unprivileged user attempting to modify wage rates, approve cash advances, or issue high-value silk yarn.
3. **Session Hijacking / Credential Replay:** Intercepting or replaying rotated refresh tokens on shared depot terminals.
4. **Account Enumeration & Brute-Force Attacks:** Timing and response discrepancy attacks attempting to harvest valid user emails.
5. **Data Tampering:** Modifying historical yarn stock balances or cut-piece inspection grading records.

---

## 2. Authentication & Credential Security

### Modern Cryptographic Standard: Argon2id
All new account passwords and password changes are hashed using **Argon2id** (RFC 9106) with OWASP-recommended baseline parameters:
- **Algorithm Type:** `argon2id` (resistant to both side-channel cache attacks and GPU/ASIC brute-force trade-offs).
- **Memory Cost (`m`):** 19,456 KiB (~19 MiB).
- **Time Cost (`t`):** 2 iterations.
- **Parallelism (`p`):** 1 lane.
- **Salt:** 16 bytes of cryptographically secure random entropy per password.

### Transparent Legacy Migration (Zero User Disruption)
Existing users authenticated via legacy bcrypt hashes (`$2a$`, `$2b$`) are seamlessly and transparently rehashed with Argon2id upon their next successful login. The migration is executed atomically within the authentication transaction without requiring disruptive manual password resets.

### Account Enumeration Defense
- Failed login requests consistently return generic HTTP `401 Unauthorized` responses (`"Invalid email or password"`).
- Non-existent email queries execute a constant-time dummy Argon2id hash cycle to neutralize timing side-channel attacks.

---

## 3. Token Architecture & Refresh Token Security

### Short-Lived Access Tokens
- **Format:** Signed JSON Web Token (`HS256`) with a 15-minute default lifetime (`JWT_EXPIRES_IN`).
- **Minimal Claims:** Contains strictly necessary claims (`sub`, `email`, `role`, `tenantId`, `permissions`, `type: 'access'`). Never includes sensitive profile data or unverified authority claims.

### Cryptographic Refresh Token Rotation & Family Reuse Detection
- **Entropy:** 40 bytes of cryptographically secure pseudorandom entropy (`crypto.randomBytes(40)`).
- **Hash-Only Storage:** Plaintext refresh tokens are **never written to disk or database**. Only the SHA-256 hash (`token_hash`) is persisted.
- **Atomic Rotation:** Every refresh invocation revokes the current session and issues a new token pair in a single database transaction.
- **Reuse Detection Threat Response:** Every token belongs to a cryptographic `family_id`. If an already-revoked refresh token is replayed (indicating credential interception or token theft), the server immediately revokes all sessions sharing that `family_id` and emits a high-priority security audit alert (`AUTH_REFRESH_TOKEN_REUSE_DETECTED`).

---

## 4. Web Session & Cookie Security (Next.js Frontend)

For browser clients, authentication supports secure cookie delivery:
- **`access_token`:** `HttpOnly`, `SameSite=Lax`, `Secure` (in production), `Path=/`, max-age: 15 minutes.
- **`refresh_token`:** `HttpOnly`, `SameSite=Lax`, `Secure` (in production), `Path=/api/v1/auth`, max-age: 7 days.
- **XSS Defense:** Refresh tokens cannot be read or stolen via JavaScript (`document.cookie` / `localStorage`).
- **CSRF Defense:** `SameSite=Lax` cookie policy, combined with custom request header validation (`X-Requested-With`, `Authorization`), prevents unauthorized cross-site form submissions.

---

## 5. Tenant-Aware Role-Based Access Control (RBAC)

Authorization is enforced through a default-deny permissions architecture:
- **Decoupled Memberships:** A user possesses zero authority until validated through an active `TenantMembership` record in the target tenant.
- **Domain Permission Catalog:** Granular permissions (`tenant.read`, `orders.create`, `inventory.issue`, `wages.approve`, etc.) grouped by business domain.
- **Guard Enforcement:** Mutating operations require `JwtAuthGuard` and `PermissionsGuard` (`@RequirePermissions(...)`).
- **Server Authority:** Frontend role-checking is treated purely as UX convenience; the backend API validates every incoming action independently.

---

## 6. Multi-Tenant Isolation & Row-Level Security (PostgreSQL RLS)

- Every tenant-scoped query runs within `withTenantContext(tenantId, tx)` setting PostgreSQL transaction-local parameters (`SET LOCAL app.current_tenant_id = $tenantId`).
- PostgreSQL Row-Level Security policies reject queries attempting to read or modify records belonging to a different `tenant_id`.
- The database connection pool is protected against context leaks because `set_config(..., true)` is strictly transaction-local and automatically resets upon commit or rollback.

---

## 7. Audit Logging & Security Event Monitoring

The platform records critical security and identity events into `audit_logs`:
- `AUTH_REGISTER_SOCIETY`
- `AUTH_LOGIN`
- `AUTH_LOGIN_FAILED` (records IP/UA; never logs submitted passwords)
- `AUTH_PASSWORD_MIGRATED_ARGON2ID`
- `AUTH_REFRESH_TOKEN_REUSE_DETECTED` (CRITICAL security violation)
- `AUTH_LOGOUT`
- `AUTH_TENANT_SWITCHED`
- `AUTH_SESSION_REVOKED`
- `AUTH_PASSWORD_CHANGED`

Audit records are append-only. Sensitive fields (`password`, `passwordHash`, `refreshToken`, `secret`) are masked by the logger and never stored in audit payloads.
