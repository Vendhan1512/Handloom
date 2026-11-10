# Database Engineering Directives (.agents/rules/database.md)

## 1. Engine & ORM Conventions

- **Engine:** PostgreSQL 16.
- **Client:** Prisma ORM 6 inside `packages/database`.
- Primary keys must always use **UUIDv4** (`@id @default(uuid())`). No sequential auto-incrementing integer IDs.
- Table names must be lowercase snake_case plural (`tenants`, `users`, `yarn_lots`). Columns must be snake_case mapped via `@map(...)`.

## 2. Strict Arithmetic & Numeric Types

- **Floating-point types (`float`, `double`) are strictly prohibited.**
- Material weights (yarn kg, cut pieces): `Decimal @db.Decimal(12, 3)` (precision to 1 gram).
- Currency & wages: `Decimal @db.Decimal(14, 2)`.
- Dimensions (inches, meters): `Decimal @db.Decimal(8, 2)`.
- Percentages & loss rates: `Decimal @db.Decimal(5, 2)`.

## 3. Multi-Tenant Scoping & Row-Level Security

- Every business model must include `tenantId String @map("tenant_id")` referencing `Tenant(id)`.
- Enforce PostgreSQL Row-Level Security (RLS) using session variables (`SET LOCAL app.current_tenant_id`).
- All queries must be executed within `withTenantContext(tenantId, tx => ...)`.

## 4. Ledger Immutability & Double-Entry Principles

- Historical transaction ledgers (`YarnStockLedger`, `AuditLog`, `WorkerWageLedger`) are **strictly append-only**.
- Never update or delete historical ledger rows. Corrections must be made via compensating `REVERSAL` or `ADJUSTMENT` entries.
- Running balances on parent entities (e.g., `YarnLot.available_quantity_kg`) are rebuildable cached projections.

## 5. Concurrency & Hot-Row Updates

- Prevent race conditions during concurrent material allocation by using atomic conditional updates:
  ```sql
  UPDATE yarn_lots SET available_quantity_kg = available_quantity_kg - $1
  WHERE id = $2 AND available_quantity_kg >= $1;
  ```
- Wrap multi-table operations in `prisma.$transaction`.

## 6. Migration Safety & Forward-Only Evolution

- Never modify or delete previously applied database migrations.
- Schema changes must follow the **Expand-and-Contract** pattern.
- Create explicit indexes on all foreign keys (`@@index([tenantId])`) and high-cardinality status filters (`@@index([status])`).
