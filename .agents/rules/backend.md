# Backend Engineering Directives (.agents/rules/backend.md)

## 1. Architecture & Modular Boundaries

- Follow the established **NestJS Modular Monolith** pattern in `apps/api/src/modules/`.
- Domain encapsulation is non-negotiable: Domain modules must not directly import internal service implementations of other modules; they must communicate via declared module exports and interfaces in `@handloom/types`.
- Keep the application tier **stateless**: Never store request state, user context, or cache in process memory.

## 2. Controllers & Request Lifecycle

- Controllers must strictly handle HTTP transport concerns: Route decoration, Swagger annotations, request parameter extraction, and invoking service methods.
- No business logic, database queries, or transaction management inside controllers.
- Apply `@ApiTags(...)`, `@ApiOperation(...)`, and `@ApiResponse(...)` on all endpoints.

## 3. Services & Business Logic

- Business logic, validation rules, calculations, and domain orchestrations reside in injectable services.
- Multi-step writes and financial/inventory operations must be executed inside explicit atomic database transactions (`prisma.$transaction`).
- Enforce idempotency keys (`Idempotency-Key` header) on material issue and wage settlement endpoints.

## 4. DTOs & Input Validation

- Every incoming payload must be defined using a class-validator DTO with strict validation decorators (`@IsString()`, `@IsUUID()`, `@IsNumber()`, `@IsOptional()`).
- The global validation pipe runs with `whitelist: true` and `forbidNonWhitelisted: true`.
- Coerce primitives explicitly using `Type` or transformer decorators.

## 5. Error Handling & Envelopes

- Never swallow exceptions or return raw error strings.
- Throw appropriate NestJS built-in HTTP exceptions (`BadRequestException`, `UnauthorizedException`, `ForbiddenException`, `NotFoundException`, `ConflictException`).
- All responses are automatically formatted into standard envelopes by `TransformInterceptor` and `HttpExceptionFilter`.

## 6. Security, Authorization & Tenancy

- Every protected endpoint requires `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(...)`.
- Scope every database query strictly by `tenantId` extracted from the authenticated user token (`@CurrentUser()`).
- Execute tenant queries within `withTenantContext(user.tenantId, tx => ...)`.

## 7. Structured Logging

- Use `@handloom/logger` (`logger`) for structured JSON logging.
- Always include `tenantId`, `userId`, and relevant entity IDs in log context.
- Never log passwords, tokens, API keys, or full customer credit details.
