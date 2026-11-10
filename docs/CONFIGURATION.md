# Handloom Operations Management Platform — Configuration & Environment Architecture (`docs/CONFIGURATION.md`)

## 1. Executive Summary & Design Principles

The Handloom platform manages critical physical manufacturing workflows, inventory assets, and financial settlements. A reliable, centralized configuration and environment management system is essential to maintain:

1. **Type Safety & Fail-Fast Validation:** Every environment variable is parsed, converted to its appropriate TypeScript type, and validated at application startup using NestJS `@nestjs/config` and `class-validator`. The server will terminate immediately with descriptive diagnostic errors if any required configuration is missing or malformed.
2. **Defensive Secret Isolation:** Backend credentials (database passwords, Redis connection URLs, JWT signing keys, storage secrets) must **never** be accessed on the client or leaked into frontend bundles. All browser-accessible variables are strictly isolated to the `NEXT_PUBLIC_*` namespace with runtime cross-boundary leak prevention.
3. **No Direct `process.env` Access:** Business controllers and services consume configuration through the injectable, strongly-typed `AppConfigService`. Direct uncontrolled reads of `process.env` in domain modules are prohibited.
4. **Environment Separation:** Environments (`development`, `test`, `staging`, `production`) enforce distinct validation rules. Safe, non-sensitive defaults are permitted in development, while staging and production enforce strict presence, minimum key lengths, and non-default secrets.

---

## 2. Environment Taxonomy

The platform defines four standard operational environments:

| Environment       | Purpose                                                              | Validation Stricitness                                                   | Database & Redis URLs                        | Secrets Policy                                  |
| :---------------- | :------------------------------------------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------- | :---------------------------------------------- |
| **`development`** | Local feature engineering on developer workstations                  | Permissive; safe local defaults supplied (e.g. port 4000, debug logs)    | Local connection strings or fallback         | Dev placeholders permitted                      |
| **`test`**        | Automated unit, service, and e2e test execution (Jest / CI)          | Permissive; mocked services and zero secret dependencies                 | In-memory or test database URL               | Test mock secrets                               |
| **`staging`**     | Pre-production testing, QA verification, customer acceptance         | **STRICT:** Mandatory database and 32+ char secrets                      | Required; dedicated staging database & Redis | Dedicated staging secrets injected via CI/Vault |
| **`production`**  | Live operational production supporting 1,000–10,000 concurrent users | **STRICTEST:** Wildcard CORS blocked, mandatory database, strict secrets | Required; clustered PostgreSQL 16 & Redis 7  | Production secrets from KMS / Secret Manager    |

---

## 3. Backend Environment Variables Reference

All backend variables are parsed and validated by `EnvironmentVariables` in [`apps/api/src/config/env.validation.ts`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/apps/api/src/config/env.validation.ts) and exposed via `AppConfigService`.

### Core Application Variables

| Variable Name            |   Type   | Allowed Values / Format                            | Default (Dev)                  | Description & Governance                                                                                 |
| :----------------------- | :------: | :------------------------------------------------- | :----------------------------- | :------------------------------------------------------------------------------------------------------- |
| **`NODE_ENV`**           |  `enum`  | `development`, `test`, `staging`, `production`     | `development`                  | Target runtime environment. Governs logging verbosity and security enforcement.                          |
| **`APP_NAME`**           | `string` | UTF-8 text                                         | `Handloom Operations Platform` | Human-readable service name used in logs and OpenAPI Swagger headers.                                    |
| **`PORT`**               | `number` | Integer `1` to `65535`                             | `4000`                         | Local TCP port for the NestJS HTTP listener.                                                             |
| **`API_PREFIX`**         | `string` | URL path prefix (e.g., `/api/v1`)                  | `/api/v1`                      | Global routing prefix applied to all REST endpoints.                                                     |
| **`CORS_ORIGIN`**        | `string` | Comma-separated URLs or `*` (dev only)             | `http://localhost:3000`        | Allowed Cross-Origin Resource Sharing origins. **Wildcard (`*`) is rejected in staging and production.** |
| **`LOG_LEVEL`**          |  `enum`  | `fatal`, `error`, `warn`, `info`, `debug`, `trace` | `debug` (dev) / `info` (prod)  | Minimum logging threshold. In production, logs at `info` and above.                                      |
| **`REQUEST_TIMEOUT_MS`** | `number` | Integer $\ge 1000$ ms                              | `30000`                        | Server-wide timeout for long-running HTTP operations.                                                    |

### Rate Limiting & File Upload Controls

