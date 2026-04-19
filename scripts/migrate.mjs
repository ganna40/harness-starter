#!/usr/bin/env node
// migrate.mjs — apply migrations in lexical order, track in schema_migrations.
// Fails if a previously-applied migration's checksum has changed (indicates someone
// edited an already-applied file; always add a new migration instead).
//
// Usage:
//   tsx scripts/migrate.mjs            # applies to DATABASE_URL
//   tsx scripts/migrate.mjs --test     # applies to TEST_DATABASE_URL

import "dotenv/config";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const MIGRATIONS_DIR = join(ROOT, "migrations");

const isTest = process.argv.includes("--test");
const url = isTest ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;
if (!url) {
  console.error(
    `✗ ${isTest ? "TEST_DATABASE_URL" : "DATABASE_URL"} not set. Check your .env file.`,
  );
  process.exit(2);
}

function checksum(sql) {
  return createHash("sha256").update(sql).digest("hex");
}

function loadMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) return [];
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((filename) => {
      const sql = readFileSync(join(MIGRATIONS_DIR, filename), "utf8");
      return { filename, sql, checksum: checksum(sql) };
    });
}

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT        PRIMARY KEY,
      checksum    TEXT        NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const applied = new Map(
    (await client.query("SELECT filename, checksum FROM schema_migrations")).rows.map((r) => [
      r.filename,
      r.checksum,
    ]),
  );

  const migrations = loadMigrations();
  let appliedCount = 0;

  for (const m of migrations) {
    const prev = applied.get(m.filename);
    if (prev) {
      if (prev !== m.checksum) {
        throw new Error(
          `Checksum mismatch for ${m.filename}. A migration was edited after being applied. Never edit an applied migration — add a new one instead.`,
        );
      }
      continue;
    }
    console.log(`  applying ${m.filename}`);
    await client.query("BEGIN");
    try {
      await client.query(m.sql);
      await client.query("INSERT INTO schema_migrations (filename, checksum) VALUES ($1, $2)", [
        m.filename,
        m.checksum,
      ]);
      await client.query("COMMIT");
      appliedCount += 1;
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    }
  }

  if (appliedCount === 0) {
    console.log(`✓ db up-to-date (${migrations.length} migration(s) already applied)`);
  } else {
    console.log(`✓ applied ${appliedCount} migration(s)`);
  }
} finally {
  await client.end();
}
