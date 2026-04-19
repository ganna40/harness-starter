import type { IncomingMessage } from "node:http";
import type { Services } from "../../runtime/wire.ts";
import type { Actor, NoteId, UserId } from "../../types/note.ts";
import { ActorHeaderSchema, CreateNoteBodySchema, NoteIdParamSchema } from "./validators.ts";

export type HandlerResult = {
  readonly status: number;
  readonly body: unknown;
};

function parseActor(header: string | string[] | undefined): Actor {
  if (Array.isArray(header) || header === undefined) {
    throw new ActorMissingError();
  }
  const raw = ActorHeaderSchema.parse(header);
  return { id: raw.slice("user:".length) as UserId };
}

export class ActorMissingError extends Error {
  readonly code = "ACTOR_MISSING";
  constructor() {
    super("X-Actor header is required");
  }
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
    if (Buffer.concat(chunks).length > 100_000) {
      throw new Error("request body too large");
    }
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("request body is not valid JSON");
  }
}

export async function dispatch(
  services: Services,
  req: IncomingMessage,
  method: string,
  pathname: string,
): Promise<HandlerResult> {
  if (method === "GET" && pathname === "/healthz") {
    return { status: 200, body: { ok: true } };
  }

  if (method === "POST" && pathname === "/notes") {
    const actor = parseActor(req.headers["x-actor"]);
    const raw = await readJsonBody(req);
    const input = CreateNoteBodySchema.parse(raw);
    const note = await services.notes.create(actor, input);
    return { status: 201, body: note };
  }

  if (method === "GET" && pathname === "/notes") {
    const actor = parseActor(req.headers["x-actor"]);
    const notes = await services.notes.listMine(actor);
    return { status: 200, body: notes };
  }

  const getMatch = method === "GET" && pathname.match(/^\/notes\/([^/]+)$/);
  if (getMatch) {
    const actor = parseActor(req.headers["x-actor"]);
    const idParam = getMatch[1];
    if (idParam === undefined) {
      return { status: 400, body: { error: "VALIDATION", message: "missing id" } };
    }
    const id = NoteIdParamSchema.parse(idParam) as NoteId;
    const note = await services.notes.get(actor, id);
    return { status: 200, body: note };
  }

  return {
    status: 404,
    body: { error: "NOT_FOUND", message: `no route for ${method} ${pathname}` },
  };
}
