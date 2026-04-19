# 0004 — HTTP transport uses Node built-in `http`, not a framework

**Status:** Accepted
**Date:** 2026-04-19
**Deciders:** Initial maintainer

## Context

Phase 5 adds an HTTP entry point to the `ui/` layer. This is partly feature work but
mainly *proof work* for the harness: it demonstrates that `ui/` is truly decoupled
from the CLI transport chosen in Phase 2. A second transport either validates the
architecture or exposes a hidden coupling.

The three viable options:

- **Node built-in `http` + a hand-rolled dispatch function** — zero new dependencies, small surface.
- **fastify** — modern, TypeScript-native, plugin ecosystem, low overhead.
- **express** — ubiquitous but unmaintained-feeling, heavy middleware baggage.

The project currently has one resource (notes) with three operations
(create/get/list). We will add more resources in the future, but right now the scope
does not require a framework.

## Decision

Use Node's built-in `http` module with a small route-dispatch function in
`src/ui/http/router.ts`. Input validation stays in zod (already a dep). Error
mapping is a pure function in `src/ui/http/error-mapper.ts`.

We'll adopt **fastify** (not express) when the first of these becomes true:

1. We exceed ~5 routes and the hand-rolled dispatcher starts feeling brittle.
2. We need plugins the ecosystem solves well (auth, rate-limiting, OpenAPI gen).
3. We need Keep-Alive tuning, HTTP/2, or streaming responses we don't want to hand-roll.

When that day comes, the migration is contained: the outer world (services, repo,
types) does not change. Only `src/ui/http/router.ts` and `server.ts` get rewritten.

## Consequences

**Easier:**
- No new runtime dependency, no new CVE surface, no new version-drift risk.
- The HTTP layer stays small and readable — new contributors can trace a request end-to-end in under 50 lines.
- `npm audit` and the deps score dimension don't degrade.

**Harder:**
- Features like cookie parsing, CORS, rate limiting, or content negotiation are hand-rolled. We will cross those bridges one at a time in their own ADRs, or trigger the fastify migration if they pile up.
- Developers used to `app.get('/path', handler)` have a brief adjustment. Mitigated by a readable `router.ts`.

**Watch for:**
- Slippage: if `router.ts` starts growing regex special cases or middleware-like hooks, that's the signal to adopt fastify. Document that the trigger was hit; do not silently let the hand-roll become a bad framework.
- Security: built-in `http` does not set security headers for you. If we serve anything HTML/browser-facing, that becomes a concern. For JSON APIs it's less of an issue, but still document in `SECURITY.md` when we add any browser-reachable endpoint.

## Options considered

- **Option A (chosen): Node built-in `http`.** Zero deps; minimal; proves the layering.
- **Option B: fastify.** Better long-term choice; premature at Phase 5. Deferred until a trigger condition is met.
- **Option C: express.** Historical default; slower-moving maintenance; no compelling reason when fastify exists.

## References

- `src/ui/http/server.ts`, `src/ui/http/router.ts`, `src/ui/http/error-mapper.ts`
- `docs/exec-plans/active/2026-04-19-phase-5-http.md`
