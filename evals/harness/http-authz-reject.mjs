#!/usr/bin/env node
// Integration scenario: alice creates, bob gets → must be 403 UNAUTHORIZED.

import { withServer } from "./http-harness.mjs";

await withServer(async (base) => {
  const createRes = await fetch(`${base}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Actor": "user:alice" },
    body: JSON.stringify({ title: "secret", body: "" }),
  });
  if (createRes.status !== 201) {
    console.error("FAIL create status:", createRes.status);
    process.exit(1);
  }
  const created = await createRes.json();

  const bobRes = await fetch(`${base}/notes/${created.id}`, {
    headers: { "X-Actor": "user:bob" },
  });
  if (bobRes.status !== 403) {
    console.error("FAIL — bob got status", bobRes.status, "(expected 403)");
    process.exit(1);
  }
  const body = await bobRes.json();
  if (body.error !== "UNAUTHORIZED") {
    console.error("FAIL — unexpected error code:", body);
    process.exit(1);
  }
  console.log("ok");
});
