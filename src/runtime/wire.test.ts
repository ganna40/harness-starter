import { describe, expect, it } from "vitest";
import { InMemoryNoteRepo } from "../repo/in-memory-note-repo.ts";
import type { NoteId, UserId } from "../types/note.ts";
import { buildServices } from "./wire.ts";

describe("buildServices", () => {
  it("wires a working NoteService with injectable clock, id generator, and repo", async () => {
    const fixedDate = new Date("2026-04-19T12:00:00.000Z");
    let counter = 0;
    const services = buildServices({
      repo: new InMemoryNoteRepo(),
      now: () => fixedDate,
      newId: () => {
        counter += 1;
        return `note-${counter}` as NoteId;
      },
    });
    try {
      const actor = { id: "alice" as UserId };
      const note = await services.notes.create(actor, { title: "hi", body: "there" });
      expect(note.id).toBe("note-1");
      expect(note.createdAt).toBe(fixedDate.toISOString());
      const got = await services.notes.get(actor, note.id);
      expect(got).toEqual(note);
    } finally {
      await services.shutdown();
    }
  });

  it("shutdown is a no-op when no pool was opened (repo override)", async () => {
    const services = buildServices({ repo: new InMemoryNoteRepo() });
    await expect(services.shutdown()).resolves.toBeUndefined();
  });
});
