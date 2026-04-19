# OPERATIONS.md

How to run, debug, and observe this system. Written so an agent can diagnose
production issues without asking a human for tribal knowledge.

---

## Running locally

### Prerequisites

- Node.js 20+ (tested on 20 and 25)
- npm 10+
- PostgreSQL 16+ running on `localhost:5432`

### First-time setup

```bash
git clone <repo>
cd <repo>

# 1. Create the databases (only once per machine)
createdb harness_starter
createdb harness_starter_test

# 2. Copy env and adjust DATABASE_URL if your Postgres needs a different user/host
cp .env.example .env
$EDITOR .env   # set DATABASE_URL to match your local Postgres

# 3. Install + migrate
npm install
npm run db:migrate
npm run db:migrate:test

# 4. Verify everything is green
npm run check

# 5. Smoke test the CLI
npm run notes -- create --actor=user:alice --title=hello --body=world
```

If `npm run check` fails on a clean clone, **stop and flag it**. That's a broken
baseline and no agent work should proceed on top of it. Most common cause: `.env`
missing or `DATABASE_URL` wrong — verify with `psql $DATABASE_URL -c 'SELECT 1'`.

### Common commands

| Command | What it does |
|---------|--------------|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | Biome check (lint + format) |
| `npm run lint:fix` | Apply safe Biome fixes |
| `npm test` | Vitest watch mode |
| `npm run test:coverage` | Vitest + coverage (writes `coverage/`) |
| `npm run check` | Full gate: typecheck + lint + test + structure + docs + eval |
| `npm run score` | Compute quality score (reads last coverage run + `npm audit`) |
| `npm run cleanup:sweep` | Surface entropy candidates (non-modifying) |
| `npm run db:migrate` | Apply migrations to `DATABASE_URL` |
| `npm run db:migrate:test` | Apply migrations to `TEST_DATABASE_URL` |
| `npm run db:reset:test` | Drop + recreate test DB tables (safe — refuses non-test URLs) |
| `npm run notes -- <cmd>` | Exercise the layered example (`create`, `get`, `list`) |
| `PORT=3000 npm run serve` | Start the HTTP server (reads `DATABASE_URL`) |

### HTTP API

Base URL: `http://localhost:$PORT` (default 3000). All JSON; all mutating requests
need `X-Actor: user:<id>` (see `SECURITY.md` — this is a placeholder for real auth).

