#!/usr/bin/env node
// cleanup-sweep.mjs — surface entropy candidates for cleanup PRs.
//
// This script NEVER modifies the repo. It only reports. Cleanup is a human-or-agent
// decision, not a cron job, because mistaken deletions are expensive.
//
// Findings:
//   - Files with unlinked task markers (use 'TODO(#123):' or a URL)  // harness-ignore-todo
//   - Active exec plans not updated in 14+ days
//   - `docs/exec-plans/completed/` files that still reference in-progress items
//   - Files over the soft size limit
//   - Orphan doc files (referenced by no other markdown file)
//   - (Placeholder) dead code — requires stack-specific tooling; wire in when stack is picked
//
// Output: human-readable report + JSON at evals/reports/sweep-YYYY-MM-DD.json

import {
  readFileSync,
  readdirSync,
  statSync,
  existsSync,
  writeFileSync,
  mkdirSync,
} from "node:fs";
import { join, relative, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir)) {
    if (e === "node_modules" || e.startsWith(".")) continue;
    const full = join(dir, e);
    const s = statSync(full);
    if (s.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const allFiles = walk(ROOT);
const report = {
  generatedAt: new Date().toISOString(),
  findings: {
    todos: [],
    stalePlans: [],
    oversizeFiles: [],
    orphanDocs: [],
  },
};

// ---- TODOs without issue link ----
// Skips:
//   - lines containing `harness-ignore-todo` (explicit opt-out for meta-code)
//   - regex literals that define the TODO matcher itself (`/TODO/` etc.)
for (const f of allFiles) {
  if (![".md", ".ts", ".tsx", ".mjs", ".js", ".py"].includes(extname(f))) continue;
  const lines = readFileSync(f, "utf8").split("\n");
  lines.forEach((line, i) => {
    if (!/\bTODO\b/.test(line)) return;
    if (/harness-ignore-todo/.test(line)) return;
    if (/TODO\s*\(#\d+\)/.test(line)) return;
    if (/TODO.*https?:\/\//.test(line)) return;
    // Skip regex-literal mentions of task markers in this tool's own patterns  // harness-ignore-todo
    if (/\/TODO[\\\]\b\/\.]/.test(line) || /\/\\bTODO\\b\//.test(line)) return;  // harness-ignore-todo
    report.findings.todos.push({ file: relative(ROOT, f), line: i + 1, text: line.trim() });
  });
}

// ---- Stale exec plans ----
const activeDir = join(ROOT, "docs/exec-plans/active");
if (existsSync(activeDir)) {
  const fortnightMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const entry of readdirSync(activeDir)) {
    if (!entry.endsWith(".md")) continue;
    const full = join(activeDir, entry);
    const age = now - statSync(full).mtimeMs;
    if (age > fortnightMs) {
      report.findings.stalePlans.push({
        file: `docs/exec-plans/active/${entry}`,
        ageDays: Math.floor(age / (24 * 60 * 60 * 1000)),
      });
    }
  }
}

// ---- Oversize files ----
const SOURCE_EXTS = new Set([".js", ".mjs", ".ts", ".tsx", ".py"]);
for (const f of allFiles) {
  if (!SOURCE_EXTS.has(extname(f))) continue;
  const n = readFileSync(f, "utf8").split("\n").length;
  if (n > 400) {
    report.findings.oversizeFiles.push({ file: relative(ROOT, f), lines: n });
  }
}

// ---- Orphan docs ----
// A doc counts as referenced if another .md file mentions its path, basename, OR
// any ancestor directory (a directory-level link like `docs/decisions/` covers all children).
const mdFiles = allFiles.filter((f) => extname(f) === ".md");
const mdContent = Object.fromEntries(mdFiles.map((f) => [f, readFileSync(f, "utf8")]));
for (const f of mdFiles) {
  const name = basename(f);
  if (name === "README.md" || name === "TEMPLATE.md" || name === ".gitkeep") continue;
  if (name === "CLAUDE.md" || name === "AGENTS.md") continue;
  const rel = relative(ROOT, f);
  const ancestors = [];
  let p = rel;
  while (p.includes("/")) {
    p = p.slice(0, p.lastIndexOf("/"));
    ancestors.push(p + "/");
  }
  const referenced = mdFiles.some((other) => {
    if (other === f) return false;
    const content = mdContent[other];
    if (content.includes(rel) || content.includes(`./${rel}`) || content.includes(name)) return true;
    return ancestors.some((a) => content.includes(a));
  });
  if (!referenced) {
    report.findings.orphanDocs.push({ file: rel });
  }
}

// ---- Output ----
mkdirSync(join(ROOT, "evals/reports"), { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const outPath = join(ROOT, `evals/reports/sweep-${today}.json`);
writeFileSync(outPath, JSON.stringify(report, null, 2));

const total = Object.values(report.findings).reduce((a, xs) => a + xs.length, 0);
console.log(`Cleanup sweep: ${total} finding(s)`);
for (const [category, items] of Object.entries(report.findings)) {
  if (!items.length) continue;
  console.log(`\n  ${category}: ${items.length}`);
  for (const it of items.slice(0, 10)) {
    console.log(`    - ${JSON.stringify(it)}`);
  }
  if (items.length > 10) console.log(`    ... and ${items.length - 10} more`);
}
console.log(`\nReport written to ${relative(ROOT, outPath)}`);
console.log(`Decide PR-by-PR what to actually clean up. See .claude/commands/cleanup.md.`);
