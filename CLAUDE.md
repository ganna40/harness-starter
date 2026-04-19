# CLAUDE.md

Briefing for AI coding agents (Claude Code, Cursor, etc.) working in this repo.
Read this before every non-trivial change.

---

## What this repo is

<!-- REPLACE with product purpose, one paragraph. Example: -->
<!-- "A web app that does X for users Y. The primary value is Z. -->
<!--  Production at https://example.com. Users are internal ops staff." -->

[TEMPLATE — fill in before first real change.]

## Sources of truth

When these disagree with the code, **the code wins** — update the doc in the same PR.

| File | Covers |
|------|--------|
| `ARCHITECTURE.md` | Layer boundaries, allowed imports, directory rules |
| `docs/design-docs/core-beliefs.md` | Product/engineering principles (why the rules exist) |
| `docs/exec-plans/active/` | In-flight work — check here before starting anything |
| `docs/decisions/` | ADRs — past decisions and their rationale |
| `docs/design-docs/autonomy.md` | **How much you can do without human approval** — read before merging |
| `SECURITY.md` | Secrets, PII, authz rules |
| `QUALITY_SCORE.md` | How quality is measured on this repo |
| `OPERATIONS.md` | How to run, debug, observe |

---

## Non-negotiable rules

1. **No silent scope creep.** A bug fix fixes the bug. Cleanup goes in its own PR with its own plan.
2. **No commented-out code.** Delete it. Git keeps history.
3. **No secrets in the repo.** Not in code, tests, fixtures, or commit messages. Use `.env` (gitignored). Required vars go in `.env.example`.
4. **Respect layer boundaries.** See `ARCHITECTURE.md`. If you need to cross one, write an ADR first (`docs/decisions/TEMPLATE.md`).
5. **Keep docs honest.** If your change makes `CLAUDE.md`, `ARCHITECTURE.md`, or any design doc incorrect, fix the doc in the same PR.
6. **No `--no-verify`, no `--force` on shared branches, no disabling tests to make CI pass.** Fix the underlying issue.
7. **Files over 400 lines need justification** in the PR body.
8. **No new top-level dependencies** without an ADR.
9. **No new top-level directories** without updating `ARCHITECTURE.md`.

---

## Before you change anything

1. Read the relevant source-of-truth doc(s) above.
2. Check `docs/exec-plans/active/` — is this work already planned? If yes, follow the plan. If no and the change is non-trivial (>1 file, or touches a boundary, or changes a public interface), **write an exec plan first** using `docs/exec-plans/TEMPLATE.md`.
3. Run `npm run check` to confirm the baseline is green. If main is red, stop and flag it — do not build on a broken baseline.

## After you change something

1. `npm run check` must pass. Fix, don't bypass.
2. If you touched a public interface, a boundary, or a documented behavior, **update the relevant doc in the same PR**.
3. If your change completes or invalidates an exec plan, move it to `docs/exec-plans/completed/` or update its status.
4. Fill out `.github/pull_request_template.md` — especially the **Why** section and the self-review checklist.
5. If you discovered a new invariant while working, **codify it**:
   - Prefer a lint rule or test (strong enforcement — add to `scripts/check-structure.mjs` or write a test)
   - Fall back to a documented rule (weak enforcement — add to this file or `ARCHITECTURE.md`)
   - Never rely on "I'll remember next time"

---

## Escalation — stop and ask the human when:

- You need to cross a layer boundary and no ADR covers it.
- You are about to touch a file in `docs/design-docs/autonomy.md`'s **deny list** — those always require human merge regardless of autonomy level.
- The autonomy level you're on doesn't permit the action you're about to take (check `docs/design-docs/autonomy.md`).
- A test fails and you cannot explain why after reading the relevant code.
- A dependency needs to be added, upgraded, or removed.
- The task scope is unclear or the exec plan is silent on a decision you must make.
- Something in your working set looks like a secret, PII, or production data.
- You are about to take a destructive or hard-to-reverse action (force push, history rewrite, dropping data, deleting files you did not create).

**Do not:**
- Delete or modify `.env`, git config, or CI secrets.
- Rewrite history on shared branches (`main`, `develop`, release branches).
- Disable a failing test to make CI pass. If the test is wrong, fix it. If it's flaky, mark it `@flaky` and open an issue; don't delete it.
- Create a new top-level directory or config file type silently.

---

## Security posture (see also `SECURITY.md`)

- All user input is untrusted until validated at a boundary (repo or service layer).
- Never log secrets, tokens, or PII. Logging rules are in `OPERATIONS.md`.
- Third-party code additions (new dependencies, copy-paste from the internet) require an ADR.

## Working with plans (see also `docs/exec-plans/README.md`)

- For a **small change** (single-file bug fix, dependency bump, doc edit): no plan needed — a good PR description is enough.
- For a **medium change** (multi-file, affects one layer): a short exec plan (TEMPLATE.md, "small" section) before coding.
- For a **large change** (cross-layer, new feature, migration): a full exec plan with acceptance criteria, rollback plan, and decision log before coding.

---

## Self-review checklist (run before opening a PR)

- [ ] `npm run check` is green locally
- [ ] No commented-out code; every task marker has an issue link or a date-cutoff
- [ ] Docs updated if behavior or interface changed
- [ ] Exec plan updated, completed, or closed
- [ ] PR description explains the **why**, not just the **what**
- [ ] No new file >400 lines (or justified in PR body)
- [ ] No new top-level dependency or directory (or ADR written)
- [ ] Relevant eval case added or updated (if product behavior changed)

---

## If you fail

When a task doesn't work, don't "try harder." Ask:

1. **What capability am I missing?** (A tool? An MCP server? A skill?)
2. **What document would have told me the answer?** (If none, write it.)
3. **What guardrail would have caught my mistake earlier?** (If none, add it.)
4. **What test would have caught this before PR?** (Add it.)

Escalate to the human with that analysis, not just "I'm stuck."
