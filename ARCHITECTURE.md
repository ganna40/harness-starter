# ARCHITECTURE.md

The rules of the house. Mechanical enforcement lives in `scripts/check-structure.mjs`.
If a rule here isn't enforced mechanically, it's a wish, not a rule — treat that as a bug.

---

## Layers

Outer depends on inner. Never the reverse. Never skip sideways into a peer.

```
┌─────────────────────────────────────────┐
│  ui/         UI, CLI, HTTP handlers     │  ← user-facing entry points
├─────────────────────────────────────────┤
│  runtime/    Orchestration, workflows   │
├─────────────────────────────────────────┤
│  service/    Use cases, domain logic    │  ← pure business rules
├─────────────────────────────────────────┤
│  repo/       DB, HTTP clients, adapters │  ← IO boundary
├─────────────────────────────────────────┤
│  config/     Env parsing, constants     │
├─────────────────────────────────────────┤
│  types/      Shared types, no runtime   │  ← zero dependencies
└─────────────────────────────────────────┘
```

### Allowed import directions

| From ↓ / To → | types | config | repo | service | runtime | ui |
|---------------|:-----:|:------:|:----:|:-------:|:-------:|:--:|
| `types/`      | ✓     | ✗      | ✗    | ✗       | ✗       | ✗  |
| `config/`     | ✓     | ✓      | ✗    | ✗       | ✗       | ✗  |
| `repo/`       | ✓     | ✓      | ✓    | ✗       | ✗       | ✗  |
| `service/`    | ✓     | ✓      | ✓    | ✓       | ✗       | ✗  |
| `runtime/`    | ✓     | ✓      | ✓    | ✓       | ✓       | ✗  |
| `ui/`         | ✓     | ✓      | ✗    | ✓       | ✓       | ✓  |

Note: `ui/` may not import `repo/` directly. Go through `service/`. This keeps data access
policies (authz, validation, transactions) in one layer.

### Forbidden in all layers

- Import cycles of any kind (even within a layer).
- Importing from outside `src/` except for typed interfaces in `types/`.
- Deep relative paths (`../../..`) — either pull the import up or restructure.
- Re-exporting implementation types from `types/` (types stay type-only — no runtime code).

---

## Directory layout

```
src/
├── types/      # Pure types, interfaces, enums. No IO. No runtime imports.
├── config/     # Env vars, constants, feature flags.
├── repo/       # All external IO: DB, HTTP, filesystem, queues.
├── service/    # Business logic. Pure where possible. Depends on repo via interfaces.
├── runtime/    # Wiring, workflows, long-running processes, schedulers.
└── ui/         # Controllers, routes, CLI entry points, rendering.
```

Each layer has a `README.md` explaining its role and a 1-line rule of what it does NOT do.

---

## File-level rules

- **Length limit: 400 lines per file.** Warning at 300, hard fail at 500.
- **Naming:** `kebab-case.ts` for files, `PascalCase` for types, `camelCase` for functions/vars.
- **One default export max** per file (prefer named exports).
- **No god modules.** If a file imports from more than 8 different local modules, consider splitting.

---

## Error handling

- Errors at a layer boundary (`repo/` → `service/`, `service/` → `ui/`) must be typed.
- Never `catch (e) { /* swallow */ }`. Log with context or rethrow.
- Never `throw "string"` — always `throw new TypedError(...)`.
- Error types live in `types/errors.ts`.

## Logging

- Logger comes from `config/logger.ts`. Do not `console.log` outside `ui/` entry points.
- Log lines are structured JSON: `{level, ts, event, ...fields}`.
- `event` is a stable dotted name: `"repo.user.fetch_failed"`, not `"failed to fetch user"`.
- Never log: passwords, tokens, full request bodies, PII. See `SECURITY.md`.

---

## When to add a new top-level directory under `src/`

Write an ADR first (`docs/decisions/TEMPLATE.md`). The ADR must:
1. Name the new layer and its purpose.
2. Update the import matrix above.
3. Update `scripts/check-structure.mjs` to enforce the new boundary.
4. Get merged before any code goes in the new directory.

## When to cross a boundary

You don't. If you need to, one of these is true:

- **(a) The boundary was wrong.** Write an ADR, update this file, update the check script. Then make the import.
- **(b) Your dependency shape is wrong.** Restructure. Usually this means: an interface belongs in `types/` or `service/`, and the concrete implementation stays where it is.

Never silently cross. The check script will fail CI.

---

## Dependency-injection pattern

`runtime/` wires concrete implementations into `service/`. `service/` never imports concrete
`repo/` classes directly; it imports interfaces from `types/`.

```
types/user-repo.ts       ← interface UserRepo
repo/postgres-user-repo  ← class PostgresUserRepo implements UserRepo
service/user-service.ts  ← constructor(deps: { users: UserRepo })
runtime/wire.ts          ← new UserService({ users: new PostgresUserRepo(...) })
```

This makes `service/` testable without the DB and keeps the dependency direction clean.

---

## Autonomy level

**Current level: Level 1 — Propose only.**

Agents may open PRs; humans merge. See `docs/design-docs/autonomy.md` for the full
policy, promotion criteria, and the deny list of files that require human merge
regardless of level.
