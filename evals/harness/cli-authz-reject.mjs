#!/usr/bin/env node
// Integration scenario: alice creates a note, bob tries to fetch it.
// Expected: service throws UnauthorizedError. Run with tsx so the .ts imports resolve.

import { buildServices } from "../../src/runtime/wire.ts";
import { UnauthorizedError } from "../../src/types/errors.ts";

const services = buildServices();
const alice = { id: "alice" };
const bob = { id: "bob" };

const created = await services.notes.create(alice, { title: "secret", body: "x" });

try {
  await services.notes.get(bob, created.id);
  console.error("FAIL — bob was able to fetch alice's note. Authz bypass!");
  process.exit(1);
} catch (e) {
  if (!(e instanceof UnauthorizedError)) {
    console.error("FAIL — unexpected error class:", e);
    process.exit(1);
  }
}

console.log("ok");
