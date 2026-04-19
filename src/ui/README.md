# ui/

User-facing entry points. HTTP handlers, CLI commands, web components.

## Does

- Parse and validate inputs at the boundary (every input is untrusted).
- Authenticate the caller and build a typed `Actor` to pass into `service/`.
- Serialize service outputs into protocol-appropriate responses (JSON, HTML, CLI text).
- Map service errors to protocol errors (HTTP status codes, CLI exit codes).

## Does NOT

- Call `repo/` directly. Go through `service/`.
- Contain business rules. "Users with role X can see Y" belongs in `service/`.
- Import from peer `ui/` packages in ways that create cycles (e.g., CLI importing from web).

## Pattern

```
// ui/http/routes/users.ts
app.post('/users', async (req, res) => {
  const input = UserSignupInput.parse(req.body);          // validation at boundary
  const actor = await authenticateActor(req);             // identity at boundary
  const user = await services.users.signUp(actor, input); // service owns the rule
  res.status(201).json(user);                             // protocol mapping
});
```
