import { describe, expect, it } from "vitest";
import { loadEnv } from "./env.ts";

describe("loadEnv", () => {
  it("applies defaults when env is empty", () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe("development");
    expect(env.LOG_LEVEL).toBe("info");
  });

  it("accepts valid values", () => {
    const env = loadEnv({ NODE_ENV: "production", LOG_LEVEL: "warn" });
    expect(env.NODE_ENV).toBe("production");
    expect(env.LOG_LEVEL).toBe("warn");
  });

  it("throws on invalid values", () => {
    expect(() => loadEnv({ NODE_ENV: "staging" })).toThrow(/Invalid environment/);
    expect(() => loadEnv({ LOG_LEVEL: "trace" })).toThrow(/Invalid environment/);
  });
});
