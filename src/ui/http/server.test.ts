import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { InMemoryNoteRepo } from "../../repo/in-memory-note-repo.ts";
import { type Services, buildServices } from "../../runtime/wire.ts";
import { buildHttpServer } from "./server.ts";

type Started = {
  services: Services;
  url: string;
  stop: () => Promise<void>;
};

async function start(): Promise<Started> {
  const services = buildServices({ repo: new InMemoryNoteRepo() });
  const server = buildHttpServer(services);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const addr = server.address() as AddressInfo;
  return {
    services,
    url: `http://127.0.0.1:${addr.port}`,
    stop: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      await services.shutdown();
    },
  };
}

describe("HTTP server", () => {
  let s: Started;
  beforeEach(async () => {
    s = await start();
  });
  afterEach(async () => {
    await s.stop();
  });

  it("GET /healthz returns 200 ok", async () => {
    const res = await fetch(`${s.url}/healthz`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it("POST /notes without X-Actor returns 401", async () => {
    const res = await fetch(`${s.url}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "x", body: "" }),
    });
    expect(res.status).toBe(401);
    expect(((await res.json()) as { error: string }).error).toBe("ACTOR_MISSING");
  });

  it("POST /notes creates a note and GET round-trips it", async () => {
    const createRes = await fetch(`${s.url}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor": "user:alice",
      },
      body: JSON.stringify({ title: "hi", body: "there" }),
    });
    expect(createRes.status).toBe(201);
    const created = (await createRes.json()) as { id: string; ownerId: string };
    expect(created.ownerId).toBe("alice");

    const getRes = await fetch(`${s.url}/notes/${created.id}`, {
      headers: { "X-Actor": "user:alice" },
    });
    expect(getRes.status).toBe(200);
    expect(((await getRes.json()) as { id: string }).id).toBe(created.id);
  });

  it("GET /notes/:id by non-owner returns 403", async () => {
    const createRes = await fetch(`${s.url}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor": "user:alice",
      },
      body: JSON.stringify({ title: "secret", body: "" }),
    });
    const created = (await createRes.json()) as { id: string };

    const bobRes = await fetch(`${s.url}/notes/${created.id}`, {
      headers: { "X-Actor": "user:bob" },
    });
    expect(bobRes.status).toBe(403);
    expect(((await bobRes.json()) as { error: string }).error).toBe("UNAUTHORIZED");
  });

  it("GET /notes/:id for missing id returns 404", async () => {
    const res = await fetch(`${s.url}/notes/missing-id`, {
      headers: { "X-Actor": "user:alice" },
    });
    expect(res.status).toBe(404);
  });

  it("POST /notes with empty title returns 400", async () => {
    const res = await fetch(`${s.url}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Actor": "user:alice",
      },
      body: JSON.stringify({ title: "", body: "" }),
    });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: string }).error).toBe("VALIDATION");
  });

  it("unknown route returns 404", async () => {
    const res = await fetch(`${s.url}/nope`);
    expect(res.status).toBe(404);
  });
});
