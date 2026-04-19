import { describe, expect, it, vi } from "vitest";
import { makeLogger } from "./logger.ts";

function captureStdout(fn: () => void): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    lines.push(String(chunk));
    return true;
  });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return lines;
}

function captureStderr(fn: () => void): string[] {
  const lines: string[] = [];
  const spy = vi.spyOn(process.stderr, "write").mockImplementation((chunk) => {
    lines.push(String(chunk));
    return true;
  });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return lines;
}

describe("makeLogger", () => {
  it("emits JSON lines with event and fields", () => {
    const log = makeLogger({ NODE_ENV: "test", LOG_LEVEL: "info" });
    const out = captureStdout(() => log.info("app.started", { port: 3000 }));
    expect(out).toHaveLength(1);
    const parsed = JSON.parse(out[0] ?? "");
    expect(parsed.event).toBe("app.started");
    expect(parsed.port).toBe(3000);
    expect(parsed.level).toBe("info");
  });

  it("respects the level threshold", () => {
    const log = makeLogger({ NODE_ENV: "test", LOG_LEVEL: "warn" });
    const out = captureStdout(() => log.info("noise"));
    expect(out).toHaveLength(0);
  });

  it("routes warn and error to stderr", () => {
    const log = makeLogger({ NODE_ENV: "test", LOG_LEVEL: "debug" });
    const err = captureStderr(() => log.error("app.crash", { reason: "boom" }));
    expect(err).toHaveLength(1);
    expect(err[0]).toContain("app.crash");
  });
});
