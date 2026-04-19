---
description: Start or update an exec plan for the work described in $ARGUMENTS.
---

You are creating or updating an exec plan in `docs/exec-plans/active/`.

Before anything:

1. Read `docs/exec-plans/README.md` (lifecycle + when a plan is needed).
2. Read `docs/exec-plans/TEMPLATE.md` (the required structure).
3. Decide: is this a **small**, **medium**, or **large** change? Use the matrix in the README.
4. If small, recommend skipping the plan and going straight to a PR description. Stop.
5. If medium or large, proceed.

Then:

1. Propose a filename: `YYYY-MM-DD-<slug>.md` under `docs/exec-plans/active/`. Use today's date (check via `date +%Y-%m-%d`).
2. Check if a plan with a similar slug already exists in `active/`. If yes, update it instead of creating a new one.
3. Fill in the template:
   - **Intent:** one paragraph — goal and user-facing outcome.
   - **Acceptance criteria:** concrete, checkable. Ideally tests or eval cases.
   - **Out of scope:** be explicit.
   - **Approach** (medium/large): shape of the change. Layers touched.
   - **Risk & rollback** (medium/large).
4. Leave **decision log** and **status log** empty but with the headers in place.
5. Do NOT start implementing. Output the plan, ask the user to approve or edit, then wait.

The user's request is: $ARGUMENTS
