# Workflow: Database Migration Review (db-migration)

Ensures zero-downtime, safe schema evolutions for the multi-tenant PostgreSQL database.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Identify entity changes, relational constraints, foreign keys, and numeric precision.
2. **INSPECT:** Inspect `packages/database/prisma/schema.prisma` and previous migration history.
3. **PLAN:** Verify UUID PKs, tenantId FKs, Decimal precision, and foreign key indexes.
4. **IMPLEMENT:** Edit schema, generate Prisma Client (`pnpm db:generate`). Require human approval before running live migrations.
5. **TEST:** Verify client generation exits with code 0. Run `pnpm typecheck` and `pnpm test`.
6. **REVIEW:** Inspect SQL diff. Confirm absence of destructive `DROP TABLE` or `DROP COLUMN` commands.
7. **REPORT:** Document added models, relations, indexes, and migration script status.
