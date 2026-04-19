# Evals

The eval harness. Quality is measured here, not assumed.

## Philosophy

Tests verify code correctness. **Evals verify product correctness.**
A test can pass while the product is broken. An eval fails when the product stops doing what it promised the user.

We run three tiers:

1. **Structural evals** — does the repo still meet its own rules? (Run on every PR.)
2. **Behavioral evals** — does the product behave as specified? (Run on every PR touching product code.)
3. **Quality evals** — how well does the product behave? (Run nightly, not gating.)

---

## Layout

```
evals/
├── README.md             this file
├── harness/
│   └── run.mjs           runner
├── cases/
│   ├── 0001-*.json       one file per case
│   └── ...
└── reports/
    └── <date>.json       run outputs (gitignored)
```

## Case format

Each case is a small JSON file. The runner loads all `cases/*.json` and executes them.

```json
{
  "id": "0001",
  "title": "Short human-readable title",
  "tier": "structural | behavioral | quality",
  "description": "One paragraph: what is this case checking, and why does it matter?",
  "type": "command | fixture | http",
  "command": "node scripts/check-structure.mjs --json",
  "expect": {
    "exitCode": 0,
    "stdoutContains": [],
    "stdoutNotContains": [],
    "jsonPath": { "$.violations.length": 0 }
  },
  "tags": ["structure", "ci-gating"]
}
```

### `type: command`
Runs a shell command. Checks exit code and (optionally) stdout.

### `type: fixture`  (roadmap — not yet implemented)
Runs a function against a fixture and compares output.

### `type: http`  (roadmap — not yet implemented)
Hits an endpoint on a running server and validates the response.

---

## Running

```bash
npm run eval                  # all cases
node evals/harness/run.mjs --tier structural  # one tier
node evals/harness/run.mjs --json             # JSON output for CI
node evals/harness/run.mjs --case 0003        # one case
```

## Exit codes

- **0** — all cases passed
- **1** — one or more cases failed
- **2** — harness error (missing cases, malformed JSON, etc.)

## When to add a case

- A bug is reported → add a case that fails, then fix it (case turns green).
- A new feature ships → add at least one golden-path case and one failure-path case.
- A regression happens in production → add a case for it.

## When to delete a case

- The product decision it reflects has been reversed. Delete with a PR that explains why.
- The case is proven useless (hasn't caught anything in 6 months AND tests equivalent invariant).

## Agent rules

- Never disable a case to make the run pass. Never lower `expect` thresholds to paper over a regression.
- If a case is wrong (tests the wrong thing), fix the case in its own PR with justification.
- If a case is flaky, tag it `"flaky": true` in the case file — it will be reported but not gate CI — and open an issue.
