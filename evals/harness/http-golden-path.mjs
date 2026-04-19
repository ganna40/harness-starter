#!/usr/bin/env node
// Integration scenario: real HTTP server (via `npm run serve`), Postgres-backed.
// Creates a note and fetches it back by id. Exercises ui/http through service/repo.

import { withServer } from "./http-harness.mjs";

await withServer(async (base) => {
  const createRes = await fetch(`${base}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Actor": "user:alice" },
    body: JSON.stringify({ title: "http-golden", body: "w" }),
  });
  if (createRes.status !== 201) {
    console.error("FAIL create status:", createRes.status, await createRes.text());
    process.exit(1);
  }
  const created = await createRes.json();
  if (created.ownerId !== "alice" || created.title !== "http-golden") {
    console.error("FAIL create shape:", created);
    process.exit(1);
  }

  const getRes = await fetch(`${base}/notes/${created.id}`, {
    headers: { "X-Actor": "user:alice" },
  });
  if (getRes.status !== 200) {
    console.error("FAIL get status:", getRes.status, await getRes.text());
    process.exit(1);
  }
  const fetched = await getRes.json();
  if (fetched.id !== created.id) {
    console.error("FAIL get mismatch", { created, fetched });
    process.exit(1);
  }
  console.log("ok");
});
