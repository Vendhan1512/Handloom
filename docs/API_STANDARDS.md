# Handloom REST API & Engineering Standards (docs/API_STANDARDS.md)

## 1. REST Architecture & Routing Conventions

The Handloom backend exposes a clean, predictable, and versioned RESTful API compliant with HTTP/1.1 and HTTP/2 standards.

### URI Versioning & Base Path

- **Global API Prefix:** `/api/v1`
- **Resource Naming:** Lowercase, plural nouns for collection resources (e.g., `/api/v1/yarn-lots`, `/api/v1/weavers`, `/api/v1/customer-orders`).
- **Sub-resources:** Natural hierarchical nesting for child resources (e.g., `/api/v1/yarn-lots/:id/ledger`).
- **Actions:** When an operation does not map cleanly to standard CRUD (such as batch settlement, state transition, or verification), use concise verb endpoints (e.g., `/api/v1/pre-loom/batches/:id/complete`).

### Standard HTTP Methods

| Method     | Purpose                                            | Idempotent | Expected Status Code         |
| :--------- | :------------------------------------------------- | :--------- | :--------------------------- |
| **GET**    | Retrieve single or collection resources            | Yes        | `200 OK`                     |
| **POST**   | Create new entity or execute non-idempotent action | No         | `201 Created` or `200 OK`    |
| **PUT**    | Completely replace an existing resource            | Yes        | `200 OK`                     |
| **PATCH**  | Partially update specific fields of a resource     | No         | `200 OK`                     |
| **DELETE** | Remove or soft-delete a resource                   | Yes        | `200 OK` or `204 No Content` |

---

## 2. Standardized Envelope Response Contracts

All API endpoints return standardized JSON envelope structures enforced globally by `TransformInterceptor` and `HttpExceptionFilter`.

### Success Envelope Structure (`2xx`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "lotNumber": "LOT-SILK-2026-001",
    "fiberType": "SILK",
    "availableQuantityKg": 48.5
  },
  "timestamp": "2026-11-10T14:30:00.000Z"
}
```

### Paginated Collection Envelope Structure (`200 OK`)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 142,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "timestamp": "2026-11-10T14:30:00.000Z"
}
```

### Standard Error Envelope Structure (`4xx`, `5xx`)

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": {
    "code": "BAD_REQUEST",
    "message": "Input validation failed on 2 fields",
    "details": [
      "email must be an email",
      "password must be longer than or equal to 8 characters"
    ]
  },
  "timestamp": "2026-11-10T14:30:00.000Z"
}
```

---

## 3. Request Validation & DTO Standards

1. **Class-Validator DTOs:** Every mutating endpoint (`POST`, `PUT`, `PATCH`) must define a strongly typed Data Transfer Object (DTO) in `dto/`.
2. **Global Validation Pipe Configuration:**
   - `whitelist: true`: Automatically strips undeclared properties from incoming request bodies.
   - `forbidNonWhitelisted: true`: Immediately rejects payloads with unapproved properties with HTTP 400.
   - `transform: true`: Automatically coerces primitive types based on TypeScript decorators.
3. **OpenAPI Decorators:** Every DTO property must include `@ApiProperty(...)` or `@ApiPropertyOptional(...)` with accurate examples and descriptions to auto-generate Swagger specifications.

---

## 4. Pagination, Filtering & Sorting Conventions

### Query Parameters

- **Pagination:** `?page=1&limit=25` (Default limit: 20; Maximum limit: 100).
- **Sorting:** `?sortBy=createdAt&sortOrder=DESC` (`ASC` or `DESC`).
- **Filtering:** Prefix filtering with field names:
  - Exact match: `?status=ACTIVE`
  - Date ranges: `?startDate=2026-01-01T00:00:00Z&endDate=2026-01-31T23:59:59Z`
  - Free-text search: `?search=Kanchipuram`

---

## 5. Authentication, Authorization & Tenant Scoping

### Authentication Header

Protected endpoints require an `Authorization` header containing a valid Bearer JWT:

```http
Authorization: Bearer <jwt-access-token>
```

### Route Protection Decorators

```typescript
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SOCIETY_ADMIN, UserRole.SUPERVISOR)
@Get('yarn-lots')
async getYarnLots(@CurrentUser() user: AuthenticatedUser) {
  // Scoped strictly to user.tenantId
}
```

### Public Endpoints

Endpoints accessible without authentication (e.g., login, society registration, health check) must be explicitly annotated with `@Public()`.

---

## 6. Idempotency Key Handling (PLANNED)

For critical financial disbursements, yarn dispatches, and piece-rate wage settlements, clients must submit a unique header:

```http
Idempotency-Key: <uuid-v4>
```

- The backend verifies if the idempotency key was executed within the last 24 hours.
- If previously executed, the cached response is returned immediately with `X-Cache-Lookup: HIT` without re-executing ledger writes.

---

## 7. Rate Limiting Strategy (PLANNED)

To protect the platform from denial-of-service and brute-force attacks:

- **Public Auth Endpoints (`/api/v1/auth/login`):** Maximum 10 requests per minute per IP address.
- **Authenticated Business Endpoints:** Maximum 1,000 requests per minute per tenant.
- Rate-limiting headers returned:
  - `X-RateLimit-Limit`: Maximum allowed requests in window.
  - `X-RateLimit-Remaining`: Remaining request quota.
  - `X-RateLimit-Reset`: Unix timestamp when quota resets.

---

## 8. OpenAPI / Swagger Documentation

- **Live UI URL:** `http://localhost:4000/api/docs`
- **Auto-Generation:** Handled via NestJS `@nestjs/swagger` in `apps/api/src/main.ts`.
- Every controller must define `@ApiTags('<Domain>')` and `@ApiOperation({ summary: '...' })`.
- All response status codes (`200`, `201`, `400`, `401`, `403`, `404`, `409`) must be documented with `@ApiResponse(...)`.
