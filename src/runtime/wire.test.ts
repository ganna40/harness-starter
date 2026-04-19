import { describe, expect, it } from "vitest";
import type { NoteId, UserId } from "../types/note.ts";
import { buildServices } from "./wire.ts";

describe("buildServices", () => {
  it("wires a working NoteService with injectable clock and id generator", async () => {
    const fixedDate = new Date("2026-04-19T12:00:00.000Z");
    let counter = 0;
    const services = buildServices({
      now: () => fixedDate,
      newId: () => {
        counter += 1;
        return `note-${counter}` as NoteId;
      },
    });
    const actor = { id: "alice" as UserId };
    const note = await services.notes.create(actor, { title: "hi", body: "there" });
    expect(note.id).toBe("note-1");
    expect(note.createdAt).toBe(fixedDate.toISOString());
    const got = await services.notes.get(actor, note.id);
    expect(got).toEqual(note);
  });
});
