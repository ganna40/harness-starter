#!/usr/bin/env node
// pre-edit-guard.mjs — runs before agent Edit/Write calls (Claude Code PreToolUse hook).
//
// Intent: surface a short reminder of load-bearing docs when the agent is about to
// touch sensitive areas. Does NOT block — prints to stderr and exits 0.
//
// Rationale: blocking PreToolUse on every edit is too noisy. Reminders are enough.

const input = await (async () => {
  try {
    const chunks = [];
    for await (const c of process.stdin) chunks.push(c);
    return JSON.parse(Buffer.concat(chunks).toString() || "{}");
  } catch {
    return {};
  }
})();

const path = input?.tool_input?.file_path || input?.tool_input?.path || "";

const reminders = [];

if (/\.env($|\.)/.test(path) && !/\.env\.example$/.test(path)) {
  reminders.push("⚠  Editing .env. Never commit real secrets. See SECURITY.md.");
}
if (path.endsWith("ARCHITECTURE.md")) {
  reminders.push("ℹ  Changing ARCHITECTURE.md: update scripts/check-structure.mjs to match if boundaries move.");
}
if (path.endsWith("CLAUDE.md")) {
  reminders.push("ℹ  Changing CLAUDE.md: this is the agent briefing — keep rules short and enforceable.");
}
if (/package\.json$/.test(path)) {
  reminders.push("ℹ  Changing package.json: new dependencies require an ADR (docs/decisions/).");
}
if (/^docs\/decisions\//.test(path) || /docs\/decisions\//.test(path)) {
  reminders.push("ℹ  Writing an ADR: never delete existing ADRs. Use 'Superseded by NNNN' instead.");
}

if (reminders.length) {
  for (const r of reminders) process.stderr.write(r + "\n");
}

process.exit(0);
