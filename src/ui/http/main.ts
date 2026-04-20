import { buildServices } from "../../runtime/wire.ts";
import { buildHttpServer } from "./server.ts";

const port = Number(process.env.PORT ?? 3000);
const services = buildServices();
const server = buildHttpServer(services);

server.listen(port, () => {
  const addr = server.address();
  const actualPort = typeof addr === "object" && addr ? addr.port : port;
  services.logger.info("http.listening", { port: actualPort });
});

async function shutdown(signal: string): Promise<void> {
  services.logger.info("http.shutdown.start", { signal });
  // Force-close any keepalive connections so server.close() doesn't block on them.
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await services.shutdown();
  services.logger.info("http.shutdown.done");
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
