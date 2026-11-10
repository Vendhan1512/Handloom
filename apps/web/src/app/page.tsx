import { Layers, ShieldCheck, Activity, Terminal } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex-1 flex flex-col justify-center items-center px-4 py-16">
      <div className="max-w-4xl w-full space-y-12">
        {/* Header */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Monorepo Baseline Ready · Task 8.1.2 Verified
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Handloom Operations Platform
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Enterprise foundation for digitizing the end-to-end handloom manufacturing lifecycle,
            loom tracking, inventory, and wage settlements.
          </p>
        </div>

        {/* Foundation Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Turborepo & Workspaces</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Strict TypeScript boundaries separating Next.js web portal, NestJS API, and shared database/types packages.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">ACID & RLS Ready</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              PostgreSQL 16 with Prisma ORM configured for multi-tenant isolation and strict inventory transactions.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base">Stateless NestJS Core</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Stateless API tier designed for horizontal scaling (1k-10k concurrent users) with OpenAPI documentation.
            </p>
          </div>
        </div>

        {/* Verification Command Box */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-slate-200 p-6 shadow-inner space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Core Verification Endpoints</span>
            </div>
            <span className="text-xs font-mono text-slate-500">API Prefix: /api/v1</span>
          </div>
          <div className="space-y-2 font-mono text-xs md:text-sm">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">GET</span>
              <span className="text-slate-300">/api/v1/health</span>
              <span className="text-slate-500 ml-auto">Infrastructure Status</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400 font-bold">GET</span>
              <span className="text-slate-300">/api/docs</span>
              <span className="text-slate-500 ml-auto">OpenAPI / Swagger Spec</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