| Method | Path | Body | Returns |
|--------|------|------|---------|
| `GET`  | `/healthz` | — | `200 {ok: true}` |
| `POST` | `/notes`   | `{title, body?}` | `201 Note` |
| `GET`  | `/notes/:id` | — | `200 Note` or `403` (not owner) or `404` |
| `GET`  | `/notes` | — | `200 Note[]` (actor's own only) |

Error responses:
- `400 VALIDATION` — zod parse failed or service rejected
- `401 ACTOR_MISSING` — `X-Actor` header missing
- `403 UNAUTHORIZED` — actor is not the note's owner
- `404 NOT_FOUND` — unknown route or unknown note id
- `500 INTERNAL` — unexpected; check logs

### Database

- **Primary DB:** `harness_starter` — used by `npm run notes` and local dev.
- **Test DB:** `harness_starter_test` — used by Postgres contract tests. Tests `TRUNCATE notes` between cases; `npm run db:reset:test` recreates tables if needed.
- **Migrations:** `migrations/NNNN-*.sql`, applied in order, tracked in `schema_migrations` with sha256 checksums. Never edit an applied migration — add a new one.
- **Connection pool:** one per process, opened by `src/runtime/wire.ts`, closed via `services.shutdown()`. The CLI calls shutdown in its `finally` block so the process exits cleanly.

### Single-command feature bring-up

Every feature should have a single command that brings it up with realistic test data.
Agents use this for bug repro.

```bash
npm run feature:<name>     # e.g., npm run feature:user-signup
```

If a feature doesn't have one, that's a gap — add it in the same PR that touches the feature.

---

## Reproducing bugs

When a bug is reported, the first step is a minimal repro. Ideal form:

```bash
npm run repro -- --bug=<issue-number>
```

This runs a scripted scenario that fails on the bug. Add the repro script under
`scripts/repros/<issue-number>.mjs` as part of the bug fix PR. Keep it after the fix —
it becomes a regression test.

---

## Observability

### Logs

- Structured JSON, one event per line.
- Schema: `{level, ts, event, trace_id, span_id, ...fields}`.
- `event` is a stable dotted name. See `ARCHITECTURE.md` logging rules.
- Local: logs go to stdout. Aggregate with `npm run logs | jq`.
- Production: <!-- REPLACE: e.g., "shipped to Datadog, dashboard at X" -->

### Metrics

<!-- REPLACE with your metrics stack. Example: -->
<!-- - OpenTelemetry → Prometheus → Grafana -->
<!-- - Dashboard: https://grafana.internal/d/app-overview -->

Key metrics to add for any new endpoint / background job:
- Request rate
- Error rate
- p50 / p95 / p99 latency
- Downstream call success rate

### Traces

Every request gets a `trace_id`. Pass it through to every downstream call and log line.
`trace_id` is how agents correlate a user-reported bug with server behavior.

### Errors

<!-- REPLACE with your error tracker. Example: Sentry, project "app-web" -->

When investigating an error:
1. Find the `trace_id` in the error.
2. Pull all logs for that `trace_id`.
3. Read the stack + the log sequence together — not one in isolation.

---

## Debugging checklist (for agents)

Before concluding "I can't reproduce":

1. Did you run `npm install`? Is your local build stale?
2. Is your `.env` populated? Compare against `.env.example`.
3. Are you testing the right version? `git log -1`.
4. Is the baseline green? `npm run check`.
5. Did you look at the logs, not just the error message? Failures usually have context 3–5 lines earlier.
6. Is this flaky? Run it 5 times. If 1/5 fails, mark `@flaky` and open an issue — do NOT delete or skip.

If all green and you still can't reproduce, **escalate with**: (a) what you tried, (b) what you saw, (c) what you expected, (d) what documentation would have unblocked you.

---

## Deployment

<!-- REPLACE with your deployment flow. Example: -->
<!-- - `main` auto-deploys to staging on merge -->
<!-- - Production deploy: manual, via `gh workflow run deploy-prod` -->
<!-- - Rollback: `gh workflow run rollback --ref=<commit>` -->

### Rollback

Every deploy must have a documented rollback. If a PR introduces something that can't
be rolled back cleanly (DB migration, data backfill, irreversible external call),
the PR description must call that out under **Rollback plan**.

---

## Incidents

When production breaks:
1. **Stop the bleed.** Rollback first, investigate second. A rollback is always safer than a hotfix.
2. **Communicate.** <!-- REPLACE: e.g., "#incidents Slack channel" -->
3. **Document.** Open an incident doc under `docs/incidents/YYYY-MM-DD-<slug>.md`. Capture timeline, user impact, root cause, and follow-ups.
4. **Follow up.** Every incident gets at least one action item that lands as a merged PR — usually a test, a monitor, or a doc.

---

## Environments

| Env | URL | Deploys from | Data |
|-----|-----|--------------|------|
| local | http://localhost:3000 | your laptop | your `.env` |
| staging | <!-- fill --> | `main` | synthetic |
| production | <!-- fill --> | manual | real user data |

Never point local or staging at production data. See `SECURITY.md`.

---

## On-call

<!-- REPLACE with your on-call setup. Example: -->
<!-- - PagerDuty schedule "app-primary" -->
<!-- - Runbooks in `docs/runbooks/` -->

Every alert must point to a runbook. If an alert fires and there's no runbook,
add one in the follow-up PR. An alert without a runbook is noise.
