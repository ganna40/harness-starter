# <Plan title>

**Status:** draft | active | completed | abandoned
**Owner:** <name or agent>
**Opened:** YYYY-MM-DD
**Last update:** YYYY-MM-DD

---

## Intent (one paragraph)

What are we trying to do, and why? If a reader stops here, they should understand
the goal and the user-facing outcome.

## Acceptance criteria

Concrete, checkable. An agent can tell whether each is met.

- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

If a criterion is "passes test X", link the test file. If it's "no regression in metric Y",
link the dashboard.

---

## Out of scope

What this plan is **explicitly not** doing. Scope creep dies here.

- <thing 1>
- <thing 2>

---

# Small changes — stop here.

Everything below is for **medium and large** changes.

---

## Approach

High-level shape of the change. Layers touched, new files, new dependencies.
Skip implementation detail — that goes in the PR.

## Risk & rollback

- What is the biggest thing that could go wrong?
- How do we detect it?
- How do we roll back? (Code? Data? Config?)

## Decision log

Decisions made while implementing. Append-only. Format:

### YYYY-MM-DD — <decision>
- **Context:** <why we had to choose>
- **Options:** <what we considered>
- **Chose:** <what we picked>
- **Because:** <why>

---

## Status log

Append-only. Every 7 days minimum while status is `active`.

### YYYY-MM-DD
- <what moved, what's next, what's blocked>

---

## Definition of done

- [ ] All acceptance criteria met
- [ ] Docs updated (`ARCHITECTURE.md`, layer READMEs, `OPERATIONS.md` if runtime behavior changed)
- [ ] Eval cases added or updated for new behavior
- [ ] `npm run check` green
- [ ] Plan moved to `completed/` with final status note
