# Autonomy policy

How much agents are allowed to do without human approval, and how that level changes
over time. The policy is mechanical: each level has entry criteria the repo can measure,
and each demotion trigger is a real signal, not a feeling.

**Current level:** see `ARCHITECTURE.md` footer. Changes to the level go through an ADR.

---

## Levels

### Level 0 — Read-only

**What agents can do:** read code, answer questions, propose changes in chat.
**What agents cannot do:** edit any file, commit, push, open a PR.
**When to use:** brand-new repo, or after a serious incident while trust is being rebuilt.

### Level 1 — Propose only

**What agents can do:** write branches and open PRs on their own branch. All PRs require human review and human merge.
**What agents cannot do:** merge, push to `main`, modify `.github/`, modify any file in `.claude/settings.json`'s `deny` list.
**When to use:** default starting level for any fresh adoption of this harness.

### Level 2 — Merge on green (narrow)

**What agents can do:** everything at Level 1, plus merge their own PRs **only** when ALL of:
  - PR labels include `agent-auto-merge`
  - PR touches only files matching `docs/**`, `evals/cases/**`, `src/**/README.md`
  - `npm run check` is green
  - Quality score on `main` is ≥ 85 (GREEN)
  - No file in the PR matches the `deny` list below

**What agents cannot do:** touch code files, touch CI, touch security-relevant files, bypass `deny`.
**When to use:** after Level 1 has produced ≥ 20 merged PRs with zero reverts for 4 consecutive weeks.

### Level 3 — Merge on green (broad)

**What agents can do:** everything at Level 2, plus merge PRs touching `src/**/*.ts` (including tests) when:
  - All Level 2 criteria, AND
  - Coverage does not drop for touched files, AND
  - Eval pass rate on the PR is 100% (no flakes, no skips that shouldn't skip)

**What agents cannot do:** touch `ARCHITECTURE.md`, `SECURITY.md`, `CLAUDE.md`, `migrations/**`, `docs/decisions/**`, `.github/**`, `.claude/**`. Those always require human merge.
**When to use:** after Level 2 has been stable for 4 weeks with zero production incidents attributable to agent-merged PRs.

### Level 4 — Supervised autonomy

**What agents can do:** everything at Level 3, plus initiate work without a human ticket (picking from the tech debt tracker or the weekly cleanup sweep).
**What agents cannot do:** anything at Level 3's deny list remains denied.
**When to use:** after Level 3 has run stable for 8 weeks and there is explicit maintainer sign-off in an ADR. Likely never for most projects — this level is aspirational.

---

## Deny list (always requires human merge, at every level)

These files touch the contract between humans and agents. Agents propose changes here;
humans merge them. No exceptions until an ADR says so.

- `ARCHITECTURE.md`
- `CLAUDE.md`, `AGENTS.md`
- `SECURITY.md`
- `QUALITY_SCORE.md`
- `docs/design-docs/autonomy.md` (this file)
- `docs/decisions/**`
- `.github/**`
- `.claude/settings.json`
- `migrations/**` (once applied — a bad migration is hard to reverse)
- `scripts/check-*.mjs` (changes to the enforcement layer itself)
- `package.json` dependencies (adds/removes/upgrades)

---

## Promotion criteria (Level N → N+1)

A level promotion is a decision recorded as an ADR and a PR to this file (both
human-merged). The ADR must cite:

1. **Time at current level:** weeks of stable operation at the current level.
2. **Volume:** count of agent-initiated merged PRs at the current level.
3. **Revert rate:** PRs from agents reverted within 7 days. Must be 0 for the trailing period required by the target level.
4. **Quality trend:** score did not drop by ≥ 5 points during the trailing period.
5. **Incidents:** zero production incidents attributable to an agent-merged PR during the trailing period.

If any of those is not met, do not propose promotion. A promotion proposal with bad
numbers in it is a serious error — it says the human doesn't trust the metrics either.

---

## Demotion triggers (immediate, no ADR required)

Any of these immediately drops the repo back to Level 1 (or Level 0 for the severe
cases) until an ADR restores the level:

| Trigger | New level | Rationale |
|---------|:---------:|-----------|
| A production incident traced to an agent-merged PR | 0 | Rebuild trust before re-enabling |
| Quality score drops ≥ 10 points week-over-week | 1 | Something regressed broadly; slow down |
| An agent PR bypasses the deny list (even accidentally) | 1 | Deny list is a hard boundary; investigate how |
| `npm run check` goes red on `main` and stays red > 24h | 1 | Baseline is broken; no autonomous work on a broken baseline |
| An agent disables a test or eval case without a human-approved ADR | 0 | That's the exact failure mode this harness exists to prevent |
| Secret/PII leak committed by an agent | 0 | Rotate, purge, rebuild trust |

Demotion is done by editing this file and `ARCHITECTURE.md`'s footer. The edit is
fast-tracked (one human reviewer, merge immediately) because the cost of waiting is
higher than the cost of a slightly rushed merge.

---

## How agents read this file

If you are an agent working in this repo:

1. Check the current level (in `ARCHITECTURE.md` footer).
2. Before taking an action that might exceed your level, ask yourself: "Is this in the deny list? Is this a file type that requires a higher level than I'm on?"
3. When in doubt, open a PR and stop. Do not merge.
4. If you find a demotion trigger's condition is met (e.g., main is red for > 24h), that's a signal to escalate, not a signal to work around.

The levels exist to protect the project from well-intentioned-but-wrong changes.
Respect them literally, not in spirit. "It was probably fine" is not a defense.

---

## Current state

- **Repo-wide level:** Level 1 (Propose only)
- **Set by:** ADR 0001 (initial setup); confirmed at Phase 4
- **Next review:** after 20 merged PRs or 4 weeks, whichever later
- **Last demotion:** none
