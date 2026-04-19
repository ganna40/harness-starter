import { runRepoContract } from "./contract.ts";
import { InMemoryNoteRepo } from "./in-memory-note-repo.ts";

runRepoContract("InMemoryNoteRepo", async () => ({
  repo: new InMemoryNoteRepo(),
  cleanup: async () => {
    // New instance per test via factory — nothing to clean up.
  },
}));
