#!/usr/bin/env node
// Smoke test the CLI boundary: single `create` call produces valid JSON.
// Proves ui/cli is wired and runnable. Does NOT test round-trip (the in-memory
// repo is per-process, see cli-golden-path.mjs for the programmatic round-trip).

import { execFileSync } from "node:child_process";

const out = execFileSync(
  "npx",
  ["tsx", "src/ui/cli/notes.ts", "create", "--actor=user:alice", "--title=hi", "--body=there"],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
);

const note = JSON.parse(out);
if (
  !note.id ||
  note.ownerId !== "alice" ||
  note.title !== "hi" ||
  note.body !== "there" ||
  !note.createdAt
) {
  console.error("FAIL — unexpected note shape:", note);
  process.exit(1);
}
console.log("ok");
