# types/

Shared types, interfaces, enums. Pure.

## Does

- Define domain entities (`User`, `Order`, `Session`).
- Define cross-layer interfaces (`UserRepo`, `EventBus`) so service/ can depend on types/ instead of repo/.
- Define branded primitives (`UserId`, `Email`).
- Define error classes.

## Does NOT

- Import anything from this repo outside `types/`.
- Contain runtime logic. No functions with side effects. Type-only.
- Have IO.

If you find yourself writing a function that does work in `types/`, you're in the wrong layer.
