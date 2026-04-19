import "dotenv/config";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { loadEnv } from "../config/env.ts";
import type { Logger } from "../config/logger.ts";
import { makeLogger } from "../config/logger.ts";
import { InMemoryNoteRepo } from "../repo/in-memory-note-repo.ts";
import { PostgresNoteRepo } from "../repo/postgres-note-repo.ts";
import { NoteService } from "../service/note-service.ts";
import type { NoteId, NoteRepo } from "../types/note.ts";

export type Services = {
  readonly notes: NoteService;
  readonly logger: Logger;
  readonly shutdown: () => Promise<void>;
};

export function buildServices(
  overrides: { now?: () => Date; newId?: () => NoteId; repo?: NoteRepo } = {},
): Services {
  const env = loadEnv();
  const logger = makeLogger(env);

  let repo: NoteRepo;
  let pool: pg.Pool | null = null;

  if (overrides.repo) {
    repo = overrides.repo;
  } else if (env.DATABASE_URL) {
    pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 5 });
    repo = new PostgresNoteRepo(pool);
  } else {
    repo = new InMemoryNoteRepo();
    logger.warn("runtime.repo.fallback", {
      reason: "DATABASE_URL not set; using in-memory repo (state is per-process)",
    });
  }

  const notes = new NoteService({
    repo,
    now: overrides.now ?? (() => new Date()),
    newId: overrides.newId ?? (() => randomUUID() as NoteId),
  });

  const shutdown = async (): Promise<void> => {
    if (pool) await pool.end();
  };

  return { notes, logger, shutdown };
}
