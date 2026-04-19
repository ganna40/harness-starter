# QUALITY_SCORE.md

How quality is measured on this repo. The score is computed weekly (and on demand) by
`scripts/quality-score.mjs` and posted as an issue labeled `quality-report`.

Quality is not a feeling. It's a number with inputs. Disagree with the weights? Open a PR.

---

## Score = weighted sum (0–100)

| Dimension | Weight | Signal |
|-----------|:------:|--------|
| Structure | 20 | `check-structure` passes; import matrix violations = 0 |
| Docs freshness | 15 | `ARCHITECTURE.md` and layer READMEs newer than the latest `src/` change touching the same area |
| Test coverage | 15 | Unit coverage on `service/` ≥ 80%; integration on `repo/` ≥ 60% |
| Eval pass rate | 15 | % of eval cases passing on main |
| Active plan hygiene | 10 | Every `docs/exec-plans/active/` file has a status update in the last 14 days |
| File-size discipline | 10 | # files > 400 lines (penalty: 2 per file, capped at 10) |
| Dependency health | 10 | `npm audit` high/critical = 0; no deps > 12 months stale |
| PR hygiene | 5 | Merged PRs in last 30 days with filled-in template ÷ total |

Total caps at 100. Below 70 = stop and fix; below 50 = freeze feature work.

---

## Running locally

```bash
npm run score               # prints to stdout + writes evals/reports/quality-YYYY-MM-DD.json
npm run score -- --verbose  # shows each dimension's inputs
```

---

## Weekly report

`scripts/quality-score.mjs` is run by a GitHub Action (`.github/workflows/weekly-quality.yml`)
every Monday at 09:00 UTC. The output is posted as an issue. Trends over time live in
`evals/reports/quality-*.json`.

---

## When the score drops

If the weekly report shows a drop of ≥5 points week-over-week:

1. The maintainer (or the next on-call agent) opens an investigation exec plan.
2. The drop dimension is identified — check which input moved.
3. Either the cause is fixed, or the weighting is challenged via PR. Never both.

---

## What this score does NOT measure

- **Feature velocity.** Shipping fast with bad quality shows up in the score as a drop next week, not as a boost.
- **Subjective "nice code".** Refactors for taste without an acceptance criterion don't move the score.
- **External stakeholder happiness.** That's a separate signal. Track it, but not here.

---

## Score tampering

If you find yourself tempted to change the scoring weights to raise the score without
changing the repo, stop. That's cheating. Open an issue describing what you think
should be measured instead, and argue for it on merit.
