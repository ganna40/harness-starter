#!/usr/bin/env node
// check-docs.mjs — verify docs aren't obviously stale relative to code.
//
// Rules:
//   1. If any file in src/<layer>/ was modified after ARCHITECTURE.md,
//      flag as warning (architecture may lag behind code).
//   2. If any file in docs/exec-plans/active/ has no status update in >14 days,
//      flag as warning.
//   3. Required docs must exist (CLAUDE.md, ARCHITECTURE.md, SECURITY.md, etc.).
//
// Exits non-zero only on missing required docs. Stale-doc warnings don't fail CI
// (too noisy); they show up in the weekly quality score instead.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

const REQUIRED = [
  "README.md",
  "CLAUDE.md",
  "ARCHITECTURE.md",
  "SECURITY.md",
  "OPERATIONS.md",
  "QUALITY_SCORE.md",
  "docs/design-docs/core-beliefs.md",
  "docs/design-docs/autonomy.md",
  "docs/exec-plans/README.md",
  "docs/exec-plans/TEMPLATE.md",
  "docs/decisions/README.md",
  "docs/decisions/TEMPLATE.md",
];

const missing = [];
for (const r of REQUIRED) {
  if (!existsSync(join(ROOT, r))) missing.push(r);
}
if (missing.length) {
  console.log("✗  Missing required docs:");
  for (const m of missing) console.log(`    ${m}`);
  process.exit(1);
}

// --- Staleness checks ---
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function mtime(p) {
  return existsSync(p) ? statSync(p).mtimeMs : 0;
}

const archM = mtime(join(ROOT, "ARCHITECTURE.md"));
const srcFiles = walk(join(ROOT, "src"));
const staleArch = srcFiles.some((f) => statSync(f).mtimeMs > archM);

const warnings = [];
if (staleArch) {
  warnings.push(
    "ARCHITECTURE.md is older than some files in src/. Review whether boundaries changed.",
  );
}

// Active exec plans
const activeDir = join(ROOT, "docs/exec-plans/active");
if (existsSync(activeDir)) {
  const fortnightMs = 14 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  for (const entry of readdirSync(activeDir)) {
    if (entry === ".gitkeep" || !entry.endsWith(".md")) continue;
    const full = join(activeDir, entry);
    const age = now - statSync(full).mtimeMs;
    if (age > fortnightMs) {
      const days = Math.floor(age / (24 * 60 * 60 * 1000));
      warnings.push(`Active plan stale (${days}d): docs/exec-plans/active/${entry}`);
    }
  }
}

if (warnings.length) {
  console.log(`⚠  ${warnings.length} doc staleness warning(s):`);
  for (const w of warnings) console.log(`    ${w}`);
} else {
  console.log("✓ check-docs: all required docs present; no staleness flags");
}

// Exit 0 on warnings only — don't block CI on staleness, but expose via quality score.
process.exit(0);
