import { z } from "zod";
import { buildServices } from "../../runtime/wire.ts";
import { AppError } from "../../types/errors.ts";
import type { Actor, NoteId, UserId } from "../../types/note.ts";

// --- Input validation at the UI boundary ---

const ActorSchema = z.string().regex(/^user:[a-zA-Z0-9_-]+$/, "actor must be 'user:<id>'");

const CreateSchema = z.object({
  actor: ActorSchema,
  title: z.string().min(1),
  body: z.string().default(""),
});

const GetSchema = z.object({
  actor: ActorSchema,
  id: z.string().min(1),
});

const ListSchema = z.object({
  actor: ActorSchema,
});

function parseActor(raw: string): Actor {
  const id = raw.slice("user:".length) as UserId;
  return { id };
}

function parseArgs(argv: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const arg of argv) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m?.[1] !== undefined && m[2] !== undefined) out[m[1]] = m[2];
  }
  return out;
}

// --- Command dispatch ---

async function run(argv: readonly string[]): Promise<number> {
  const command = argv[0];
  const flags = parseArgs(argv.slice(1));
  const services = buildServices();

  try {
    if (command === "create") {
      const input = CreateSchema.parse(flags);
      const note = await services.notes.create(parseActor(input.actor), {
        title: input.title,
        body: input.body,
      });
      process.stdout.write(`${JSON.stringify(note)}\n`);
      return 0;
    }
    if (command === "get") {
      const input = GetSchema.parse(flags);
      const note = await services.notes.get(parseActor(input.actor), input.id as NoteId);
      process.stdout.write(`${JSON.stringify(note)}\n`);
      return 0;
    }
    if (command === "list") {
      const input = ListSchema.parse(flags);
      const notes = await services.notes.listMine(parseActor(input.actor));
      process.stdout.write(`${JSON.stringify(notes)}\n`);
      return 0;
    }
    process.stderr.write(
      "Usage:\n" +
        "  notes create --actor=user:<id> --title=<t> [--body=<b>]\n" +
        "  notes get    --actor=user:<id> --id=<noteId>\n" +
        "  notes list   --actor=user:<id>\n",
    );
    return 2;
  } catch (err) {
    if (err instanceof AppError) {
      process.stderr.write(`${JSON.stringify({ error: err.code, message: err.message })}\n`);
      return err.code === "NOT_FOUND" ? 4 : err.code === "UNAUTHORIZED" ? 3 : 1;
    }
    if (err instanceof z.ZodError) {
      process.stderr.write(`${JSON.stringify({ error: "VALIDATION", issues: err.issues })}\n`);
      return 1;
    }
    process.stderr.write(
      `${JSON.stringify({ error: "INTERNAL", message: (err as Error).message })}\n`,
    );
    return 1;
  } finally {
    await services.shutdown();
  }
}

const exit = await run(process.argv.slice(2));
process.exit(exit);
