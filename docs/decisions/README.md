# Architectural Decision Records (ADRs)

A lightweight log of decisions that shaped this repo. We use a slimmed-down form
based on Michael Nygard's ADR format.

## When to write one

- Choosing a new dependency or framework
- Crossing or changing a layer boundary
- Picking a pattern that will repeat (e.g., "all IDs are ULIDs")
- Any decision a future engineer will want to re-litigate ("why did they do it this way?")

## When NOT to write one

- Task-level tactical choices (those go in the exec plan's decision log)
- Reversible implementation details

## Format

Use `TEMPLATE.md`. File name: `NNNN-slug.md`, where `NNNN` is a zero-padded sequence.

## Status values

- **Proposed** — under review
- **Accepted** — in force
- **Superseded by NNNN** — replaced; link the replacement
- **Deprecated** — no longer in force but not replaced

Never delete an ADR. History matters more than tidiness.
