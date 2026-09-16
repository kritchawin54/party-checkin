import type { Plugin, ViteDevServer } from "vite";
import { handleApi, sendJson } from "./eventApiCore.mjs";

function currentPort(server: ViteDevServer) {
  const addr = server.httpServer?.address();
  if (addr && typeof addr === "object") return addr.port;
  return server.config.server.port ?? 5173;
}

function attach(server: ViteDevServer) {
  server.middlewares.use(async (req, res, next) => {
    try {
      const handled = await handleApi(req, res, currentPort(server));
      if (!handled) next();
    } catch (err) {
      if (!res.headersSent) sendJson(res, 500, { error: String(err) });
    }
  });
}

export function eventApiPlugin(): Plugin {
  return {
    name: "event-api",
    configureServer(server) {
      attach(server);
    },
    configurePreviewServer(server) {
      attach(server as unknown as ViteDevServer);
    },
  };
}
