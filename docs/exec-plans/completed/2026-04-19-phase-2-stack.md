# Phase 2 — Wire real stack (TypeScript + Node)

**Status:** completed
**Owner:** agent (claude-code)
**Opened:** 2026-04-19
**Last update:** 2026-04-19

---

## Intent

Turn the Phase 1 scaffold into a runnable system by choosing a concrete stack
(TypeScript + Node 20), wiring real tooling (Biome, Vitest, tsx, Zod), and
demonstrating one feature end-to-end through all six architectural layers.
After Phase 2, the harness has its placeholders replaced with real measurements
(coverage, deps) and the layer boundaries are proven by a working example,
not just documented.

## Acceptance criteria

- [x] `tsconfig.json`, `biome.json`, `vitest.config.ts` present and referenced by `package.json` scripts
- [x] `npm install` completes cleanly
- [x] `npm run typecheck`, `npm run lint`, `npm run test` all green
- [x] One feature (Notes CRUD) implemented across `types/` → `config/` → `repo/` → `service/` → `runtime/` → `ui/`
- [x] Service unit tests (no IO) pass; integration test against in-memory repo passes (18 tests total)
- [x] `scripts/quality-score.mjs` uses real vitest coverage and real `npm audit` — no placeholders for coverage/deps
- [x] At least 2 behavioral eval cases (shipped 3: golden path, authz rejection, CLI smoke)
- [x] `npm run check` passes
- [x] Quality score ≥ 90/100 — landed at 94/100 GREEN (was 85/100 on Phase 1)
- [x] `check-structure.mjs` still zero violations (new code respects the boundaries)

## Out of scope

- HTTP transport (CLI is sufficient to exercise `ui/`; HTTP is Phase 2.5)
- Database persistence (in-memory repo proves the pattern)
- Multi-tenant authz (single Actor model)
- Deployment (Phase 3)
- Autonomy level changes (Phase 3)

## Approach

**Tooling choices:**
- `typescript` + `tsx` — type check with `tsc --noEmit`, run with `tsx` (no build step for dev/test)
- `@biomejs/biome` — single tool for lint + format (fast, zero-config)
- `vitest` — tests + coverage (`@vitest/coverage-v8`)
- `zod` — input validation at `ui/` boundary

**Layers touched:**
- New files in every `src/*` directory
- `scripts/quality-score.mjs` — replace coverage and deps placeholders
- New eval cases under `evals/cases/`
- `OPERATIONS.md` — fill in "Running locally" stack bits

**Feature:** Notes CRUD with actor-based authz. Every note has an `ownerId`;
a `get` by a different actor fails with `Unauthorized`. Small enough to fit in
Phase 2, large enough to exercise all six layers honestly.

## Risk & rollback

- **Risk:** adding deps pulls in transitive packages with vulnerabilities. Mitigation: `npm audit` is gated in `npm run check` after Phase 2 — a fresh bad dep will surface immediately.
- **Risk:** the example feature becomes load-bearing and people (or agents) add real product code on top of it. Mitigation: name the files `note-*` with a comment marking them as the canonical layering reference — a future real feature should copy the shape, not extend the files.
- **Rollback:** `git revert` the Phase 2 commit. Phase 1 scaffold is self-contained and works without any of this.

## Decision log

### 2026-04-19 — TypeScript over pure JS
- **Context:** harness tooling is already Node (.mjs); need to pick whether application code is TS or plain JS.
- **Options:** (a) JS + JSDoc types, (b) TypeScript with build step, (c) TypeScript with `tsx`
- **Chose:** (c) — TS with `tsx` for dev/test + `tsc --noEmit` for type checks in CI.
- **Because:** real type safety beats JSDoc for agent readability; `tsx` avoids a separate build directory that would clutter the harness demos.

### 2026-04-19 — Biome over ESLint + Prettier
- **Context:** need lint + format.
- **Options:** (a) ESLint + Prettier (standard but two tools + many plugins), (b) Biome (one binary, Rust, fast).
- **Chose:** (b).
- **Because:** fewer dependencies, one config file, faster on CI, zero-config defaults are already opinionated. If we outgrow it, ESLint migration is mechanical.

### 2026-04-19 — In-memory repo, not Postgres
- **Context:** need a concrete repo to wire through runtime.
- **Chose:** in-memory `Map`-backed `NoteRepo`.
- **Because:** proves the interface pattern without a DB dependency. Real DB is a Phase 2.5/3 concern.

### 2026-04-19 — CLI for `ui/`, not HTTP
- **Context:** `ui/` must be exercised end-to-end.
- **Chose:** a tiny Node CLI entry point.
- **Because:** no framework dep (express/fastify), exercises input validation and actor parsing without a server lifecycle. HTTP can be added later without changing service/ or repo/.

## Status log

### 2026-04-19 — plan opened
- Writing the plan before any code. Kicking off implementation next.

### 2026-04-19 — plan completed
- All acceptance criteria met on first pass.
- Surprise: behavioral eval cases that shelled out to the CLI twice (`create` then `get`) fail because the in-memory repo is per-process. Restructured to call the runtime programmatically in `evals/harness/*.mjs`. The CLI is separately smoke-tested by `cli-smoke.mjs` (single invocation).
- Surprise: `@types/node` was not transitively available; had to add explicitly.
- Biome flagged style issues in the pre-existing `.mjs` scripts from Phase 1. Safe + unsafe auto-fixes applied; scripts still function identically (verified by rerunning the full chain).
- 6 moderate vulnerabilities in transitive dev deps (via `glob@10.5.0`). Within `SECURITY.md` threshold (high/critical = 0). Captures as a score dimension (deps 4/10).

## Retrospective notes

- **What worked:** the harness caught real integration issues early — the per-process-repo limitation would have been found by the behavioral eval on the first CI run anyway.
- **What to carry forward:** Phase 2 restructured the eval cases to use programmatic helpers. That pattern (thin JSON case → small `.mjs` scenario script) is the right default for anything exercising more than a single command. Document in `evals/README.md` in a follow-up.
- **Phase 3 candidates surfaced:**
  - File-backed or SQLite repo so the CLI round-trip can actually round-trip (and CLI integration evals become honest).
  - `npm audit` fix pass to clear the 6 moderate vulns (+6 score points for free).
  - `pr-hygiene` dimension: wire gh CLI when the repo has a remote.

## Definition of done

- [ ] All acceptance criteria met
- [ ] `docs/exec-plans/active/2026-04-19-phase-2-stack.md` moved to `completed/`
- [ ] `OPERATIONS.md` updated with `npm install` + test commands
- [ ] `ARCHITECTURE.md` unchanged (the point of Phase 2 is that the rules already work)
- [ ] Phase 2 commit on main
