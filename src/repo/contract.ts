// Contract tests — behavioral tests that every NoteRepo implementation must pass.
// Used by both in-memory and Postgres repos. A new implementation is valid iff
// it passes this suite.

import { beforeEach, describe, expect, it } from "vitest";
import type { Note, NoteId, NoteRepo, UserId } from "../types/note.ts";

export type RepoFactory = () => Promise<{
  repo: NoteRepo;
  cleanup: () => Promise<void>;
}>;

const makeNote = (id: string, owner: string, title = "t", createdAt?: string): Note => ({
  id: id as NoteId,
  ownerId: owner as UserId,
  title,
  body: "",
  createdAt: createdAt ?? "2026-04-19T00:00:00.000Z",
});

export function runRepoContract(label: string, factory: RepoFactory): void {
  describe(`${label} — NoteRepo contract`, () => {
    let repo: NoteRepo;
    let cleanup: () => Promise<void>;

    beforeEach(async () => {
      const built = await factory();
      repo = built.repo;
      cleanup = built.cleanup;
    });

    // Cleanup must run; wrap each test.
    const test = (name: string, fn: () => Promise<void>): void => {
      it(name, async () => {
        try {
          await fn();
        } finally {
          await cleanup();
        }
      });
    };

    test("save + findById round-trip", async () => {
      const n = makeNote("n1", "alice", "hi");
      await repo.save(n);
      const got = await repo.findById("n1" as NoteId);
      expect(got).toEqual(n);
    });

    test("findById returns null for missing ids", async () => {
      expect(await repo.findById("missing" as NoteId)).toBeNull();
    });

    test("listByOwner returns only that owner's notes", async () => {
      await repo.save(makeNote("a1", "alice"));
      await repo.save(makeNote("a2", "alice"));
      await repo.save(makeNote("b1", "bob"));
      const alice = await repo.listByOwner("alice" as UserId);
      expect(alice.map((n) => n.id).sort()).toEqual(["a1", "a2"]);
      const bob = await repo.listByOwner("bob" as UserId);
      expect(bob.map((n) => n.id)).toEqual(["b1"]);
    });

    test("listByOwner returns empty array for unknown owner", async () => {
      expect(await repo.listByOwner("ghost" as UserId)).toEqual([]);
    });

    test("save upserts on repeat id (last write wins on updatable fields)", async () => {
      await repo.save(makeNote("n1", "alice", "v1"));
      await repo.save(makeNote("n1", "alice", "v2"));
      const got = await repo.findById("n1" as NoteId);
      expect(got?.title).toBe("v2");
    });
  });
}
