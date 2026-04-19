# 0003 — CI uses service containers for integration tests

**Status:** Accepted
**Date:** 2026-04-19
**Deciders:** Initial maintainer

## Context

Phase 3 introduced a Postgres-backed repo and a CLI round-trip eval (case 0009) that
requires a live Postgres. On a developer laptop this runs against the local Postgres
instance. In CI, without action, the eval would see `DATABASE_URL` unset and skip
itself silently — which means CI is green even when the persistence layer is broken.

That's the worst kind of green: a test that exists in name and passes vacuously.

We need CI to provision a Postgres and run the migration before the eval step so that
the round-trip case runs for real on every PR and every push to `main`.

## Decision

Use **GitHub Actions service containers**. The CI job declares a `services.postgres`
block that GitHub brings up as a sidecar container before steps run. The workflow
exports `DATABASE_URL` / `TEST_DATABASE_URL` pointing at the sidecar and invokes
`npm run db:migrate` / `db:migrate:test` before the main check.

Concretely in `.github/workflows/ci.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: harness_starter
    ports: ["5432:5432"]
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

A separate step creates the `_test` database once the primary is up.

## Consequences

**Easier:**
- Eval 0009 runs for real in CI, not skipped.
- Any repo that deploys to production gets its persistence layer tested on every PR.
- Contributors don't need Postgres on their laptop to see CI pass — the environment is reproducible.

**Harder:**
- Slightly slower CI (service container start-up, ~5–10s).
- Workflow YAML gets more complex — more chance for one wrong key to cause silent failure. Mitigation: eval 0009 itself IS the check that the DB is wired correctly.
- Secret values in workflow env vars need care. Postgres password is non-secret (local-only sidecar), but if anyone substitutes a real managed DB here, that becomes a real secret.

**Watch for:**
- Postgres version drift. Pin to `postgres:16` explicitly; do not use `postgres:latest`. Major version upgrades require a planned migration, not a silent workflow edit.
- Service container startup races. Health check is required, not optional. Set `--health-retries` high enough to tolerate a slow runner.
- Future integration tests that want Redis, Kafka, etc. — add them as services in the same pattern; do NOT run them in the job's container itself.

## Options considered

- **Option A: Skip DB tests in CI (chosen before Phase 4).** Rejected — green CI without exercising the DB layer is a lie.
- **Option B: Use a managed cloud Postgres per PR (e.g., Neon branching).** Interesting but adds external dependency, cost, and a credentials problem. Defer until we have a real need.
- **Option C (chosen): service containers.** Standard GitHub Actions feature, zero extra deps, matches local dev closely.

## References

- `.github/workflows/ci.yml`
- `docs/exec-plans/completed/2026-04-19-phase-3-postgres.md`
- GitHub Actions docs: <https://docs.github.com/en/actions/using-containerized-services/about-service-containers>
