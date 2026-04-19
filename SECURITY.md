# SECURITY.md

Rules for secrets, authentication, authorization, and sensitive data.
Violations must fail CI, not just a human review.

---

## Secrets

### Never in the repo

- No API keys, tokens, private keys, passwords, or connection strings in any committed file.
- That includes: source, tests, fixtures, docs, commit messages, `.claude/settings.json`, GitHub Actions YAML.
- `scripts/check-structure.mjs` runs a secret scan on staged files. A hit fails CI.

### Where secrets live

- Local dev: `.env` (gitignored). Template: `.env.example` (committed, values blank).
- CI: GitHub Actions secrets, referenced by name only.
- Production: your deployment platform's secret manager (document which one in `OPERATIONS.md`).

### Before adding a new secret

1. Add the variable name (not the value) to `.env.example`.
2. Add a parsing entry in `src/config/env.ts`.
3. Document what it's for in the same PR.

---

## Authentication & authorization (boundaries)

- **Authentication** (who is the caller?) is verified at the UI layer: middleware, not controllers.
- **Authorization** (can this caller do this?) is verified at the service layer. Every public service method takes a typed `Actor` and checks permissions up front.
- **Never** infer identity from request headers inside `service/`. The UI layer passes a validated `Actor` object.
- No `service/` method should accept a raw user ID without an `Actor` — that's an authz bypass waiting to happen.

---

## Input validation

- Validate at the boundary: `ui/` parses and validates every input before handing it to `service/`.
- Parsers live in `ui/validators/` (or equivalent). Use a schema library (zod, pydantic, etc.) — do not hand-roll string parsing.
- `service/` trusts its inputs are typed correctly; it does NOT trust business invariants and must enforce them itself.

---

## Logging and PII

### Never log

- Passwords (hashed or plain).
- API tokens, session tokens, JWT contents, cookies.
- Full request or response bodies on endpoints that can carry user data.
- Email addresses, phone numbers, addresses, payment details, government IDs.

### Safe to log

- User IDs (internal), request IDs, trace IDs.
- Event names and structural fields (see `ARCHITECTURE.md` logging rules).
- Error class names and message templates — but never error messages that may contain user input unless sanitized.

### When in doubt

Redact. If a log line *might* contain PII in some execution path, route it through `config/redact.ts` first.

---

## Dependencies

- New dependencies require an ADR (`docs/decisions/`). The ADR must include:
  - License (reject GPL/AGPL unless explicitly approved).
  - Maintenance status (last release within 12 months, or explain).
  - Alternatives considered.
  - Whether this dependency will be loaded at runtime in production or only at build/dev time.
- `npm audit` (or equivalent) runs in CI. High/critical vulnerabilities fail the build.

---

## Data handling

- User data deletion must be supported end-to-end. When a user is deleted, all rows referencing them are deleted or anonymized. Document the deletion path in `OPERATIONS.md`.
- Database backups: encrypted at rest. Access audited. Document retention in `OPERATIONS.md`.
- Test data must be synthetic. Never copy production data into dev or test environments without a documented, reviewed anonymization process.

---

## Agent-specific rules

Agents (Claude Code, Cursor, etc.) working in this repo must:

- **Never commit files that look like secrets** (`.env`, `*.pem`, `id_rsa`, `credentials.json`, etc.). The pre-commit hook blocks this; if the hook fails, do NOT bypass it.
- **Never paste secrets into chat** (including when debugging). Redact before sharing.
- **Never exfiltrate code or data to third-party services** (pastebins, diagram renderers, external LLM playgrounds) without explicit human approval.
- **Escalate immediately** if anything in the working set looks like a production secret or PII.

---

## Reporting a security issue

Internal: open an issue with label `security`, assign to the maintainer. Do not describe the vulnerability in the issue title.

External: see `README.md` for the disclosure contact. (Fill in before going public.)
