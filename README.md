# harness-starter

An **agent-first** software development harness. Designed so that AI coding agents
(Claude Code, Cursor, etc.) can develop inside this repo with minimal human supervision,
while humans retain authority over direction, priorities, and approval gates.

## What this repo is

Not an application. A **template** — a set of files, rules, scripts, and workflows
that turn any repo into an environment where agents can reliably execute engineering
work. Copy these files into your project, or fork and fill in the stack-specific bits.

## Core idea

Humans set direction and acceptance criteria. Agents implement, test, review, document,
evaluate, and clean up. The harness is what makes that safe and reproducible:

- **Written constraints** that agents read before every change (`CLAUDE.md`, `ARCHITECTURE.md`)
- **Mechanical enforcement** via lint, tests, CI, hooks (so rules don't just live in docs)
- **Plans as first-class artifacts** (`docs/exec-plans/`) — work is planned in the repo, not in chat
- **Evaluation harness** (`evals/`) — quality is measured, not assumed
- **Entropy control** (`scripts/cleanup-sweep.mjs`, weekly quality score) — rot is detected, not hoped against

## Start here

1. Read `CLAUDE.md` — the agent briefing.
2. Read `ARCHITECTURE.md` — the rules of the house.
3. Read `docs/design-docs/core-beliefs.md` — why the rules exist.
4. Run `npm install && npm run check` — should pass on a clean clone.

## Structure

```
.
├── CLAUDE.md              Agent briefing (primary)
├── AGENTS.md              Pointer to CLAUDE.md (for AGENTS.md-aware tools)
├── ARCHITECTURE.md        Layers, boundaries, forbidden imports
├── SECURITY.md            Secrets, PII, authz
├── OPERATIONS.md          Run, debug, observe
├── QUALITY_SCORE.md       How quality is measured
├── .claude/               Claude Code configuration (hooks, commands, permissions)
├── .github/               PR template, CI workflows
├── docs/
│   ├── design-docs/       Durable principles and designs
│   ├── exec-plans/        In-flight and completed work plans
│   ├── decisions/         ADRs (architectural decision records)
│   ├── product-specs/     Product requirements (what to build)
│   └── references/        External-system pointers (Linear, Grafana, etc.)
├── evals/                 Evaluation harness — cases, runner, reports
├── scripts/               Quality gates, structure checks, cleanup sweeps
└── src/                   Application code (layered, see ARCHITECTURE.md)
```

## For humans collaborating with agents

Your job in this repo:

1. **Write the intent** — open an exec plan or a product spec.
2. **Set acceptance criteria** — what does "done" mean?
3. **Review PRs at the level of "did this meet the criteria"**, not line-by-line.
4. **When you give feedback twice, promote it** — from chat, into a doc, a rule, or a script. Agents can't remember across sessions; the repo can.

## License

MIT. See `LICENSE`.
