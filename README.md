# Handloom Operations Management Platform

[![CI Pipeline](https://github.com/Vendhan1512/Handloom/actions/workflows/ci.yml/badge.svg)](https://github.com/Vendhan1512/Handloom/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-11.15-orange)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.4-blueviolet)](https://turbo.build/)

An enterprise-grade, multi-tenant digital operations platform digitizing the complete handloom textile production lifecycle — from customer orders, yarn procurement, and pre-loom preparation to weaver custody tracking, cut-piece quality inspection, piece-rate wages, and financial accounting.

---

## 1. Real-World Problem & Business Objectives

### The Problem

Traditional handloom weaving clusters and primary weaver cooperative societies manage high-value materials (pure silk, pure silver/gold zari, high-count cotton) and complex artisan networks using paper passbooks, disjointed spreadsheets, and manual ledger entries. This leads to:

- Critical material leakage and unaccounted yarn shortages during pre-loom winding and sizing.
- Inaccurate piece-rate wage calculations and delayed artisan advance settlements.
- Inability to trace finished luxury handlooms back to raw fiber lots, dye batches, and specific artisan looms.
- Severe operational bottlenecks scaling across multi-village weaver clusters.

### The Objective

Handloom provides an integrated, audit-compliant digital backbone supporting **1,000 to 10,000 concurrent active users** across cooperative societies, master weaver clusters, and private mills.

---

## 2. Core Platform Capabilities

| Capability                       | Status          | Description                                                                                                                                                    |
| :------------------------------- | :-------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Multi-Tenant Foundation**      | **IMPLEMENTED** | Multi-society isolation, tenant registration, and database Row-Level Security (RLS) architecture.                                                              |
| **Authentication & RBAC**        | **IMPLEMENTED** | Cryptographically rotated refresh tokens, bcrypt password hashing, and role-based guards (`SOCIETY_ADMIN`, `SUPERVISOR`, `WEAVER`, `INSPECTOR`, `ACCOUNTANT`). |
| **Health & Diagnostics**         | **IMPLEMENTED** | Uptime, system versioning, and database liveness probes at `/api/v1/health`.                                                                                   |
| **Master Catalog**               | **PLANNED**     | Fabric specs, reed/pick density, warp ends, and product Bill of Materials (BOM).                                                                               |
| **Yarn Inventory & FIFO Ledger** | **PLANNED**     | Procurement lots, supplier tracking, immutable stock ledgers, and FIFO allocation.                                                                             |
| **Pre-Loom Processing**          | **PLANNED**     | Bobbin winding, warping, beaming, sizing, hank dyeing, and loss reconciliation.                                                                                |
| **Loom Allocation & Production** | **PLANNED**     | Weaver loom cards, warp beam loading, cut-piece tracking, and custody balances.                                                                                |
| **Quality Inspection & Defects** | **PLANNED**     | Defect grading (A/B/C), rework slips, and authorized half-rate damage policies.                                                                                |
| **Wages & Worker Advances**      | **PLANNED**     | Automated piece-rate calculations, weekly settlement batches, and advance deductions.                                                                          |
| **AI Document Extraction**       | **PLANNED**     | Automated OCR parsing of physical weaver passbooks and yarn supplier invoices.                                                                                 |

---

## 3. Technology Stack

- **Monorepo Orchestration:** [Turborepo](https://turbo.build/) with [pnpm workspaces](https://pnpm.io/).
- **Frontend Web Portal:** [Next.js 15](https://nextjs.org/) (App Router), React 19, TypeScript strict mode, [Tailwind CSS](https://tailwindcss.com/), Lucide icons.
- **Backend Core API:** [NestJS 11](https://nestjs.com/), Express adapter, class-validator, OpenAPI/Swagger.
- **Database & Persistence:** [PostgreSQL 16](https://www.postgresql.org/), [Prisma ORM 6](https://www.prisma.io/), Row-Level Security (RLS).
- **Security & Auth:** Passport, JWT, bcryptjs, single-use refresh token rotation.
- **Logging & Auditing:** [Pino](https://github.com/pinojs/pino) structured JSON logging with automatic credential redaction.
- **Testing:** [Jest](https://jestjs.io/) (unit/integration), [Supertest](https://github.com/ladjs/supertest) (e2e API testing).
- **Infrastructure:** Docker, Docker Compose, GitHub Actions CI.

---

## 4. Repository Structure

```text
handloom/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions automated CI workflow
├── apps/
│   ├── api/                   # NestJS REST API application
│   │   ├── src/
│   │   │   ├── common/        # Filters, interceptors, guards, decorators
│   │   │   ├── modules/       # Domain modules (auth, health, catalog, etc.)
│   │   │   └── main.ts        # API bootstrap, CORS & Swagger setup
│   │   └── test/              # Supertest live E2E test suites
│   └── web/                   # Next.js 15 presentation web portal
│       └── src/               # App Router pages, components, and layout
├── packages/
│   ├── database/              # Prisma schema, migrations, RLS SQL & tenant runners
│   ├── types/                 # Shared domain interfaces, DTOs & role enums
│   ├── config/                # Shared ESLint, Prettier & TypeScript configs
│   └── logger/                # Pino structured logger with credential redaction
├── docker/
│   └── docker-compose.yml     # Local PostgreSQL 16 & Redis 7 services
├── docs/                      # Engineering standards & architecture documentation
│   ├── ARCHITECTURE.md        # Modular monolith design & component topology
│   ├── BUSINESS_RULES.md      # Handloom lifecycle, custody & half-rate rules
│   ├── DATABASE.md            # PostgreSQL, Prisma, RLS & ledger standards
│   ├── API_STANDARDS.md       # REST conventions, envelopes & OpenAPI rules
│   ├── SECURITY.md            # Authentication, RBAC, RLS & secrets management
│   ├── SCALABILITY.md         # 1k-10k concurrent user architecture & SLOs
│   ├── DEVELOPMENT_WORKFLOW.md# Git workflow, PR reviews & Conventional Commits
│   └── TESTING.md             # Testing tiers, Supertest e2e & completion checklist
├── AGENTS.md                  # Mandatory directives for AI coding agents
├── .env.example               # Sanitized environment variable template
├── pnpm-workspace.yaml        # Workspace configuration
├── turbo.json                 # Turborepo task pipeline orchestration
└── README.md                  # Project overview & quickstart guide
```

---

## 5. Prerequisites

Ensure the following tools are installed on your host machine:

- **Node.js**: `v20.0.0` or higher (`v22 LTS` recommended)
- **pnpm**: `v9.0.0` or higher (`v11.15.1` used)
- **Docker & Docker Compose**: (Optional for local PostgreSQL and Redis containerization)

---

## 6. Quick Start & Local Development

### Step 1: Clone Repository & Setup Environment

```bash
git clone https://github.com/Vendhan1512/Handloom.git
cd Handloom

# Copy environment template
cp .env.example .env
```

### Step 2: Install Dependencies & Generate Prisma Client

```bash
pnpm install
pnpm db:generate
```

### Step 3: Start Local Infrastructure (Docker)

```bash
pnpm docker:up
```

### Step 4: Run Applications in Development Mode

```bash
pnpm dev
```

- **Frontend Portal:** [http://localhost:3000](http://localhost:3000)
- **Backend REST API:** [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
- **Swagger Documentation:** [http://localhost:4000/api/docs](http://localhost:4000/api/docs)
- **System Health Probe:** [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

---

## 7. Quality Gates & Testing

Execute verification commands across all workspaces:

```bash
# Type checking (TypeScript strict mode)
pnpm typecheck

# Unit and integration test suites
pnpm test

# Live NestJS API end-to-end tests
pnpm --filter @handloom/api test:e2e

# Full monorepo production build
pnpm build
```

---

## 8. Development & Git Workflow

We adhere strictly to the sequential task completion cycle:

$$\textbf{ONE TASK} \longrightarrow \textbf{IMPLEMENT} \longrightarrow \textbf{TEST} \longrightarrow \textbf{REVIEW} \longrightarrow \textbf{COMMIT} \longrightarrow \textbf{PUSH} \longrightarrow \textbf{NEXT TASK}$$

All commits follow the **Conventional Commits** standard:

- `feat(...)`: New feature or capability
- `fix(...)`: Bug fix
- `docs(...)`: Documentation updates
- `test(...)`: Unit or E2E tests
- `chore(...)`: Configuration or dependencies

Force-pushing (`git push -f`) and committing credentials are strictly prohibited. See [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) for full details.

---

## 9. AI Coding Agent Directives

All automated coding agents (Antigravity, Claude Code, Codex, Cursor) must consult and comply with [AGENTS.md](AGENTS.md) before proposing or executing changes.

---

## 10. License

Proprietary / All rights reserved.
