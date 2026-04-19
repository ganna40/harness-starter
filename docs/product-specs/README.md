# Product specs

What we are building and why. A product spec answers:

- Who is this for?
- What pain does it remove or what job does it do?
- What does success look like? (Measurable.)
- What are we explicitly not doing?

## Format

One file per feature or epic. Name: `YYYY-MM-DD-<slug>.md` when relevant, or stable
names (`user-signup.md`, `billing.md`) for evergreen areas.

## Relationship to other docs

- A **product spec** says what and why.
- An **exec plan** says how, with acceptance criteria.
- An **ADR** captures a load-bearing decision made along the way.

A feature typically has one product spec and one or more exec plans as it evolves.

## Template

```markdown
# <Feature name>

**Status:** Proposed | Approved | Shipped | Sunset
**Owner:** <PM / maintainer>
**Target users:** <who>

## Problem

What is the user pain or business need?

## Solution (sketch)

What we'll build. Not implementation — shape.

## Success metrics

Concrete numbers. E.g., "40% of new signups complete onboarding within 24h"
or "p95 search latency under 200ms". If it can't be measured, reword it until it can.

## Non-goals

What we are not doing and why.

## Open questions

Things the PM or maintainer needs to decide before this can turn into an exec plan.
```
