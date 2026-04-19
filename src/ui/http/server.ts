import { type Server, createServer } from "node:http";
import type { Services } from "../../runtime/wire.ts";
import { mapError } from "./error-mapper.ts";
import { ActorMissingError, dispatch } from "./router.ts";

export function buildHttpServer(services: Services): Server {
  const server = createServer(async (req, res) => {
    const method = req.method ?? "GET";
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    const start = Date.now();
    try {
      const result = await dispatch(services, req, method, pathname);
      res.statusCode = result.status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(`${JSON.stringify(result.body)}\n`);
      services.logger.info("http.request", {
        method,
        path: pathname,
        status: result.status,
        duration_ms: Date.now() - start,
      });
    } catch (err) {
      if (err instanceof ActorMissingError) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(`${JSON.stringify({ error: err.code, message: err.message })}\n`);
        services.logger.warn("http.unauthorized", { method, path: pathname });
        return;
      }
      const { status, body } = mapError(err);
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(`${JSON.stringify(body)}\n`);
      services.logger.warn("http.error", {
        method,
        path: pathname,
        status,
        error: body.error,
      });
    }
  });
  return server;
}
