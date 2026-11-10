# Workflow: Repository Audit (repo-audit)

Perform a comprehensive read-only audit of the Handloom repository.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Identify target audit scope (monorepo, API, web, database, security, tests).
2. **INSPECT:** Inspect `package.json`, `apps/`, `packages/`, `docker/`, and Git history.
3. **PLAN:** Formulate audit checklist against 1k-10k user scalability and multi-tenant rules.
4. **IMPLEMENT:** Synthesize findings. Do not edit, delete, or create code. Label features `IMPLEMENTED`, `PLANNED`, or `UNVERIFIED`.
5. **TEST:** Run non-destructive checks (`pnpm typecheck`, `pnpm test`).
6. **REVIEW:** Check findings against physical files. No fabricated statements.
7. **REPORT:** Deliver executive summary, verified architecture, and roadmap.
