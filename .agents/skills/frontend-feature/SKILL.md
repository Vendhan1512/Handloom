---
name: frontend-feature
description: >-
  Guides the implementation of Next.js App Router views, components, forms, and server-state integrations.
  Use when building dashboard pages, weaver check-in forms, or inventory visualization tables.
---

# Frontend Feature Implementation Workflow (frontend-feature)

Orchestrates the creation of responsive, accessible user interfaces in `apps/web`.

## Execution Lifecycle

### 1. UNDERSTAND

- Define user persona (depot supervisor, artisan, accountant), layout requirements, accessibility needs, and target viewport breakpoints.

### 2. INSPECT

- Inspect `apps/web/src/app/` structure, Tailwind configuration, and shared UI component primitives.
- Review API endpoint response contracts.

### 3. PLAN

- Plan route hierarchy (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- Plan form schema with Zod and React Hook Form.
- Plan TanStack Query query keys and mutation hooks.

### 4. IMPLEMENT

- Create component hierarchy with utility-first Tailwind CSS.
- Connect to backend API via typed fetchers consuming `@handloom/types`.
- Never execute business calculations (wages, taxes, yarn deductions) client-side.

### 5. TEST

- Verify TypeScript types (`pnpm --filter @handloom/web typecheck`).
- Verify production build compilation (`pnpm --filter @handloom/web build`).

### 6. REVIEW

- Check for accessibility (focus states, ARIA labels, semantic HTML).
- Review responsiveness across mobile (375px), tablet (768px), and desktop (1440px).

### 7. REPORT

- Document new routes, UI components created, and build verification status.
