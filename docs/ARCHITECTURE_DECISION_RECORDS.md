# Architecture Decision Records (ADRs) (docs/ARCHITECTURE_DECISION_RECORDS.md)

## Table of Contents
- [ADR-001: Decoupled User Identity and Tenant Membership Architecture](#adr-001-decoupled-user-identity-and-tenant-membership-architecture)
- [ADR-002: Dual-Algorithm Password Hashing (Argon2id with Transparent Bcrypt Migration)](#adr-002-dual-algorithm-password-hashing-argon2id-with-transparent-bcrypt-migration)
- [ADR-003: Cryptographic Refresh Token Rotation with Token Family Reuse Revocation](#adr-003-cryptographic-refresh-token-rotation-with-token-family-reuse-revocation)

---

## ADR-001: Decoupled User Identity and Tenant Membership Architecture

- **Status:** Approved & Implemented
- **Date:** 2026-11-12
- **Context:**
  The initial foundation model tied `User` directly to a single `Tenant` via `tenantId` with unique constraint `@@unique([tenantId, email])`. However, in real-world handloom cooperative clusters, regional managers, auditors, state textile inspectors, and cluster managers frequently oversee or consult across multiple independent societies and mills.
- **Decision:**
  Decouple the global authentication entity (`User`) from the tenant-specific authorization entity (`TenantMembership`).
  - `User`: Global entity holding email (globally unique), password hash, personal name, and account status.
  - `TenantMembership`: Scoped junction record (`userId`, `tenantId`, `role`, `status`) establishing authorized membership and permissions in a specific tenant society.
  - Multi-tenant users switch active context using `POST /auth/select-tenant`.
- **Consequences:**
  - Positive: Clean separation of authentication vs authorization; supports multi-society access without duplicate accounts.
  - Positive: Allows central security policies (e.g., password change revoking sessions across societies).
  - Migration: Versioned forward migration `20261112000000_auth_rbac_membership` safely preserved existing users into memberships.

---

## ADR-002: Dual-Algorithm Password Hashing (Argon2id with Transparent Bcrypt Migration)

- **Status:** Approved & Implemented
- **Date:** 2026-11-12
- **Context:**
  Argon2id is the gold standard for password hashing (RFC 9106, OWASP recommendation), offering superior resistance to GPU/ASIC brute-force and side-channel cache attacks compared to legacy bcrypt. However, existing active users previously hashed with bcrypt cannot be broken or forced into mass password resets.
- **Decision:**
  Implement `PasswordHasherService` supporting dual verification:
  - Hashes starting with `$argon2id$` are verified with `argon2.verify()`.
  - Hashes starting with `$2a$` or `$2b$` are verified with `bcrypt.compare()`.
  - Upon successful bcrypt authentication, the plaintext password is automatically rehashed with Argon2id and updated in PostgreSQL within the login transaction.
- **Consequences:**
  - Zero user disruption: Existing users log in seamlessly.
  - Cryptographic upgrade occurs organically on the first login.
  - New users and password changes immediately use Argon2id.

---

## ADR-003: Cryptographic Refresh Token Rotation with Token Family Reuse Revocation

- **Status:** Approved & Implemented
- **Date:** 2026-11-12
- **Context:**
  Long-lived refresh tokens stored on client devices pose a severe threat if intercepted or stolen. If an attacker and a legitimate client both attempt to use a rotated refresh token, a race condition or replay attack could go undetected.
- **Decision:**
  Implement single-use refresh token rotation backed by cryptographic `family_id` tracking:
  - Refresh tokens are generated as 40 bytes of cryptographically secure random entropy.
  - Plaintext tokens are never stored; only SHA-256 hashes are persisted in `sessions`.
  - Each rotation atomically revokes the predecessor and issues a new token belonging to the same `family_id`.
  - If a revoked token is ever presented again, the system detects a token replay attack, immediately revokes all active sessions sharing that `family_id`, and emits an `AUTH_REFRESH_TOKEN_REUSE_DETECTED` audit alert.
- **Consequences:**
  - Immediate mitigation of token hijacking without manual administrator intervention.
  - Strict atomic database transactions prevent race conditions during concurrent rotations.
