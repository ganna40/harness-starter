# src/

Application code. Layered per `ARCHITECTURE.md`.

```
types/   → config/  → repo/  → service/  → runtime/  → ui/
```

Outer layers import inner. Never the reverse. Enforced by `scripts/check-structure.mjs`.

Each layer has a `README.md` explaining its role and what it does NOT do.
