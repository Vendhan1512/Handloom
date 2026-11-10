# Security Engineering Directives (.agents/rules/security.md)

## 1. Zero Trust & Defense in Depth

- Treat every request boundary (network, API, database) as untrusted.
- Validate, authenticate, and authorize requests at each architectural layer independently.
- Never trust client-supplied tenant identifiers or roles without verifying the cryptographic JWT token.

## 2. Authentication & Session Hygiene

- Passwords must be hashed using `bcryptjs` with salt rounds >= 12.
- Access tokens must be short-lived (15 minutes).
- Refresh tokens must be single-use, rotated upon every refresh, and stored as SHA-256 hashes in the database.
- Immediate revocation must terminate active refresh token families upon logout or suspicious reuse.

## 3. Strict Authorization (RBAC)

- Enforce role requirements at the route level with `@Roles(...)` and `RolesGuard`.
- The following roles are supported: `SUPER_ADMIN`, `SOCIETY_ADMIN`, `SUPERVISOR`, `MASTER_WEAVER`, `WEAVER`, `INSPECTOR`, `ACCOUNTANT`.
- Maintain strict multi-tenant isolation: A user belonging to Tenant A must never access or modify records of Tenant B under any circumstance.

## 4. Input Sanitization & Vulnerability Defenses

- Reject undeclared payload properties using `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- Prevent SQL injection: Use Prisma ORM parameterized queries or parameterized `$queryRaw` template literals.
- Prevent XSS: Escape all dynamic user input in the frontend.
- Restrict CORS: Never configure wildcard (`*`) origins in production; whitelist tenant subdomains explicitly.

## 5. Audit Logging & Secrets Management

- Log all mutating and financial operations into the immutable `audit_logs` table with `userId`, `tenantId`, `action`, `entity`, `ipAddress`, and timestamp.
- Never hardcode or log passwords, API keys, tokens, or database connection strings.
- Sensitive fields are automatically redacted via `@handloom/logger`.
- AI coding agents must never be provided production credentials or private keys in prompts.
