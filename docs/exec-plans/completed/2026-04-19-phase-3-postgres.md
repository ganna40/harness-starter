# Phase 3 — Replace in-memory repo with Postgres

**Status:** completed
**Owner:** agent (claude-code)
**Opened:** 2026-04-19
**Last update:** 2026-04-19

---

## Intent

Replace the Phase 2 in-memory `NoteRepo` with a real Postgres-backed implementation
while keeping the in-memory version around for fast service unit tests. This removes
the per-process-state limitation, exercises the repo boundary against a real IO layer,
and lets the CLI round-trip eval (0009) test the actual CLI again.

## Acceptance criteria

- [x] `pg` and `dotenv` installed; `@types/pg` in devDeps
- [x] Local Postgres databases `harness_starter` and `harness_starter_test` exist
- [x] `DATABASE_URL` parsed in `src/config/env.ts`
- [x] `scripts/migrate.mjs` applies SQL files in `migrations/` in order, tracked in `schema_migrations`
- [x] `migrations/0001-create-notes.sql` creates the notes table with proper constraints
- [x] `src/repo/postgres-note-repo.ts` implements `NoteRepo` against Postgres
- [x] Contract tests: the same behavioral tests run against both `InMemoryNoteRepo` and `PostgresNoteRepo` (Postgres tests gated on `TEST_DATABASE_URL`)
- [x] `runtime/wire.ts` uses Postgres when `DATABASE_URL` is set, in-memory otherwise
- [x] Eval 0009 rewritten to test the real CLI round-trip (create then get in separate processes)
- [x] `npm run check` passes against Postgres
- [x] `OPERATIONS.md` documents the DB setup flow for a fresh clone
- [x] ADR 0002 merged

## Out of scope

- Multi-tenancy or row-level security (single schema, single DB for now)
- Migrations with down/rollback steps (forward-only for this phase)
- Connection pool tuning (use `pg` defaults)
- Secret management beyond `.env` (Vault, AWS SM, etc. — Phase 4)
- CI Postgres service block (follow-up PR to `.github/workflows/ci.yml`)
- ORM / query builder (raw SQL is fine for a single table)

## Approach

**Layers touched:**
- `config/env.ts` — add `DATABASE_URL`, `TEST_DATABASE_URL`
- `repo/postgres-note-repo.ts` — new
- `repo/contract.ts` — new, shared behavioral tests
- `runtime/wire.ts` — conditional repo choice
- `scripts/migrate.mjs` — new
- `migrations/0001-create-notes.sql` — new

**DI pattern:** runtime reads `DATABASE_URL`. If present, opens a `pg.Pool` and passes
it into `PostgresNoteRepo`. Otherwise falls back to `InMemoryNoteRepo`. This lets
tests that don't need the DB stay fast, and lets the CLI work against real Postgres.

**Migration runner:** plain Node script that reads `migrations/*.sql` in lexical order,
checks `schema_migrations` for which have been applied, applies new ones in a
transaction each, records checksums. Fails if a previously-applied migration's
checksum has changed (indicates someone edited a migration after applying it —
never do this, always add a new migration).

**Contract tests:** a single parameterized describe block runs against each
implementation. Factory signature: `(makeRepo: () => Promise<{repo: NoteRepo, cleanup: () => Promise<void>}>)`.
In-memory runs always; Postgres only runs when `TEST_DATABASE_URL` is set.

## Risk & rollback

- **Risk:** connection pool leak if runtime/wire.ts doesn't close the pool on process exit. Mitigation: register `process.on("beforeExit")` cleanup in the CLI entry point.
- **Risk:** migration runner misbehaves on partial apply. Mitigation: each migration in its own transaction; `schema_migrations` insert happens inside the same transaction.
- **Risk:** tests leave junk in the test DB. Mitigation: `contract.ts` truncates the notes table in `beforeEach`; full DB recreation is documented but not automatic (too slow).
- **Rollback:** `git revert` the Phase 3 commit. Phase 2 (in-memory only) still works; nothing else broke.

## Decision log

### 2026-04-19 — Local Postgres instead of Docker Compose
- **Context:** planned docker-compose.yml but Docker daemon is down on this machine; Homebrew Postgres 16 is already running on :5432.
- **Chose:** use the local instance, document the `createdb` flow. Keep docker-compose.yml as a follow-up for machines without local Postgres.
- **Because:** shipping what works now is more valuable than a hypothetical container setup. Docker flow can be added in a follow-up without rewriting the repo code.

### 2026-04-19 — DIY migrations
- See ADR 0002.

## Status log

### 2026-04-19 — plan opened
- ADR 0002 accepted. Starting implementation.

### 2026-04-19 — plan completed
- All acceptance criteria met.
- Real CLI round-trip across two processes verified manually and via eval 0009 against a real Postgres database.
- Contract tests pattern proves both repos satisfy the same interface (5 tests × 2 impls = 10 passing).
- Surprise: the initial `wire.test.ts` wanted the real DATABASE_URL because it calls `buildServices()` with no repo override. Fixed by passing `repo: new InMemoryNoteRepo()` in the test, keeping the unit test fast and DB-independent.
- Surprise: process hangs on exit if pg pool isn't ended. Wired `services.shutdown()` into CLI's `finally` block; runtime contract now requires callers to shut down.
- Biome's organizeImports re-sorted a few imports and reformatted the migration runner's template strings. Safe/unsafe auto-fixes applied and re-verified.

## Retrospective notes

- **What worked:** the contract-test pattern (one `runRepoContract(label, factory)` called from both impl-specific test files) gave us 5 shared behavioral tests for free, with Postgres-specific gating handled at the file level. Carry this forward for every repo interface.
- **What caught us:** the first version of eval 0009 skipped silently because the DATABASE_URL was not reaching the helper. Fix: `import "dotenv/config"` at the top of every entry point that reads env. Added to the pattern.
- **Phase 4 candidates:**
  - GitHub Actions `services: postgres:` block so CI can run evals that require DB.
  - Docker Compose fallback for machines without a local Postgres.
  - `npm audit fix` pass on moderate vulns.
  - HTTP entry point (`src/ui/http/`) to exercise the `ui/` layer with a second transport.

## Definition of done

- [x] All acceptance criteria met
- [x] Plan moved to `completed/`
- [x] `OPERATIONS.md` updated
- [x] `.env.example` updated
- [x] Phase 3 commit on main
