# 0001 — Adopt agent-first harness engineering

**Status:** Accepted
**Date:** 2026-04-19
**Deciders:** Initial maintainer

## Context

AI coding agents (Claude Code, Cursor, Copilot Workspace) can now execute multi-step
engineering work, but their output quality depends heavily on the environment they're
dropped into. Without written constraints, mechanical enforcement, and reproducible
feedback loops, agents drift: they make local changes that violate unstated invariants,
they skip tests, they accumulate plans that never close, and the repo rots.

This project is starting from scratch and wants to be agent-first from day one rather
than retrofitting later.

## Decision

Adopt a harness engineering pattern with these pillars:

1. **Written constraints** in `CLAUDE.md`, `ARCHITECTURE.md`, `SECURITY.md` — read by agents before every change.
2. **Mechanical enforcement** via `scripts/check-*.mjs` and CI — rules that aren't enforced mechanically are wishes.
3. **Plans as artifacts** in `docs/exec-plans/` — work is planned in files, not chat.
4. **Decision log** in `docs/decisions/` — irreversible decisions get ADRs.
5. **Eval harness** in `evals/` — quality is measured, not assumed.
6. **Weekly entropy control** via `scripts/cleanup-sweep.mjs` and a scored `QUALITY_SCORE.md`.
7. **Humans set direction**, agents execute. Level of agent autonomy grows as trust (measured by eval pass rate + PR revert rate) grows.

## Consequences

**Easier:**
- Onboarding a new agent (or human) — the repo self-documents.
- Catching drift — things fail CI instead of getting merged and forgotten.
- Resuming interrupted work — plans persist across sessions.

**Harder:**
- First few weeks — writing templates and scripts before any product work.
- Small changes still need PR template discipline (mitigated: templates allow "small" shortcuts).
- Some ceremony for trivial changes (mitigated: the rules matrix in `docs/exec-plans/README.md`).

**Watch for:**
- Templates and rules becoming ends in themselves. If a rule doesn't catch a real
  failure in 3 months, delete it.
- Agents treating the score as the goal (Goodhart). Humans spot-check.
- Eval coverage gaps. Track which product areas have no eval cases and treat those as S2 tech debt.

## Options considered

- **Option A: Pure prompt engineering (no repo structure).** Rejected — doesn't scale past one agent session.
- **Option B: Full agent platform (build our own hosting, queues, worker pool).** Rejected — overkill for the current scale; we use Claude Code as the host harness for now.
- **Option C (chosen): Repo-as-harness.** The repo itself is the harness; Claude Code (or equivalent) is the runtime.

## References

- `CLAUDE.md`, `ARCHITECTURE.md`, `QUALITY_SCORE.md`
- `docs/design-docs/core-beliefs.md`
