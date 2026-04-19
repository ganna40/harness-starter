import { randomUUID } from "node:crypto";
import { loadEnv } from "../config/env.ts";
import { makeLogger } from "../config/logger.ts";
import type { Logger } from "../config/logger.ts";
import { InMemoryNoteRepo } from "../repo/in-memory-note-repo.ts";
import { NoteService } from "../service/note-service.ts";
import type { NoteId } from "../types/note.ts";

export type Services = {
  readonly notes: NoteService;
  readonly logger: Logger;
};

export function buildServices(
  overrides: { now?: () => Date; newId?: () => NoteId } = {},
): Services {
  const env = loadEnv();
  const logger = makeLogger(env);
  const repo = new InMemoryNoteRepo();
  const notes = new NoteService({
    repo,
    now: overrides.now ?? (() => new Date()),
    newId: overrides.newId ?? (() => randomUUID() as NoteId),
  });
  return { notes, logger };
}
