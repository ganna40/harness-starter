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
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
  dims.push({
    name: "structure",
    weight: 20,
    score: r.ok ? 20 : 0,
    note: r.ok ? "pass" : "violations",
  });
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
  let pass = 0;
  let total = 0;
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
  let stale = 0;
  let total = 0;
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
  const oversize = m ? Number.parseInt(m[1]) : 0;
  const score = Math.max(0, 10 - oversize * 2);
  dims.push({ name: "filesize", weight: 10, score, note: `${oversize} oversize file(s)` });
}

// ---- Coverage (15) ----
// Reads coverage/coverage-summary.json written by `vitest run --coverage`.
// If the file is missing (tests not run with coverage), emits a prompt rather than scoring 0.
{
  const summaryPath = join(ROOT, "coverage/coverage-summary.json");
  if (!existsSync(summaryPath)) {
    dims.push({
      name: "coverage",
      weight: 15,
      score: 0,
      note: "no coverage/coverage-summary.json — run `npm run test:coverage`",
    });
  } else {
    try {
      const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
      const lines = summary.total?.lines?.pct ?? 0;
      const branches = summary.total?.branches?.pct ?? 0;
      // Weighted: 70% lines, 30% branches. 100% pct ⇒ 15 points.
      const pct = 0.7 * lines + 0.3 * branches;
      dims.push({
        name: "coverage",
        weight: 15,
        score: Math.round((pct / 100) * 15),
        note: `${lines.toFixed(0)}% lines, ${branches.toFixed(0)}% branches`,
      });
    } catch (e) {
      dims.push({
        name: "coverage",
        weight: 15,
        score: 0,
        note: `coverage-summary.json unreadable: ${e.message}`,
      });
    }
  }
}

// ---- Deps (10) ----
// Runs `npm audit --json`. Scoring:
//   starts at 10, -5 per critical, -3 per high, -1 per moderate, -0 for low.
//   floor at 0.
{
  const r = tryRun("npm audit --json");
  // npm audit exits non-zero when it finds issues — that's expected and not a run failure.
  let audit;
  try {
    audit = JSON.parse(r.out);
  } catch {
    audit = null;
  }
  if (!audit?.metadata?.vulnerabilities) {
    dims.push({
      name: "deps",
      weight: 10,
      score: 10,
      note: "no audit output — no deps or tool unavailable",
    });
  } else {
    const v = audit.metadata.vulnerabilities;
    const score = Math.max(
      0,
      10 - (v.critical ?? 0) * 5 - (v.high ?? 0) * 3 - (v.moderate ?? 0) * 1,
    );
    dims.push({
      name: "deps",
      weight: 10,
      score,
      note: `crit:${v.critical ?? 0} high:${v.high ?? 0} mod:${v.moderate ?? 0} low:${v.low ?? 0}`,
    });
  }
}

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
  console.log(
    `${d.name.padEnd(16)} ${String(d.score).padStart(3)}/${String(d.weight).padEnd(3)}        ${d.note}`,
  );
}
console.log();
console.log(`Report: evals/reports/quality-${today}.json`);
console.log(
  "Verdict thresholds: >=85 GREEN, >=70 YELLOW, >=50 RED, <50 FREEZE (see QUALITY_SCORE.md)",
);
