#!/usr/bin/env node
// quality-score.mjs — compute the weighted quality score from QUALITY_SCORE.md.
//
// Current inputs (stack-agnostic; some are placeholders until stack is picked):
//   - structure: 20 pts if check-structure passes, else 0
//   - docs:      15 pts if check-docs passes with no warnings, scaled down by warning count
//   - coverage:  15 pts — PLACEHOLDER (stack-specific; returns 0 with note)
//   - evals:     15 pts × pass rate
//   - plans:     10 pts if no active plan is stale, else scaled down
//   - filesize:  10 pts − 2 per oversize file, min 0
//   - deps:      10 pts — PLACEHOLDER (stack-specific; returns 10 with note)
//   - pr-hygiene: 5 pts — PLACEHOLDER (requires gh CLI + history; returns 5 with note)
//
// Output: console summary + JSON at evals/reports/quality-YYYY-MM-DD.json

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

function tryRun(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { cwd: ROOT, stdio: "pipe" }).toString() };
  } catch (e) {
    return { ok: false, out: (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? "") };
  }
}

const dims = [];

// ---- Structure (20) ----
{
  const r = tryRun("node scripts/check-structure.mjs --quiet");
  dims.push({ name: "structure", weight: 20, score: r.ok ? 20 : 0, note: r.ok ? "pass" : "violations" });
}

// ---- Docs (15) ----
{
  const r = tryRun("node scripts/check-docs.mjs");
  const warningCount = (r.out.match(/⚠/g) || []).length;
  const score = r.ok ? Math.max(0, 15 - warningCount * 2) : 0;
  dims.push({ name: "docs", weight: 15, score, note: `${warningCount} staleness warning(s)` });
}

// ---- Evals (15) ----
{
  const r = tryRun("node evals/harness/run.mjs --json");
  let pass = 0, total = 0;
  try {
    const j = JSON.parse(r.out);
    pass = j.passed;
    total = j.total;
  } catch {
    // ignore
  }
  const rate = total ? pass / total : 0;
  dims.push({
    name: "evals",
    weight: 15,
    score: Math.round(15 * rate),
    note: total ? `${pass}/${total} passed` : "no cases",
  });
}

// ---- Plans hygiene (10) ----
{
  const activeDir = join(ROOT, "docs/exec-plans/active");
  let stale = 0, total = 0;
  if (existsSync(activeDir)) {
    const fortnight = 14 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    for (const e of readdirSync(activeDir)) {
      if (!e.endsWith(".md")) continue;
      total++;
      if (now - statSync(join(activeDir, e)).mtimeMs > fortnight) stale++;
    }
  }
  const score = total === 0 ? 10 : Math.max(0, 10 - stale * 3);
  dims.push({ name: "plans", weight: 10, score, note: `${stale}/${total} stale` });
}

// ---- File size (10) ----
{
  const r = tryRun("node scripts/cleanup-sweep.mjs");
  const m = r.out.match(/oversizeFiles:\s*(\d+)/);
  const oversize = m ? parseInt(m[1]) : 0;
  const score = Math.max(0, 10 - oversize * 2);
  dims.push({ name: "filesize", weight: 10, score, note: `${oversize} oversize file(s)` });
}

// ---- Coverage (15) — placeholder ----
dims.push({
  name: "coverage",
  weight: 15,
  score: 0,
  note: "PLACEHOLDER — wire up when stack is chosen (see QUALITY_SCORE.md)",
});

// ---- Deps (10) — placeholder ----
dims.push({
  name: "deps",
  weight: 10,
  score: 10,
  note: "PLACEHOLDER — `npm audit` wiring pending",
});

// ---- PR hygiene (5) — placeholder ----
dims.push({
  name: "pr-hygiene",
  weight: 5,
  score: 5,
  note: "PLACEHOLDER — requires gh CLI + repo history",
});

// ---- Report ----
const total = dims.reduce((a, d) => a + d.score, 0);
const verdict = total >= 85 ? "GREEN" : total >= 70 ? "YELLOW" : total >= 50 ? "RED" : "FREEZE";

const report = {
  generatedAt: new Date().toISOString(),
  total,
  verdict,
  dimensions: dims,
};

mkdirSync(join(ROOT, "evals/reports"), { recursive: true });
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(ROOT, `evals/reports/quality-${today}.json`), JSON.stringify(report, null, 2));

console.log(`\nQuality Score: ${total}/100  (${verdict})\n`);
console.log("Dimension       Score/Weight   Note");
console.log("---------------- ------------  ---------------------");
for (const d of dims) {
  console.log(`${d.name.padEnd(16)} ${String(d.score).padStart(3)}/${String(d.weight).padEnd(3)}        ${d.note}`);
}
console.log();
console.log(`Report: evals/reports/quality-${today}.json`);
console.log(`Verdict thresholds: >=85 GREEN, >=70 YELLOW, >=50 RED, <50 FREEZE (see QUALITY_SCORE.md)`);
