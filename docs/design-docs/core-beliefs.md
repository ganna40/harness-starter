# Core beliefs

Durable principles that drive the rules in this repo. When a rule feels arbitrary,
check here — it usually traces back to one of these.

When a belief stops being true, update this file in a PR and explain why.

---

## 1. The repo is the memory

Agents forget between sessions. Humans forget between quarters. The repo doesn't.

Everything load-bearing — rules, decisions, principles, invariants — lives in the repo
as committed files. Not in chat, not in Slack, not in someone's head. If it matters
next week, write it down in the repo this week.

## 2. Mechanical enforcement beats documented rules

A rule in a markdown file is a wish. A rule in a lint script is an invariant.
Any time we can promote a documented rule to a mechanical check, we do.
Order of preference:

1. Type system (strongest — can't even compile it wrong)
2. Test
3. Lint / AST check
4. Pre-commit hook
5. CI gate
6. Documented rule (weakest — depends on discipline)

If you find yourself writing a rule at level 6 for the third time, promote it.

## 3. Plans are artifacts, not conversations

Non-trivial work gets a plan before it gets code. The plan is a file in the repo,
not a paragraph in a chat. This means:

- It's reviewable.
- It's resumable (the next session can pick it up).
- It's comparable to the PR that ships it.
- It's searchable (someone in 3 months can find out why).

## 4. Acceptance criteria over "done when it feels right"

Every non-trivial task has an acceptance criterion written before work starts.
Ideally it's a test. At minimum, it's a checklist in the exec plan.
"I'll know it when I see it" is not an acceptance criterion.

## 5. Quality is a number

Intuition about quality doesn't scale across agents or across time. We pick inputs,
weight them, and publish a number. See `QUALITY_SCORE.md`. When the number drops,
we investigate. When we want to change the number's meaning, we change it in a PR
and argue the change on merit.

## 6. Small reversible decisions > perfect irreversible ones

Most decisions are two-way doors. Make them fast, review them in a week.
Few are one-way doors. Those get an ADR and more care.
Treating every decision like a one-way door kills velocity. Treating every decision
like a two-way door creates sprawl. Know which is which.

## 7. Failure modes are features

"What happens when this breaks?" is part of the feature, not a follow-up. An eval
case that fails in an interesting way is a gift. Hide-the-failure fixes (catch-all,
silent retry, default value) are regressions.

## 8. Boring is the win condition

Novel technology choices must justify themselves against the boring alternative.
Boring doesn't mean bad — it means well-understood failure modes. If you want
something exotic, write an ADR and defend it.

## 9. Delete more than you add

Every week, some file, config, dependency, or rule is no longer pulling its weight.
`scripts/cleanup-sweep.mjs` surfaces candidates. Removal PRs are as valuable as
feature PRs. Maintenance is the work.

## 10. Feedback becomes rules

If a human gives the same feedback twice, that's a signal the feedback should not
depend on a human. Promote it: to a rule in `CLAUDE.md`, to a check in a script,
to a test, to an eval case. The goal is that the human never has to say it a third time.
