#!/usr/bin/env node
// Reads the latest quality report and exits non-zero if the score is below the threshold.
// If no report exists, runs the scorer first.
//
// Threshold comes from autonomy.md: 85 = GREEN. Dropping below this halts autonomous
// merges per docs/design-docs/autonomy.md.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..");
const REPORTS = join(ROOT, "evals", "reports");
const THRESHOLD = 85;

function latestReport() {
  if (!existsSync(REPORTS)) return null;
  const files = readdirSync(REPORTS)
    .filter((f) => f.startsWith("quality-") && f.endsWith(".json"))
    .sort();
  return files.length ? join(REPORTS, files[files.length - 1]) : null;
}

let reportPath = latestReport();
if (!reportPath) {
  execSync("node scripts/quality-score.mjs", { cwd: ROOT, stdio: "pipe" });
  reportPath = latestReport();
}

if (!reportPath) {
  console.error("no quality report available");
  process.exit(2);
}

const report = JSON.parse(readFileSync(reportPath, "utf8"));
if (report.total < THRESHOLD) {
  console.error(`score ${report.total} < ${THRESHOLD} (verdict: ${report.verdict})`);
  process.exit(1);
}
console.log(`ok (score ${report.total}, verdict ${report.verdict})`);
