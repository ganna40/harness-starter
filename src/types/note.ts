export type NoteId = string & { readonly __brand: "NoteId" };
export type UserId = string & { readonly __brand: "UserId" };

export type Actor = {
  readonly id: UserId;
};

export type Note = {
  readonly id: NoteId;
  readonly ownerId: UserId;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
};

export type NewNoteInput = {
  readonly title: string;
  readonly body: string;
};

export interface NoteRepo {
  save(note: Note): Promise<void>;
  findById(id: NoteId): Promise<Note | null>;
  listByOwner(owner: UserId): Promise<readonly Note[]>;
}
