import "dotenv/config";
import pg from "pg";
import { afterAll, describe, it } from "vitest";
import { runRepoContract } from "./contract.ts";
import { PostgresNoteRepo } from "./postgres-note-repo.ts";

const url = process.env.TEST_DATABASE_URL;

if (!url) {
  describe.skip("PostgresNoteRepo — SKIPPED (TEST_DATABASE_URL not set)", () => {
    it("skipped", () => {
      // intentionally empty; describe.skip reports the reason
    });
  });
} else {
  const pool = new pg.Pool({ connectionString: url, max: 2 });

  afterAll(async () => {
    await pool.end();
  });

  runRepoContract("PostgresNoteRepo", async () => ({
    repo: new PostgresNoteRepo(pool),
    cleanup: async () => {
      await pool.query("TRUNCATE notes");
    },
  }));
}
