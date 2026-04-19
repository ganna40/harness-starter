# config/

Environment variables, constants, feature flags.

## Does

- Parse and validate `process.env` at startup.
- Expose a typed `config` object for the rest of the code.
- Define constants that don't belong in `types/` (e.g., "max retries = 3").
- House the logger factory.

## Does NOT

- Do IO. Reading env vars is parsing, not IO.
- Know about business logic.
- Import from `repo/`, `service/`, `runtime/`, or `ui/`.

If a value comes from a database or remote config service, that fetching belongs in `repo/`.
