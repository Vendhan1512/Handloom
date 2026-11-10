# Handloom Platform Architecture & Engineering Blueprint

## 1. System Context & Concurrency Goals

* **Target Capacity:** 1,000–10,000 concurrent active users (supervisors, weaver cooperatives, administrative accountants).
* **System Type:** High-concurrency, multi-tenant Operations & Resource Planning (ERP) platform.
* **Core Tenet:** Strict transactional consistency for physical inventory (yarn/silk lots) and worker wages (piece rates, advances).

---

## 2. Monorepo Separation of Concerns

```mermaid
graph TD
    subgraph Clients
        Web["apps/web (Next.js 15)"]
        Mobile["Future Mobile Client"]
    end

    subgraph API["apps/api (NestJS)"]
        Gateway["REST Ingress (/api/v1)"]
        HealthModule["Health & Diagnostics"]
        FutureModules["Domain Modules (Orders, Inventory, Weaving, Wages)"]
    end

    subgraph Packages
        SharedTypes["packages/types"]
        SharedLogger["packages/logger"]
        SharedDatabase["packages/database (Prisma ORM)"]
    end

    subgraph Infrastructure
        Postgres["PostgreSQL 16 (ACID + RLS)"]
        Redis["Redis 7 (Queues & Read Cache)"]
    end

    Web --> SharedTypes
    Web --> Gateway
    Gateway --> HealthModule
    Gateway --> FutureModules
    FutureModules --> SharedTypes
    FutureModules --> SharedLogger
    FutureModules --> SharedDatabase
    SharedDatabase --> Postgres
    FutureModules --> Redis
```

---

## 3. High-Concurrency Scaling Roadmap

1. **Connection Pooling:**
   * Direct PostgreSQL connections under high concurrency trigger resource exhaustion.
   * Target deployment utilizes PgBouncer or AWS RDS Proxy with strict pool sizing (100–200 server connections).
2. **Asynchronous Background Processing:**
   * High-latency operations (OCR processing of physical weaver books, warp requirement calculation, wage batching) are delegated to Redis-backed BullMQ workers.
3. **Database Concurrency & Inventory Locking:**
   * Inventory allocations will use atomic ledger inserts with optimistic locking (`version` field) to avoid hot-row lock contention across high-throughput looms.
4. **Multi-Tenant Isolation:**
   * Data segregation is enforced at the database level utilizing PostgreSQL Row-Level Security (RLS) linked to the active session `tenant_id`.

