# OPERATIONS.md

How to run, debug, and observe this system. Written so an agent can diagnose
production issues without asking a human for tribal knowledge.

---

## Running locally

### Prerequisites

<!-- REPLACE with your stack. Example: -->
<!-- - Node.js 20.x -->
<!-- - Docker (for local Postgres) -->
<!-- - pnpm 9.x -->

[TEMPLATE — fill in.]

### First-time setup

```bash
git clone <repo>
cd <repo>
cp .env.example .env       # fill in values — see SECURITY.md
npm install
npm run check              # should pass on a clean clone
npm run dev                # start the app
```

If `npm run check` fails on a clean clone, **stop and flag it**. That's a broken baseline
and no agent work should proceed on top of it.

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