| Variable Name             |   Type   | Allowed Values / Format    | Default (Dev)                                     | Description & Governance                                                              |
| :------------------------ | :------: | :------------------------- | :------------------------------------------------ | :------------------------------------------------------------------------------------ |
| **`RATE_LIMIT_TTL`**      | `number` | Integer $\ge 1$ second     | `60`                                              | Rolling sliding window for IP-based rate limiting.                                    |
| **`RATE_LIMIT_LIMIT`**    | `number` | Integer $\ge 1$ request    | `100`                                             | Maximum requests allowed per IP within the `RATE_LIMIT_TTL` window.                   |
| **`MAX_FILE_SIZE_BYTES`** | `number` | Integer $\ge 1024$ bytes   | `10485760` (10 MB)                                | Maximum permitted payload size for multipart document/image uploads.                  |
| **`ALLOWED_FILE_TYPES`**  | `string` | Comma-separated MIME types | `image/jpeg,image/png,image/webp,application/pdf` | Whitelist of acceptable MIME types for design charts, cut-piece photos, and invoices. |

### Database & Cache Configuration

| Variable Name           |   Type   | Allowed Values / Format                        |  Staging/Prod  | Description & Governance                                                            |
| :---------------------- | :------: | :--------------------------------------------- | :------------: | :---------------------------------------------------------------------------------- |
| **`DATABASE_URL`**      | `string` | `postgresql://<user>:<pwd>@<host>:<port>/<db>` | **Mandatory**  | Connection string for PostgreSQL 16. Validated at startup. Sanitized in error logs. |
| **`POSTGRES_HOST`**     | `string` | Hostname or IP                                 |    Optional    | PostgreSQL host (used in Docker Compose and local dev).                             |
| **`POSTGRES_PORT`**     | `number` | Integer (usually `5432`)                       |    Optional    | PostgreSQL listener port.                                                           |
| **`POSTGRES_USER`**     | `string` | Valid DB role name                             |    Optional    | Local development database username.                                                |
| **`POSTGRES_PASSWORD`** | `string` | Secret string                                  |    Optional    | Local development database password.                                                |
| **`POSTGRES_DB`**       | `string` | Database name                                  |    Optional    | Target database name (`handloom_db`).                                               |
| **`REDIS_URL`**         | `string` | `redis://<host>:<port>`                        | Optional (dev) | Connection string for Redis 7 (caching, BullMQ, distributed locks).                 |
| **`REDIS_HOST`**        | `string` | Hostname or IP                                 |    Optional    | Redis host (`localhost`).                                                           |
| **`REDIS_PORT`**        | `number` | Integer (usually `6379`)                       |    Optional    | Redis port.                                                                         |
| **`REDIS_PASSWORD`**    | `string` | Secret string                                  |    Optional    | Redis authentication password.                                                      |

### Security & Token Placeholders (Prepared for Authentication Phase)

| Variable Name                  |   Type   |          Min Length          | Staging/Prod Policy         | Description                                                     |
| :----------------------------- | :------: | :--------------------------: | :-------------------------- | :-------------------------------------------------------------- |
| **`JWT_SECRET`**               | `string` |        $\ge 32$ chars        | **Mandatory & Non-Default** | Cryptographic secret for signing HMAC-SHA256 JWT access tokens. |
| **`JWT_EXPIRES_IN`**           | `string` | Time span (e.g. `15m`, `1h`) | Validated format            | Access token expiration duration. Recommended: `15m`.           |
| **`REFRESH_TOKEN_SECRET`**     | `string` |        $\ge 32$ chars        | **Mandatory & Non-Default** | Cryptographic secret for signing long-lived refresh tokens.     |
| **`REFRESH_TOKEN_EXPIRES_IN`** | `string` | Time span (e.g. `7d`, `30d`) | Validated format            | Refresh token expiration duration. Recommended: `7d`.           |

### Object Storage & AI Provider Placeholders

| Variable Name             |   Type   | Staging/Prod                 | Description                                                                     |
| :------------------------ | :------: | :--------------------------- | :------------------------------------------------------------------------------ |
| **`STORAGE_ENDPOINT`**    | `string` | Optional (dev/local MinIO)   | S3-compatible object storage endpoint (e.g., AWS S3 or MinIO).                  |
| **`STORAGE_ACCESS_KEY`**  | `string` | Staging/Prod                 | Storage IAM access key.                                                         |
| **`STORAGE_SECRET_KEY`**  | `string` | Staging/Prod                 | Storage IAM secret key.                                                         |
| **`STORAGE_BUCKET_NAME`** | `string` | Default `handloom-documents` | Bucket name for weaver documents, product specifications, and cut-piece images. |
| **`STORAGE_REGION`**      | `string` | Default `us-east-1`          | AWS S3 or MinIO storage region.                                                 |
| **`GEMINI_API_KEY`**      | `string` | Optional (dev)               | Google Gemini API key for document digitization and business assistance.        |
| **`AI_MODEL_NAME`**       | `string` | Default `gemini-2.5-flash`   | Gemini model name used for tokenization and OCR parsing.                        |

---

## 4. Frontend Environment Variables Reference

Frontend variables are defined in Next.js and strictly validated in [`apps/web/src/config/env.ts`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/apps/web/src/config/env.ts).

