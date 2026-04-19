#!/usr/bin/env node
// Integration scenario: create a note and fetch it back as the same actor.
// Uses the runtime/service layer directly — a CLI round-trip doesn't work
// here because the in-memory repo is per-process (Phase 2 choice).
// Run with: `npx tsx evals/harness/cli-golden-path.mjs`

import { buildServices } from "../../src/runtime/wire.ts";

const services = buildServices();
const actor = { id: "alice" };

const created = await services.notes.create(actor, { title: "hello", body: "world" });
if (created.ownerId !== "alice" || created.title !== "hello") {
  console.error("FAIL create shape", created);
  process.exit(1);
}

const fetched = await services.notes.get(actor, created.id);
if (fetched.id !== created.id) {
  console.error("FAIL get mismatch", { created, fetched });
  process.exit(1);
}

console.log("ok");
