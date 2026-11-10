---
name: Bug Report
about: Create a detailed bug report to help identify and fix an issue in the Handloom platform
title: "[BUG] <concise description of the problem>"
labels: ["bug", "triage"]
assignees: ""
---

## Bug Description

<!-- A clear and concise description of what the bug is. -->

## Affected Domain / Module

- [ ] Authentication & Tenancy (`apps/api/src/modules/auth`)
- [ ] Master Catalog & Specifications (`apps/api/src/modules/catalog`)
- [ ] Yarn Inventory & Stock Ledger (`apps/api/src/modules/yarn-inventory`)
- [ ] Pre-Loom Workflows (`apps/api/src/modules/pre-loom`)
- [ ] Production & Loom Allocation (`apps/api/src/modules/production`)
- [ ] Quality Inspection & Defects (`apps/api/src/modules/quality`)
- [ ] Piece-Rate Wages & Advances (`apps/api/src/modules/wages`)
- [ ] Frontend Web Dashboard (`apps/web`)
- [ ] Database & RLS (`packages/database`)
- [ ] Infrastructure / CI/CD (`.github`, `docker`)

## Steps to Reproduce

1. Navigate to '...'
2. Log in as user with role '...'
3. Click on '....' or execute API request `POST /api/v1/...`
4. Payload submitted: `{ ... }`
5. See error

## Expected Behavior

<!-- A clear and concise description of what you expected to happen according to docs/BUSINESS_RULES.md. -->

## Actual Behavior

<!-- What actually happened, including HTTP status code or UI error banner. -->

## Relevant Error Logs / Stack Trace

```text
<!-- Paste terminal logs, API error responses, or browser console logs here -->
```

## Screenshots / Evidence

<!-- Attach screenshots or videos of the issue if applicable. -->

## Environment & Context

- **Environment:** Local Dev / Staging / Production
- **Browser (if frontend):** Chrome, Firefox, Safari (Version)
- **Node.js Version:** `node -v`
- **User Role Affected:** `SOCIETY_ADMIN` / `SUPERVISOR` / `WEAVER` / `INSPECTOR` / `ACCOUNTANT`
- **Tenant ID (anonymized):** `tenant-xxx`

## Severity / Impact Assessment

- [ ] **Critical / P0:** Production data loss, incorrect financial wage calculation, security breach, or system down.
- [ ] **Major / P1:** Core workflow blocked (e.g. unable to issue yarn lot or approve cut piece), no workaround.
- [ ] **Moderate / P2:** Workflow impacted but workaround exists.
- [ ] **Minor / P3:** Visual, cosmetic, or non-blocking UI discrepancy.
