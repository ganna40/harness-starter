import { beforeEach, describe, expect, it } from "vitest";
import { NotFoundError, UnauthorizedError, ValidationError } from "../types/errors.ts";
import type { Actor, Note, NoteId, NoteRepo, UserId } from "../types/note.ts";
import { NoteService } from "./note-service.ts";

class FakeRepo implements NoteRepo {
  readonly store = new Map<NoteId, Note>();
  async save(note: Note): Promise<void> {
    this.store.set(note.id, note);
  }
  async findById(id: NoteId): Promise<Note | null> {
    return this.store.get(id) ?? null;
  }
  async listByOwner(owner: UserId): Promise<readonly Note[]> {
    return [...this.store.values()].filter((n) => n.ownerId === owner);
  }
}

const actor = (id: string): Actor => ({ id: id as UserId });
const FIXED_NOW = new Date("2026-04-19T00:00:00.000Z");

describe("NoteService", () => {
  let repo: FakeRepo;
  let svc: NoteService;
  let idCounter = 0;

  beforeEach(() => {
    repo = new FakeRepo();
    idCounter = 0;
    svc = new NoteService({
      repo,
      now: () => FIXED_NOW,
      newId: () => {
        idCounter += 1;
        return `note-${idCounter}` as NoteId;
      },
    });
  });

  describe("create", () => {
    it("saves a note owned by the actor", async () => {
      const note = await svc.create(actor("alice"), { title: "hi", body: "world" });
      expect(note.id).toBe("note-1");
      expect(note.ownerId).toBe("alice");
      expect(note.title).toBe("hi");
      expect(note.createdAt).toBe(FIXED_NOW.toISOString());
      expect(repo.store.size).toBe(1);
    });

    it("rejects empty titles", async () => {
      await expect(svc.create(actor("alice"), { title: "   ", body: "" })).rejects.toBeInstanceOf(
        ValidationError,
      );
    });

    it("rejects over-long titles and bodies", async () => {
      await expect(
        svc.create(actor("alice"), { title: "x".repeat(201), body: "" }),
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(
        svc.create(actor("alice"), { title: "ok", body: "x".repeat(10_001) }),
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });

  describe("get", () => {
    it("returns the note when the actor is the owner", async () => {
      const created = await svc.create(actor("alice"), { title: "t", body: "b" });
      const got = await svc.get(actor("alice"), created.id);
      expect(got).toEqual(created);
    });

    it("throws NotFound for an unknown id", async () => {
      await expect(svc.get(actor("alice"), "missing" as NoteId)).rejects.toBeInstanceOf(
        NotFoundError,
      );
    });

    it("throws Unauthorized when a different actor requests the note", async () => {
      const created = await svc.create(actor("alice"), { title: "t", body: "b" });
      await expect(svc.get(actor("bob"), created.id)).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("listMine", () => {
    it("returns only notes owned by the actor", async () => {
      await svc.create(actor("alice"), { title: "a1", body: "" });
      await svc.create(actor("alice"), { title: "a2", body: "" });
      await svc.create(actor("bob"), { title: "b1", body: "" });
      const mine = await svc.listMine(actor("alice"));
      expect(mine.map((n) => n.title).sort()).toEqual(["a1", "a2"]);
    });
  });
});
