---
name: Feature Request
about: Suggest a new capability or architectural enhancement for the Handloom platform
title: "[FEAT] <concise description of the proposed feature>"
labels: ["enhancement", "feature"]
assignees: ""
---

## Problem Statement

<!-- Is your feature request related to an operational bottleneck, artisan difficulty, or business requirement? Describe the problem clearly. -->

## Proposed Solution / Capability

<!-- A clear and concise description of what you want to happen and how it integrates into the Handloom lifecycle. -->

## Handloom Business Domain Impact

<!-- Reference relevant handloom lifecycle stages from docs/BUSINESS_RULES.md -->

- [ ] Customer order intake and specification management
- [ ] Raw yarn lot procurement and supplier management
- [ ] Pre-loom processing (bobbin winding, warping, beaming, sizing, dyeing)
- [ ] Loom assignments, warp loading, and cut-piece delivery
- [ ] Inspection grading and damage deduction configuration
- [ ] Piece-rate wages, advances, and bank settlements
- [ ] AI-assisted document extraction (weaver passbooks, invoices)

## Proposed User Personas & Roles

- [ ] `SOCIETY_ADMIN` (Society general manager / cluster administrator)
- [ ] `SUPERVISOR` (Depot floor manager, material issuer)
- [ ] `MASTER_WEAVER` (Technical loom tuner, jacquard card designer)
- [ ] `WEAVER` (Artisan operating the loom)
- [ ] `INSPECTOR` (Cloth inspection table grader)
- [ ] `ACCOUNTANT` (Financial clerk, wage paymaster)

## Acceptance Criteria

- [ ] Criterion 1: ...
- [ ] Criterion 2: ...
- [ ] Criterion 3: ...

## Architectural & Non-Functional Considerations

- **Concurrency & Scaling (1k–10k users):** Expected query volume and caching requirements.
- **Tenant Isolation:** Tenant-scoped schema models and PostgreSQL RLS constraints.
- **Numeric Precision:** Decimal types (`Decimal(12, 3)` for kg, `Decimal(14, 2)` for currency).
- **Audit Logging:** Non-repudiation audit trail requirements.

## Additional Context / Mockups

<!-- Add any diagrams, screenshots, wireframes, or reference cooperative forms here. -->
