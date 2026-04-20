// Shared helper for HTTP evals: spawn `npm run serve` on an ephemeral-ish port,
// wait for /healthz, run a scenario, kill the server.

import "dotenv/config";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

export async function withServer(fn) {
  if (!process.env.DATABASE_URL) {
    console.log("ok (skipped — DATABASE_URL not set)");
    process.exit(0);
  }

  const port = 3500 + Math.floor(Math.random() * 500);
  const baseUrl = `http://127.0.0.1:${port}`;

  const child = spawn("npx", ["tsx", "src/ui/http/main.ts"], {
    env: { ...process.env, PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Forward child stderr to parent stderr for debugging; keep stdout quiet
  // unless the scenario fails.
  const stdoutChunks = [];
  child.stdout.on("data", (d) => stdoutChunks.push(d.toString()));
  child.stderr.on("data", (d) => process.stderr.write(d));

  const kill = () =>
    new Promise((resolve) => {
      if (child.killed || child.exitCode !== null) return resolve();
      child.once("exit", () => resolve());
      child.kill("SIGTERM");
      // Hard kill if SIGTERM didn't do it in 3s. unref() so the timer doesn't
      // hold the event loop open once we've resolved.
      const t = setTimeout(() => {
        if (!child.killed) child.kill("SIGKILL");
      }, 3000);
      t.unref();
    });

  // Poll healthz for up to ~30s. `npx tsx` cold start on CI runners can take
  // 10–15s; 30s is a generous ceiling that still fails fast if something's actually broken.
  const readinessTimeoutMs = Number(process.env.HTTP_HARNESS_TIMEOUT_MS ?? 30_000);
  const pollIntervalMs = 200;
  const maxAttempts = Math.ceil(readinessTimeoutMs / pollIntervalMs);
  let ready = false;
  for (let i = 0; i < maxAttempts; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/healthz`);
      if (res.ok) {
        ready = true;
        break;
      }
    } catch {
      // not yet
    }
    await delay(pollIntervalMs);
  }
  if (!ready) {
    await kill();
    console.error(`server did not become ready within ${readinessTimeoutMs}ms`);
    console.error("server stdout:", stdoutChunks.join(""));
    process.exit(1);
  }

  let scenarioError = null;
  try {
    await fn(baseUrl);
  } catch (err) {
    scenarioError = err;
  } finally {
    await kill();
  }

  // Force clean exit — fetch's keepalive agent and any stray handles can
  // otherwise delay node's natural exit until the eval harness's 60s timeout.
  if (scenarioError) {
    console.error("scenario failed:", scenarioError);
    process.exit(1);
  }
  process.exit(0);
}
