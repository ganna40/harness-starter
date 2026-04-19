---
description: Self-review the current changes before opening a PR.
---

You are doing a pre-PR self-review. Be honest — the goal is to catch issues
**before** a human reviewer has to.

Steps:

1. Run `git status` and `git diff` to see what's changed.
2. Run `npm run check`. If it fails, stop and fix — do not continue reviewing.
3. Walk through the self-review checklist from `CLAUDE.md`. For each item, report PASS / FAIL / N/A with one sentence of evidence.
4. Additionally check:
   - **Scope creep:** does every change trace to the stated intent? Flag any that don't.
   - **Commented-out code / stray `TODO` without issue link:** list them.
   - **Secrets / PII in diffs:** scan the diff for anything that looks like a credential or personal data.
   - **New dependencies:** did any `package.json` deps change? If yes, is there an ADR?
   - **Docs lag:** did you touch a public interface, a boundary, or documented behavior? If yes, is the doc updated in the same diff?
   - **File size:** any new file over 400 lines? Justified?
   - **Error handling:** any `catch` that swallows, any `throw "string"`, any unhandled rejection?
5. If there is an active exec plan for this work, check:
   - Is every acceptance criterion met?
   - Has the decision log been updated for any non-obvious choices made?
   - Should the status move to "completed"?
6. Produce a final verdict:
   - **READY** — open the PR.
   - **NEEDS FIX** — list the specific items to address, in priority order.

Do not sugar-coat. A "NEEDS FIX" from you is cheaper than a "NEEDS FIX" from a human reviewer.
