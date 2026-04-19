#!/usr/bin/env node
// Integration scenario: real CLI round-trip across two processes, backed by Postgres.
// Requires DATABASE_URL. Skips with exit 0 if DATABASE_URL is not set.

import "dotenv/config";
import { execFileSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("ok (skipped — DATABASE_URL not set)");
  process.exit(0);
}

const cli = (args) =>
  execFileSync("npx", ["tsx", "src/ui/cli/notes.ts", ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const created = JSON.parse(cli(["create", "--actor=user:alice", "--title=round-trip", "--body=w"]));
if (created.ownerId !== "alice" || created.title !== "round-trip") {
  console.error("FAIL create shape", created);
  process.exit(1);
}

// Separate process — this is where in-memory would fail.
const fetched = JSON.parse(cli(["get", "--actor=user:alice", `--id=${created.id}`]));
if (fetched.id !== created.id) {
  console.error("FAIL get mismatch", { created, fetched });
  process.exit(1);
}

console.log("ok");
