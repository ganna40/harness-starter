# Tech debt tracker

Known debt. Each item has an owner (can be "unclaimed") and a severity.
Fixing an item: open a short exec plan, reference this file, remove the row when done.

**Severity key:**
- **S1** — actively hurts users or blocks work. Fix within 1 sprint.
- **S2** — slows development or has a workaround. Fix within 1 quarter.
- **S3** — would be nice. Fix when adjacent work touches the area.

---

| ID | Area | Severity | Description | Found | Owner |
|----|------|:-:|-------------|-------|-------|
| TD-0001 | harness | S3 | `scripts/quality-score.mjs` uses placeholder scoring — wire real inputs when stack is chosen | 2026-04-19 | unclaimed |

## Rules

- Adding an item is free — anyone (human or agent) can add one during any PR.
- Removing an item requires the underlying work to be merged.
- Reviewing this list happens monthly. Stale items either get resurfaced or explicitly deferred with a date.
- If `S1` items pile up, feature work freezes until drained.
