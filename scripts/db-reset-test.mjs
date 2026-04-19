#!/usr/bin/env node
// db-reset-test.mjs — drop and recreate the test DB tables. Safe because it only
// targets TEST_DATABASE_URL; refuses to run against anything else.

import "dotenv/config";
import pg from "pg";

const url = process.env.TEST_DATABASE_URL;
if (!url) {
  console.error("✗ TEST_DATABASE_URL not set");
  process.exit(2);
}
if (!/_test(\?|$)/.test(url)) {
  console.error(`✗ refusing to reset non-test DB: ${url}`);
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query("DROP TABLE IF EXISTS notes CASCADE");
  await client.query("DROP TABLE IF EXISTS schema_migrations CASCADE");
  console.log("✓ test DB reset");
} finally {
  await client.end();
}
