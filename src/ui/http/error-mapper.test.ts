import { describe, expect, it } from "vitest";
import { z } from "zod";
import { NotFoundError, UnauthorizedError, ValidationError } from "../../types/errors.ts";
import { mapError } from "./error-mapper.ts";

describe("mapError", () => {
  it("maps ZodError to 400 VALIDATION with issues", () => {
    const parsed = z.object({ x: z.number() }).safeParse({ x: "nope" });
    if (parsed.success) throw new Error("test setup wrong");
    const r = mapError(parsed.error);
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("VALIDATION");
    expect(r.body.issues).toBeDefined();
  });

  it("maps ValidationError to 400", () => {
    expect(mapError(new ValidationError("bad")).status).toBe(400);
  });

  it("maps UnauthorizedError to 403", () => {
    expect(mapError(new UnauthorizedError("nope")).status).toBe(403);
  });

  it("maps NotFoundError to 404", () => {
    expect(mapError(new NotFoundError("Thing", "id")).status).toBe(404);
  });

  it("maps unknown errors to 500 INTERNAL", () => {
    const r = mapError(new Error("boom"));
    expect(r.status).toBe(500);
    expect(r.body.error).toBe("INTERNAL");
  });

  it("maps thrown non-Error values to 500 without crashing", () => {
    const r = mapError("string-thrown");
    expect(r.status).toBe(500);
    expect(r.body.error).toBe("INTERNAL");
  });
});
