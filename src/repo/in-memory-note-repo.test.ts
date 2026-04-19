import { describe, expect, it } from "vitest";
import type { Note, NoteId, UserId } from "../types/note.ts";
import { InMemoryNoteRepo } from "./in-memory-note-repo.ts";

const note = (id: string, owner: string, title = "t"): Note => ({
  id: id as NoteId,
  ownerId: owner as UserId,
  title,
  body: "",
  createdAt: "2026-04-19T00:00:00.000Z",
});

describe("InMemoryNoteRepo", () => {
  it("round-trips save and findById", async () => {
    const repo = new InMemoryNoteRepo();
    const n = note("n1", "alice");
    await repo.save(n);
    expect(await repo.findById("n1" as NoteId)).toEqual(n);
  });

  it("returns null for missing ids", async () => {
    const repo = new InMemoryNoteRepo();
    expect(await repo.findById("missing" as NoteId)).toBeNull();
  });

  it("lists only notes for the requested owner", async () => {
    const repo = new InMemoryNoteRepo();
    await repo.save(note("a1", "alice"));
    await repo.save(note("a2", "alice"));
    await repo.save(note("b1", "bob"));
    const alice = await repo.listByOwner("alice" as UserId);
    expect(alice.map((n) => n.id).sort()).toEqual(["a1", "a2"]);
  });

  it("overwrites on repeat save (last write wins)", async () => {
    const repo = new InMemoryNoteRepo();
    await repo.save(note("n1", "alice", "v1"));
    await repo.save(note("n1", "alice", "v2"));
    const got = await repo.findById("n1" as NoteId);
    expect(got?.title).toBe("v2");
  });
});
