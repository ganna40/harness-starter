#!/usr/bin/env node
// run.mjs — eval harness runner.
//
// Loads evals/cases/*.json, executes each case, reports pass/fail.
// Currently supports type: "command". Fixture/http types are planned.

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..", "..");
const CASES_DIR = join(ROOT, "evals", "cases");

const args = process.argv.slice(2);
const JSON_OUT = args.includes("--json");
const flagValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const tierFilter = flagValue("--tier");
const caseFilter = flagValue("--case");

function loadCases() {
  if (!existsSync(CASES_DIR)) return [];
  return readdirSync(CASES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(CASES_DIR, f), "utf8"));
      } catch (e) {
        return { id: f, __loadError: e.message };
      }
    });
}

function runCommand(c) {
  try {
    const out = execSync(c.command, { cwd: ROOT, stdio: "pipe", timeout: 60000 });
    return { exitCode: 0, stdout: out.toString(), stderr: "" };
  } catch (e) {
    return {
      exitCode: e.status ?? 1,
      stdout: e.stdout?.toString() ?? "",
      stderr: e.stderr?.toString() ?? "",
    };
  }
}

function checkExpect(result, expect) {
  const fails = [];
  if (expect.exitCode !== undefined && result.exitCode !== expect.exitCode) {
    fails.push(`exit code ${result.exitCode} !== expected ${expect.exitCode}`);
  }
  if (expect.stdoutContains) {
    for (const s of expect.stdoutContains) {
      if (!result.stdout.includes(s)) fails.push(`stdout missing "${s}"`);
    }
  }
  if (expect.stdoutNotContains) {
    for (const s of expect.stdoutNotContains) {
      if (result.stdout.includes(s)) fails.push(`stdout must not contain "${s}"`);
    }
  }
  if (expect.jsonPath) {
    let parsed;
    try {
      parsed = JSON.parse(result.stdout);
    } catch (e) {
      fails.push(`stdout is not JSON: ${e.message}`);
    }
    if (parsed) {
      for (const [path, expected] of Object.entries(expect.jsonPath)) {
        const val = evalSimplePath(parsed, path);
        if (val !== expected) {
          fails.push(`${path} = ${JSON.stringify(val)} !== ${JSON.stringify(expected)}`);
        }
      }
    }
  }
  return fails;
}

// Supports paths like "$.violations.length", "$.passed", "$.dimensions[0].score"
function evalSimplePath(obj, path) {
  if (!path.startsWith("$")) return undefined;
  const parts = path
    .slice(1)
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (p === "length" && Array.isArray(cur)) return cur.length;
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

// --- Run ---
const cases = loadCases();
const results = [];

for (const c of cases) {
  if (c.__loadError) {
    results.push({ id: c.id, title: "(load error)", passed: false, reason: c.__loadError });
    continue;
  }
  if (tierFilter && c.tier !== tierFilter) continue;
  if (caseFilter && c.id !== caseFilter) continue;

  if (c.type !== "command") {
    results.push({
      id: c.id,
      title: c.title,
      passed: false,
      reason: `Unsupported case type: ${c.type} (only 'command' supported currently)`,
      skipped: true,
    });
    continue;
  }

  const r = runCommand(c);
  const fails = checkExpect(r, c.expect || {});
  results.push({
    id: c.id,
    title: c.title,
    tier: c.tier,
    passed: fails.length === 0,
    reason: fails.length ? fails.join("; ") : null,
    flaky: !!c.flaky,
    stdout: r.stdout,
    stderr: r.stderr,
  });
}

const passed = results.filter((r) => r.passed).length;
const total = results.length;
const hardFails = results.filter((r) => !r.passed && !r.flaky && !r.skipped).length;

const summarizedResults = results.map(({ stdout: _s, stderr: _e, ...rest }) => rest);

if (JSON_OUT) {
  console.log(JSON.stringify({ passed, total, hardFails, results: summarizedResults }, null, 2));
} else {
  console.log(`\nEval harness: ${passed}/${total} passed\n`);
  for (const r of results) {
    const mark = r.passed ? "✓" : r.flaky ? "⚠" : r.skipped ? "·" : "✗";
    console.log(`  ${mark} ${r.id}  ${r.title ?? ""}`);
    if (!r.passed && r.reason) console.log(`      ${r.reason}`);
    // On failure, dump the child's stderr so CI logs show the actual error.
    // Tailed, not full, to keep the eval summary readable.
    if (!r.passed && !r.skipped && r.stderr) {
      const trimmed = r.stderr.trim();
      if (trimmed) {
        const last = trimmed.split("\n").slice(-10).join("\n      ");
        console.log(`      stderr (last 10 lines):\n      ${last}`);
      }
    }
  }
}

// Write report
try {
  mkdirSync(join(ROOT, "evals", "reports"), { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  writeFileSync(
    join(ROOT, "evals", "reports", `eval-${today}.json`),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        passed,
        total,
        hardFails,
        results: summarizedResults,
      },
      null,
      2,
    ),
  );
} catch {
  // ignore report write errors
}

process.exit(hardFails > 0 ? 1 : 0);
