# References

Pointers to where information lives in external systems. Kept in the repo so agents
can find them without asking a human.

## Format

One line per external resource. Keep it factual — no commentary, no status ("seems slow lately").
Commentary goes in an incident doc or an exec plan.

---

## Example entries (replace with real ones)

- **Issue tracker:** <!-- Linear project "APP", URL --> — where bugs and feature requests live
- **Monitoring:** <!-- Grafana dashboard URL --> — request rates, latencies, error rates
- **Error tracking:** <!-- Sentry project "app-web" URL -->
- **Logs:** <!-- Datadog saved view URL -->
- **Design files:** <!-- Figma project URL -->
- **Docs for non-engineering stakeholders:** <!-- Notion / Confluence URL -->
- **Runbooks:** <!-- If externally hosted, else docs/runbooks/ -->
- **On-call schedule:** <!-- PagerDuty / Opsgenie URL -->
- **Deployment dashboard:** <!-- Vercel / Fly / CD tool URL -->

## Rules

- Keep URLs under version control, not just in people's bookmarks.
- If a URL changes, update this file in the same PR as the change.
- If a resource gets retired, remove the line. Don't leave dead pointers.