| Variable Name              |   Type   | Required | Allowed Values                                 | Description                                                                                                           |
| :------------------------- | :------: | :------: | :--------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **`NEXT_PUBLIC_APP_NAME`** | `string` |    No    | String                                         | Application title displayed in the header and metadata. Default: `Handloom Operations Platform`.                      |
| **`NEXT_PUBLIC_API_URL`**  | `string` | **Yes**  | Valid `http:` or `https:` URL                  | Target backend REST API URL. Default: `http://localhost:4000/api/v1` (dev), `https://api.handloom.org/api/v1` (prod). |
| **`NEXT_PUBLIC_APP_ENV`**  |  `enum`  |    No    | `development`, `test`, `staging`, `production` | UI environment indicator. Displays badges or debug watermarks in non-prod. Default: `development`.                    |

> [!CAUTION]
> **Strict Client/Server Separation Rule:**
> Any attempt to prefix private backend keys (e.g. `DATABASE_URL`, `POSTGRES_PASSWORD`, `JWT_SECRET`, `STORAGE_SECRET_KEY`) with `NEXT_PUBLIC_` triggers a **`CRITICAL SECURITY VIOLATION`** build error.

---

## 5. Local Development Setup

To configure a new developer workstation:

1. **Copy the Environment Template:**
   ```bash
   cp .env.example .env
   ```
2. **Start Infrastructure Services (Docker):**
   ```bash
   pnpm docker:up
   ```
   _This starts PostgreSQL 16 on port 5432 and Redis 7 on port 6379._
3. **Run Typecheck & Build:**
   ```bash
   pnpm typecheck
   pnpm build
   ```
4. **Start Local Development Servers:**
   ```bash
   pnpm dev
   ```
   _The Next.js frontend will be accessible at `http://localhost:3000` and the NestJS API at `http://localhost:4000/api/v1` with Swagger docs at `http://localhost:4000/api/docs`._

---

## 6. How to Add a New Environment Variable

When adding a new configuration variable to the platform, follow this mandatory 5-step checklist:

1. **Define the Property in Schema:**
   Open [`apps/api/src/config/env.validation.ts`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/apps/api/src/config/env.validation.ts) and add the property to the `EnvironmentVariables` class with appropriate `class-validator` decorators (`@IsString()`, `@IsInt()`, `@Min()`, `@IsOptional()`, etc.).
2. **Add Production Staging Assertions (if sensitive):**
   If the variable is required in production (e.g., a payment gateway key or SMS token), add an assertion check inside the `isStrictEnv` block in `validateEnvironment()`.
3. **Add Typed Getter in Service:**
   Open [`apps/api/src/config/app-config.service.ts`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/apps/api/src/config/app-config.service.ts) and expose a strongly-typed getter (e.g. `get paymentGatewayKey(): string`).
4. **Update Template & Documentation:**
   Add a placeholder with comments to [`.env.example`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/.env.example) and add a row to the table in [`docs/CONFIGURATION.md`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/docs/CONFIGURATION.md).
5. **Write Unit Tests:**
   Add unit test cases in [`apps/api/src/config/env.validation.spec.ts`](file:///c:/Users/etven/OneDrive/Desktop/Handlooms/apps/api/src/config/env.validation.spec.ts) covering:
   - Valid value parsing.
   - Rejection of malformed values.
   - Production requirement enforcement.

---

## 7. Troubleshooting Common Configuration Failures

### 1. `Configuration Validation Failed: PORT must be <= 65535`

- **Cause:** `PORT` is set to an invalid integer or contains non-numeric characters.
- **Fix:** Ensure `PORT` in `.env` is an integer between `1` and `65535` (e.g. `PORT=4000`).

### 2. `DATABASE_URL is mandatory in staging and production environments`

- **Cause:** `NODE_ENV` is set to `production` or `staging`, but `DATABASE_URL` is omitted or empty.
- **Fix:** Supply the production PostgreSQL connection string via your cloud secret manager or environment variable.

### 3. `JWT_SECRET must be at least 32 characters and cannot use default placeholders`

- **Cause:** Production environment is using the dev default secret or a weak string under 32 characters.
- **Fix:** Generate a secure random 256-bit key:
  ```bash
  openssl rand -hex 32
  ```
  Set this value as `JWT_SECRET`.

### 4. `CRITICAL SECURITY VIOLATION: Backend credential DATABASE_URL must never be exposed via NEXT_PUBLIC_* variable!`

- **Cause:** A frontend variable name was created as `NEXT_PUBLIC_DATABASE_URL` or similar.
- **Fix:** Remove the secret from frontend files. Database credentials must never be accessed in browser code.

---

## 8. Secret Management Principles for Staging & Production

In deployed environments (staging and production), **no `.env` files reside on host disk or in containers**.

Instead, secrets must be provided at deployment time through sanctioned enterprise secret managers:

- **Kubernetes:** Injected as environment variables via `Secret` objects synced from HashiCorp Vault or AWS Secrets Manager via External Secrets Operator (ESO).
- **AWS ECS / EKS:** Injected directly into container task definitions via AWS Secrets Manager / Parameter Store references.
- **CI/CD Pipelines:** GitHub Actions repository secrets for staging deployment runners. Production deployments require manual approval gates.
