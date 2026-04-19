# Exec plans

Exec plans are first-class artifacts. Non-trivial work gets a plan **before** it gets code.

## Lifecycle

```
  draft → active → completed
                 ↘ abandoned
```

1. **Draft** — lives on a branch, not in `active/`. Use for review of the plan itself.
2. **Active** — merged into `active/`. Work is in progress. Each active plan must have a status update within 14 days or the quality sweep flags it.
3. **Completed** — moved to `completed/` when the work ships. Keep them around; they are the best record of *why* a thing was built.
4. **Abandoned** — if the work is dropped, move the plan to `completed/` with status `ABANDONED` and a short note on why. Don't delete.

## When you need a plan

| Change size | Plan required? | Template |
|------|:-:|--------|
| Single-file bug fix, typo, dep bump | No | Good PR description suffices |
| Multi-file change in one layer | Yes (short) | `TEMPLATE.md`, "Small" section |
| Cross-layer change, new feature, migration | Yes (full) | `TEMPLATE.md` in full |
| Change to `ARCHITECTURE.md`, `CLAUDE.md`, or boundaries | Yes (full) + ADR | Both |

## File naming

```
YYYY-MM-DD-<slug>.md
```

Examples:
- `2026-04-19-add-user-signup.md`
- `2026-04-20-migrate-sessions-to-redis.md`

## Rules

- One plan per unit of work. If a plan grows unbounded, split it.
- The plan is the contract. If you find yourself deviating from it, update the plan in the same PR — don't silently go off-script.
- Close the plan when the work is done. Don't let `active/` accumulate.
- The plan is where **decisions made during implementation** get recorded. "Why did we use X here?" — answer in the plan's decision log.
