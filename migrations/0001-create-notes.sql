-- 0001-create-notes.sql
-- Initial schema: notes table plus owner index for listing.

CREATE TABLE IF NOT EXISTS notes (
  id          TEXT        PRIMARY KEY,
  owner_id    TEXT        NOT NULL,
  title       TEXT        NOT NULL CHECK (length(title) > 0 AND length(title) <= 200),
  body        TEXT        NOT NULL CHECK (length(body) <= 10000),
  created_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS notes_owner_id_idx ON notes (owner_id);
