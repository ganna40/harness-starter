#!/usr/bin/env node
// check-structure.mjs — enforce layer boundaries, file-size limits, and secret patterns.
// Exits non-zero on any violation. Intended for CI + local `npm run check`.
//
// What it checks:
//   1. Import direction matrix (types ← config ← repo ← service ← runtime ← ui)
//   2. No sibling imports across top-level src/ directories that skip layers
//   3. File-size thresholds (warn at 300, fail at 500)
//   4. Secret-like patterns in tracked files
//   5. Unlinked TODOs — every task marker must link an issue or URL  // harness-ignore-todo
//
// Usage:
//   node scripts/check-structure.mjs           # full check
//   node scripts/check-structure.mjs --quiet   # only print failures
//   node scripts/check-structure.mjs --json    # machine-readable output

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "src");

const args = new Set(process.argv.slice(2));
const QUIET = args.has("--quiet");
const JSON_OUT = args.has("--json");

// ---------- Layer matrix ----------
// outer index CAN import from inner index (>=).
const LAYERS = ["types", "config", "repo", "service", "runtime", "ui"];
const LAYER_INDEX = Object.fromEntries(LAYERS.map((l, i) => [l, i]));

// Hard exceptions to the inner-only rule. Keep this list tiny.
const EXCEPTIONS = new Set([
  // "ui->repo: specific reason" etc.
]);

// ---------- File walking ----------
const SOURCE_EXTS = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"]);

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function getLayerOfPath(p) {
  const rel = relative(SRC, p);
  const top = rel.split("/")[0];
  return LAYER_INDEX[top] !== undefined ? top : null;
}

// ---------- Findings ----------
const violations = [];
const warnings = [];

function violate(msg, file, line = null) {
  violations.push({ msg, file: relative(ROOT, file), line });
}
function warn(msg, file, line = null) {
  warnings.push({ msg, file: relative(ROOT, file), line });
}

// ---------- Check 1: import direction ----------
const IMPORT_RE =
  /^\s*(?:import\s+[^'"]*from\s+|import\s+|const\s+[^=]+=\s*require\s*\()\s*['"]([^'"]+)['"]/;

function checkImports(file) {
  if (!SOURCE_EXTS.has(extname(file))) return;
  const layer = getLayerOfPath(file);
  if (!layer) return;
  const layerIdx = LAYER_INDEX[layer];

  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const m = line.match(IMPORT_RE);
    if (!m) return;
    const target = m[1];
    if (!target.startsWith(".") && !target.startsWith("/")) return; // external dep
    // Only care about cross-layer imports inside src/
    for (const candidate of LAYERS) {
      const pat = new RegExp(`(^|/)${candidate}(/|$)`);
      if (pat.test(target)) {
        const targetIdx = LAYER_INDEX[candidate];
        if (targetIdx > layerIdx) {
          const key = `${layer}->${candidate}`;
          if (EXCEPTIONS.has(key)) return;
          violate(
            `Forbidden import: ${layer}/ cannot import from ${candidate}/ (${target}). ` +
              `Outer layers may only import inner. See ARCHITECTURE.md.`,
            file,
            i + 1,
          );
        }
        // UI-to-repo special rule
        if (layer === "ui" && candidate === "repo") {
          violate(
            `ui/ must not import from repo/ directly (${target}). Go through service/.`,
            file,
            i + 1,
          );
        }
        return;
      }
    }
  });
}

// ---------- Check 2: file size ----------
function checkSize(file) {
  if (!SOURCE_EXTS.has(extname(file))) return;
  const lines = readFileSync(file, "utf8").split("\n").length;
  if (lines > 500) violate(`File too long (${lines} lines, hard limit 500)`, file);
  else if (lines > 400) violate(`File over soft limit (${lines} lines, limit 400)`, file);
  else if (lines > 300) warn(`Approaching size limit (${lines} lines)`, file);
}

// ---------- Check 3: secret patterns ----------
const SECRET_PATTERNS = [
  {
    re: /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
    name: "private key",
  },
  { re: /sk-[A-Za-z0-9]{20,}/, name: "OpenAI-style key" },
  { re: /AKIA[0-9A-Z]{16}/, name: "AWS access key" },
  { re: /AIza[0-9A-Za-z_-]{35}/, name: "Google API key" },
  { re: /xox[baprs]-[0-9A-Za-z-]{10,}/, name: "Slack token" },
  { re: /ghp_[A-Za-z0-9]{36,}/, name: "GitHub personal token" },
  { re: /ghs_[A-Za-z0-9]{36,}/, name: "GitHub server token" },
];

function checkSecrets(file) {
  const rel = relative(ROOT, file);
  if (rel === ".env.example" || rel === "scripts/check-structure.mjs") return;
  const content = readFileSync(file, "utf8");
  for (const { re, name } of SECRET_PATTERNS) {
    if (re.test(content)) {
      violate(`Possible ${name} committed to repo`, file);
    }
  }
}

// ---------- Check 4: task markers without issue link ----------  // harness-ignore-todo
function checkTodos(file) {
  if (!SOURCE_EXTS.has(extname(file))) return;
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    if (!/\bTODO\b/.test(line)) return;
    if (/harness-ignore-todo/.test(line)) return;
    if (/TODO\s*\(#\d+\)/.test(line)) return;
    if (/TODO.*https?:\/\//.test(line)) return;
    warn(
      `Unlinked TODO (use 'TODO(#123): ...' or link a URL)`,
      file,
      i + 1,
    );
  });
}

// ---------- Run ----------
function scanDir(dir, checks) {
  for (const file of walk(dir)) {
    for (const check of checks) check(file);
  }
}

scanDir(SRC, [checkImports, checkSize, checkSecrets, checkTodos]);

// Scan root-level top files for secrets too
for (const name of ["README.md", ".env", ".env.example"]) {
  const p = join(ROOT, name);
  if (existsSync(p)) checkSecrets(p);
}

// ---------- Output ----------
if (JSON_OUT) {
  console.log(JSON.stringify({ violations, warnings }, null, 2));
} else {
  if (!QUIET && warnings.length) {
    console.log(`\n⚠  ${warnings.length} warning(s):`);
    for (const w of warnings) {
      console.log(`  ${w.file}${w.line ? `:${w.line}` : ""} — ${w.msg}`);
    }
  }
  if (violations.length) {
    console.log(`\n✗  ${violations.length} violation(s):`);
    for (const v of violations) {
      console.log(`  ${v.file}${v.line ? `:${v.line}` : ""} — ${v.msg}`);
    }
    console.log("\nFix these before merging. See ARCHITECTURE.md for rules.\n");
  } else if (!QUIET) {
    console.log("✓ check-structure: no violations");
  }
}

process.exit(violations.length ? 1 : 0);
