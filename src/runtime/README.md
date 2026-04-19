# runtime/

Wiring, orchestration, long-running processes.

## Does

- Construct concrete `repo/` implementations and inject them into `service/`.
- Run schedulers, workers, queue consumers.
- Compose services into workflows ("on new signup, send welcome email AND seed workspace").
- Own startup and shutdown sequencing.

## Does NOT

- Contain business logic. Delegate to `service/`.
- Handle user-facing concerns. That's `ui/`.
- Get imported by `service/` or `repo/`.

## Pattern

```
// runtime/wire.ts
export function buildServices() {
  const users = new PostgresUserRepo(config.db);
  const events = new KafkaEventBus(config.kafka);
  return {
    users: new UserService({ users, events }),
  };
}
```

`ui/` asks `runtime/` for services; `runtime/` owns the wiring.
