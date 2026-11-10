# Workflow: Frontend Feature Implementation (frontend-feature)

Orchestrates responsive, accessible user interfaces in `apps/web`.

## Sequence: UNDERSTAND → INSPECT → PLAN → IMPLEMENT → TEST → REVIEW → REPORT

1. **UNDERSTAND:** Define user persona, layout, accessibility needs, and viewport breakpoints.
2. **INSPECT:** Inspect `apps/web/src/app/`, Tailwind config, and API response contracts.
3. **PLAN:** Plan route hierarchy, Zod form schema, and TanStack Query hooks.
4. **IMPLEMENT:** Create components with utility-first Tailwind CSS. Connect via typed fetchers.
5. **TEST:** Verify types (`pnpm --filter @handloom/web typecheck`) and build (`pnpm --filter @handloom/web build`).
6. **REVIEW:** Check accessibility (ARIA, focus rings) and responsiveness (mobile/tablet/desktop).
7. **REPORT:** Document routes, UI components created, and build status.
