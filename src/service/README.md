# service/

Use cases. Business logic. The most important layer.

## Does

- Implement use cases ("sign up a user", "calculate an order total").
- Enforce business invariants ("an email can only be used by one user").
- Enforce authorization ("can Actor X do this?").
- Coordinate repos when a use case spans multiple.

## Does NOT

- Do IO directly. Always through a repo interface.
- Know about HTTP, CLI, or any UI. Takes typed inputs, returns typed outputs.
- Import from `runtime/` or `ui/`.

## Testing

Service methods should be testable without the database:

```
const users = new InMemoryUserRepo();
const svc = new UserService({ users });
await svc.signUp({ actor, email: "x@y.z" });
```

If a service method is hard to test without real IO, that's usually a signal that
IO should be behind a smaller repo interface — refactor the interface, not the test.
