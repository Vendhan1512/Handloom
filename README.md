# Handloom Operations Management Platform

[![CI Pipeline](https://github.com/Vendhan1512/Handloom/actions/workflows/ci.yml/badge.svg)](https://github.com/Vendhan1512/Handloom/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%20LTS-brightgreen)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-11.15-orange)](https://pnpm.io/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-11-red)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.4-blueviolet)](https://turbo.build/)

An enterprise-grade, multi-tenant digital management platform orchestrating the complete handloom production lifecycle — from customer orders, yarn inventory, pre-loom processing, loom allocations, cut-piece tracking, and wage calculation to AI-assisted document processing.

---

## 1. Monorepo Architecture

This repository is organized as an enterprise monorepo using **pnpm workspaces** and **Turborepo**:

```text
handloom/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI pipeline
├── apps/
│   ├── api/                   # NestJS REST API with OpenAPI/Swagger & health endpoints
│   └── web/                   # Next.js 15 (App Router, React 19, Tailwind CSS)
├── packages/
│   ├── database/              # PostgreSQL + Prisma ORM client & migrations
│   ├── types/                 # Shared TypeScript interfaces, DTOs & domain enums
│   ├── config/                # Shared ESLint, Prettier & TypeScript configurations
│   └── logger/                # Structured Pino JSON logger with credential redaction
├── docker/
│   └── docker-compose.yml     # Local PostgreSQL 16 & Redis 7 services
├── docs/
│   └── ARCHITECTURE.md        # Architectural design & scalability strategy
├── .env.example               # Sanitized environment variable template
├── pnpm-workspace.yaml        # Workspace configuration
└── turbo.json                 # Turborepo task pipeline orchestration
```

---

## 2. Prerequisites

Ensure the following tools are installed on your host machine:

* **Node.js**: `v20.0.0` or higher (`v22 LTS` recommended)
* **pnpm**: `v9.0.0` or higher (`v11.15.1` used)
* **Docker & Docker Compose**: For local PostgreSQL and Redis

---

## 3. Quick Start & Local Development

### 1. Clone & Configure Environment
```bash
git clone https://github.com/Vendhan1512/Handloom.git
cd Handloom

# Copy environment template
cp .env.example .env
```

### 2. Start Local Infrastructure
Start PostgreSQL (port 5432) and Redis (port 6379):
```bash
pnpm docker:up
```

### 3. Install Dependencies & Generate Database Client
```bash
pnpm install
pnpm db:generate
```

### 4. Start Applications in Development Mode
```bash
pnpm dev
```

* **Frontend Web Portal**: [http://localhost:3000](http://localhost:3000)
* **Backend REST API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
* **API Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)
* **Swagger/OpenAPI Documentation**: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

---

## 4. Verification & Quality Gates

Run all quality checks across the entire monorepo:

```bash
# Type checking
pnpm typecheck

# Unit tests
pnpm test

# Production build
pnpm build
```

---

## 5. Security & Isolation Principles

* **No Plaintext Credentials**: All sensitive keys and passwords use environment variables (`.env`).
* **Strict Redaction**: The `@handloom/logger` package automatically masks passwords, tokens, and authorization headers.
* **Stateless API Design**: The NestJS API tier stores no state in memory, enabling seamless horizontal auto-scaling.
* **ACID Transactions**: Inventory allocations and wage settlements are managed through explicit database transactions.

---

## 6. License

Proprietary / All rights reserved.

