<!--
Before opening: did you run `/review` (or `npm run check` + self-review)? If not, go do that first.
-->

## Why

What problem does this solve? Link the exec plan, issue, or product spec.
(If there's no plan/issue, briefly explain why it wasn't needed — this should be rare.)

## What changed

High-level. Skip line-by-line narration — the diff speaks for itself. Call out:

- New files, new dependencies, new directories
- Interface changes (public APIs, schemas, config)
- Behavior changes users will notice

## Acceptance criteria

Copy from the exec plan if there is one. Check each as it's verified.

- [ ] <criterion>
- [ ] <criterion>

## Docs updated

- [ ] `ARCHITECTURE.md` (if boundaries or layers changed)
- [ ] `CLAUDE.md` (if agent rules changed)
- [ ] `SECURITY.md` (if security-relevant)
- [ ] `OPERATIONS.md` (if runtime behavior changed)
- [ ] Relevant exec plan moved/updated
- [ ] Eval case added or updated (if product behavior changed)
- [ ] N/A — no docs affected

## Risk & rollback

- **Biggest risk:** <what could go wrong>
- **How we'd notice:** <monitor, error, user report>
- **Rollback plan:** <revert the PR? revert a migration? flag off?>

## Checklist

- [ ] `npm run check` green locally
- [ ] No commented-out code; every `TODO` has an issue link
- [ ] No new file >400 lines (or justified below)
- [ ] No new top-level dependency (or ADR linked below)
- [ ] No secrets, tokens, or PII in the diff

## For larger-than-expected PRs

If the diff is unusually big, explain why it couldn't be split. ("Cross-layer changes
that would break intermediate commits" is a good reason. "It was easier to do it all
at once" is not.)

<!-- Notes for the reviewer: put anything non-obvious here. -->
