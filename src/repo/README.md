# repo/

The IO boundary. Databases, HTTP clients, filesystem, queues, caches.

## Does

- Implement interfaces declared in `types/`.
- Own all external protocol details (SQL strings, HTTP URLs, message formats).
- Handle IO-level errors (connection timeout, 5xx retries with backoff).
- Map external shapes into domain types before returning.

## Does NOT

- Contain business logic. "Can this user do this?" belongs in `service/`.
- Import from `service/`, `runtime/`, or `ui/`.
- Expose external types (raw DB rows, raw HTTP response bodies) to callers. Always map to `types/`.

## Pattern

```
types/user-repo.ts           ← interface UserRepo { findById(id: UserId): Promise<User|null>; }
repo/postgres-user-repo.ts   ← class PostgresUserRepo implements UserRepo
repo/http-user-repo.ts       ← class HttpUserRepo   implements UserRepo (for tests, mocks)
```

`service/` depends on the interface, not the implementation. `runtime/` wires in the concrete one.
