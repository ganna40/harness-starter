import { z } from "zod";

export const ActorHeaderSchema = z
  .string()
  .regex(/^user:[a-zA-Z0-9_-]+$/, "X-Actor header must be 'user:<id>'");

export const CreateNoteBodySchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().max(10_000).default(""),
});

export const NoteIdParamSchema = z.string().min(1).max(200);
