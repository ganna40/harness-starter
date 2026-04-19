import type { Note, NoteId, NoteRepo, UserId } from "../types/note.ts";

export class InMemoryNoteRepo implements NoteRepo {
  private readonly notes = new Map<NoteId, Note>();

  async save(note: Note): Promise<void> {
    this.notes.set(note.id, note);
  }

  async findById(id: NoteId): Promise<Note | null> {
    return this.notes.get(id) ?? null;
  }

  async listByOwner(owner: UserId): Promise<readonly Note[]> {
    return [...this.notes.values()].filter((n) => n.ownerId === owner);
  }
}
