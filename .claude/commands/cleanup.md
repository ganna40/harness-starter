---
description: Run the entropy sweep and propose cleanup PRs.
---

You are running periodic maintenance. The goal is to surface rot and propose
**small, reviewable, reversible** cleanup PRs — not a mega-refactor.

Steps:

1. Run `npm run cleanup:sweep`. Read its output carefully.
2. For each category of finding, decide whether it warrants a PR:

   - **Orphan docs** (docs referenced nowhere, or referencing dead paths) → usually yes, small PR.
   - **Stale exec plans** (`active/` with no update in >14 days) → ping the owner; if owner is gone or agent-owned, close with a "ABANDONED" status and move to `completed/`.
   - **Dead code** (unreferenced exports) → verify with `grep` before deleting. If used only by tests, question whether the test is meaningful.
   - **Duplicate code** → prefer extraction ONLY if the duplicates are semantically the same. Two similar-looking pieces that do different things should stay separate.
   - **Files over 400 lines** → propose a split plan, but don't split in the same PR that flagged it.
   - **Stale dependencies** → propose an upgrade ADR for majors; minors can go in a single cleanup PR.
   - **`TODO` without issue link** → either open an issue or delete the TODO. No middle ground.

3. For each cleanup you want to make:
   - Open a short exec plan (it IS a change).
   - Bundle related cleanups; do NOT make one PR per line.
   - Prefer deletion over refactoring. Every deletion is a win.

4. Rules:
   - **Never** delete something you haven't traced. "Looks unused" is not proof.
   - **Never** refactor "while you're there" — that's the exact pattern this harness forbids.
   - **Always** run `npm run check` after each cleanup commit.
   - If a finding looks like it needs a human decision (e.g., whether to keep a feature flag), open an issue instead of a PR.

5. At the end, report:
   - What you cleaned up and in which PRs.
   - What you flagged but didn't touch (with reason).
   - Whether the quality score should move after these PRs merge.
