# Design docs index

Durable documents that explain *why* this repo is shaped the way it is.
If the *what* or *how* changes, update `ARCHITECTURE.md` or the relevant layer README.
If the *why* changes, it belongs here.

---

## Documents

- [`core-beliefs.md`](./core-beliefs.md) — the ten beliefs that drive every rule in this repo.
- [`autonomy.md`](./autonomy.md) — how much agents can do without human approval, Level 0–4, with promotion/demotion rules.

## When to add a new design doc here

- A large cross-cutting concern (observability strategy, multi-tenancy, data model).
- A subtle invariant that applies across layers (e.g., "all timestamps are UTC-stored, user-TZ-rendered").
- Anything that, if lost, would make the repo hard to evolve.

## When NOT to add a new design doc here

- Task-level decisions → `docs/decisions/` (ADR)
- In-flight work → `docs/exec-plans/active/`
- Product requirements → `docs/product-specs/`
- External-system pointers → `docs/references/`
