# Frontend Engineering Directives (.agents/rules/frontend.md)

## 1. Next.js App Router Architecture

- Structure pages and layouts inside `apps/web/src/app/` adhering to Next.js App Router conventions.
- Default to **React Server Components (RSC)** for data-fetching and initial layout rendering.
- Use Client Components (`'use client'`) only when interactive state, browser events, or client-side hooks are required.

## 2. TypeScript & Strict Typing

- Maintain `strict: true` across all frontend code. Never use `any`.
- Consume canonical domain types and DTO interfaces directly from `@handloom/types`.
- Strongly type all component props, event handlers, and query responses.

## 3. Server State & TanStack Query

- Manage server state, caching, pagination, and optimistic updates via **TanStack Query**.
- Centralize API fetchers into reusable hook libraries (e.g., `src/lib/api/`).
- Handle loading, error, and empty states explicitly across all dashboard widgets.

## 4. Form Validation & User Input

- Build complex forms using **React Hook Form** paired with **Zod** schema resolvers.
- Display accessible, field-level inline validation error messages.
- Prevent duplicate form submissions by disabling submit buttons during active network requests.

## 5. UI Architecture & Accessibility (a11y)

- Utilize **Tailwind CSS** with utility-first styling and Radix UI / shadcn/ui primitives.
- Ensure all interactive elements have keyboard navigation, visible focus rings, and valid ARIA attributes.
- Maintain responsive layouts optimized for desktop depot supervisors (1920x1080) and tablet field workers (768px+).

## 6. Frontend Boundary Rule

- **Never calculate authoritative business results on the frontend.**
- Piece-rate wages, inventory deductions, and quality grading calculations must be performed authoritatively by the backend API.
- Frontend role checks (`user.role === 'SOCIETY_ADMIN'`) are for user interface navigation only and must never be treated as security barriers.
