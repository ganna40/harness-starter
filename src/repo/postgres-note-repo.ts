import type { Pool } from "pg";
import type { Note, NoteId, NoteRepo, UserId } from "../types/note.ts";

type Row = {
  id: string;
  owner_id: string;
  title: string;
  body: string;
  created_at: Date;
};

function rowToNote(row: Row): Note {
  return {
    id: row.id as NoteId,
    ownerId: row.owner_id as UserId,
    title: row.title,
    body: row.body,
    createdAt: row.created_at.toISOString(),
  };
}

export class PostgresNoteRepo implements NoteRepo {
  constructor(private readonly pool: Pool) {}

  async save(note: Note): Promise<void> {
    await this.pool.query(
      `INSERT INTO notes (id, owner_id, title, body, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title,
             body = EXCLUDED.body`,
      [note.id, note.ownerId, note.title, note.body, note.createdAt],
    );
  }

  async findById(id: NoteId): Promise<Note | null> {
    const result = await this.pool.query<Row>("SELECT * FROM notes WHERE id = $1", [id]);
    const row = result.rows[0];
    return row ? rowToNote(row) : null;
  }

  async listByOwner(owner: UserId): Promise<readonly Note[]> {
    const result = await this.pool.query<Row>(
      "SELECT * FROM notes WHERE owner_id = $1 ORDER BY created_at DESC",
      [owner],
    );
    return result.rows.map(rowToNote);
  }
}
