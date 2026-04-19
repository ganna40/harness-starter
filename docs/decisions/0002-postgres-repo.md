# 0002 — Use Postgres as the primary persistence layer

**Status:** Accepted
**Date:** 2026-04-19
**Deciders:** Initial maintainer

## Context

Phase 2 shipped with an in-memory `NoteRepo`. That was sufficient to demonstrate the
layered architecture but has two real limitations:

1. **Per-process state.** The CLI cannot round-trip (`create` in one invocation, `get`
   in the next) because each process starts with an empty `Map`. Behavioral eval case
   0009 had to be rewritten to call the service in-process to work around this.
2. **Doesn't exercise the repo boundary.** The whole point of the `NoteRepo` interface
   is that it abstracts a real IO layer with real failure modes (connections, timeouts,
   serialization). An in-memory `Map` doesn't exercise any of that.

We need persistence. The viable options:

- **SQLite** (file-backed): cheap, no server. But concurrent writers, multi-tenant
  schemas, JSONB, row-level locking are either unsupported or awkward.
- **Postgres**: well-understood failure modes, strong type system, JSONB, strict SQL,
  operational maturity. The user explicitly requested it.
- **Remote managed DB** (Supabase, Neon, RDS): production-shaped but adds external
  dependency for local dev.

## Decision

Use Postgres 16+ as the primary persistence layer, accessed via the `pg` Node driver.

A local Postgres instance is expected for development. A `DATABASE_URL` environment
variable wires the connection. Two databases by convention:

- `harness_starter` — for `npm run notes` and manual testing
- `harness_starter_test` — for integration tests (torn down and rebuilt by the runner)

Migrations are plain `.sql` files in `migrations/`, applied in order by
`scripts/migrate.mjs` and tracked in a `schema_migrations` table.

The `InMemoryNoteRepo` stays in the codebase. It's used by `service/note-service.test.ts`
to test the service with no IO. It is NOT the default runtime choice anymore.

## Consequences

**Easier:**
- CLI round-trip actually works (eval 0009 can go back to spawning the real CLI).
- Real failure modes (connection loss, constraint violations, transactions) become
  testable.
- Adding new tables, indexes, and query patterns follows a standard SQL workflow.

**Harder:**
- Local dev now requires Postgres. A fresh clone cannot run `npm run notes` until
  the DB is up and migrations are applied. `OPERATIONS.md` documents the flow.
- CI needs a Postgres service. GitHub Actions `services:` block will be added in a
  follow-up to the CI workflow.
- Tests that hit the real DB are slower and require teardown. Service-level unit tests
  keep using `InMemoryNoteRepo` via the same interface — they stay fast.

**Watch for:**
- Connection pool sprawl. One pool per process. Initialized in `runtime/wire.ts`.
- Migrations drift. `scripts/migrate.mjs` fails fast if a migration's checksum differs
  from the recorded one.
- Hard-coded `postgres://` strings anywhere outside `config/env.ts`. That's a secret
  leak waiting to happen — keep it in one place.

## Options considered

- **Option A: DIY migration runner (chosen).** Simple, zero deps beyond `pg`. Proves
  the pattern without committing to a migration framework before we know what we need.
- **Option B: drizzle-kit.** More capable (schema diffing, type-safe queries), but
  adds a larger dependency surface at Phase 3. Migrate to it if hand-written SQL
  becomes tedious.
- **Option C: node-pg-migrate.** Popular, but couples us to its templating style.
  Same argument as B — defer.

## References

- `docs/exec-plans/active/2026-04-19-phase-3-postgres.md`
- `migrations/0001-create-notes.sql`
- `src/repo/postgres-note-repo.ts`
- `scripts/migrate.mjs`
