import { NotFoundError, UnauthorizedError, ValidationError } from "../types/errors.ts";
import type { Actor, NewNoteInput, Note, NoteId, NoteRepo } from "../types/note.ts";

export type NoteServiceDeps = {
  readonly repo: NoteRepo;
  readonly now: () => Date;
  readonly newId: () => NoteId;
};

export class NoteService {
  constructor(private readonly deps: NoteServiceDeps) {}

  async create(actor: Actor, input: NewNoteInput): Promise<Note> {
    if (!input.title.trim()) throw new ValidationError("title must not be empty");
    if (input.title.length > 200) throw new ValidationError("title too long (max 200)");
    if (input.body.length > 10_000) throw new ValidationError("body too long (max 10000)");

    const note: Note = {
      id: this.deps.newId(),
      ownerId: actor.id,
      title: input.title,
      body: input.body,
      createdAt: this.deps.now().toISOString(),
    };
    await this.deps.repo.save(note);
    return note;
  }

  async get(actor: Actor, id: NoteId): Promise<Note> {
    const note = await this.deps.repo.findById(id);
    if (!note) throw new NotFoundError("Note", id);
    if (note.ownerId !== actor.id) {
      throw new UnauthorizedError("actor is not the owner of this note");
    }
    return note;
  }

  async listMine(actor: Actor): Promise<readonly Note[]> {
    return this.deps.repo.listByOwner(actor.id);
  }
}
