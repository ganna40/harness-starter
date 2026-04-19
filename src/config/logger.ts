import type { Env } from "./env.ts";

type Level = "debug" | "info" | "warn" | "error";
const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface Logger {
  debug(event: string, fields?: Record<string, unknown>): void;
  info(event: string, fields?: Record<string, unknown>): void;
  warn(event: string, fields?: Record<string, unknown>): void;
  error(event: string, fields?: Record<string, unknown>): void;
}

export function makeLogger(env: Env): Logger {
  const threshold = RANK[env.LOG_LEVEL];
  const emit = (level: Level, event: string, fields?: Record<string, unknown>) => {
    if (RANK[level] < threshold) return;
    const line = JSON.stringify({
      level,
      ts: new Date().toISOString(),
      event,
      ...fields,
    });
    if (level === "error" || level === "warn") process.stderr.write(`${line}\n`);
    else process.stdout.write(`${line}\n`);
  };
  return {
    debug: (e, f) => emit("debug", e, f),
    info: (e, f) => emit("info", e, f),
    warn: (e, f) => emit("warn", e, f),
    error: (e, f) => emit("error", e, f),
  };
}
