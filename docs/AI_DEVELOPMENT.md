# AI-Assisted Development Protocol & Agent Governance (docs/AI_DEVELOPMENT.md)

## 1. Operating Model for AI Coding Agents

In the Handloom platform, AI coding assistants (Google Antigravity, Claude Code, Cursor, Codex) operate as **pair programmers and implementation assistants**. They do not act as autonomous architects or unmonitored decision-makers.

### Core Working Tenet

AI agents must adhere to the bounded task protocol:
$$\textbf{ONE TASK} \longrightarrow \textbf{IMPLEMENT} \longrightarrow \textbf{TEST} \longrightarrow \textbf{REVIEW} \longrightarrow \textbf{COMMIT} \longrightarrow \textbf{PUSH} \longrightarrow \textbf{NEXT TASK}$$

---

## 2. Authoring Bounded Implementation Prompts

To achieve optimal, reliable code generation from AI agents, prompts must follow the **Bounded Task Specification**:

### Good Prompt Pattern

- **Role:** Explicitly define the engineering persona (e.g., Staff Backend Engineer, Database Architect).
- **Domain Scope:** Pinpoint the exact module (e.g., `apps/api/src/modules/catalog`).
- **Non-Functional Requirements:** Specify strict types, Decimal precision, test coverage, and tenant isolation.
- **Explicit Exclusions:** Explicitly prohibit modifying unrelated packages, changing dependencies unnecessarily, or creating mock data.
- **Verification Commands:** Specify exact local commands (`pnpm typecheck`, `pnpm test`, `pnpm build`).

### Anti-Pattern to Avoid

- _"Build the entire ERP platform."_ (Causes context exhaustion, shallow mock code, and broken monorepo boundaries).
- _"Fix all errors automatically."_ (Risks blind deletion of working tests or suppression of compiler checks).

---

## 3. Providing Repository Context

AI agents should be given precise file pointers rather than massive raw text dumps:

1. Direct the agent to review [`AGENTS.md`](../AGENTS.md) first.
2. Provide relative file paths to existing models ([`schema.prisma`](../packages/database/prisma/schema.prisma)) and types ([`packages/types/src/domain.ts`](../packages/types/src/domain.ts)).
3. Use Antigravity rules (`.agents/rules/*.md`) which are automatically injected based on workspace directory scope.

---

## 4. Reviewing AI-Generated Code

Human engineers must review AI-generated code against [`docs/CODE_REVIEW.md`](./CODE_REVIEW.md). Specifically verify:

1. **No Synthetic Test Passes:** Ensure the agent executed actual commands and reported raw exit codes.
2. **No Hallucinated Packages:** Check `package.json` to ensure the agent did not introduce unvetted third-party npm libraries.
3. **No Direct Ledger Alterations:** Ensure inventory and wage writes pass through transactional services and DTO validation, not ad-hoc SQL updates.
4. **No Type Suppressions:** Verify absence of `// @ts-ignore`, `// @ts-nocheck`, or `any` casts.

---

## 5. Preventing Conflicting AI Edits

When multiple agents or parallel sessions contribute to the repository:

1. **Branch Isolation:** Each agent must work on a dedicated task branch (`feature/<task-name>`).
2. **File Boundary Scoping:** Avoid having two agents simultaneously modify the same module controller or Prisma schema file.
3. **Pre-Task Pull:** Always ensure local branch is synchronized with upstream `main` (`git pull origin main`) before starting a new task.

---

## 6. Diagnosing & Handling Failed Tests

When an automated test or build gate fails during AI implementation:

1. **Do Not Delete the Test:** Never delete or disable a failing test to artificially pass CI.
2. **Read the Full Error Stack:** Identify the exact assertion failure or exception.
3. **Execute the Minimal Test in Isolation:**
   ```bash
   pnpm --filter @handloom/api test -- -t "specific test description"
   ```
4. **Apply Surgical Fix:** Fix the underlying logic in the service, DTO, or query, then re-run the full test suite.

---

## 7. Tracking Task Completion & Auditability

Every AI implementation task concludes with a mandatory final report documenting:

1. **Files Modified/Created:** Exact relative paths with functional descriptions.
2. **Executed Commands:** Local verification commands with real exit codes and pass counts.
3. **Git Metadata:** Commit hash, conventional commit message, and upstream push confirmation.
4. **Next Task Recommendation:** Clear pointer to the subsequent planned phase.
