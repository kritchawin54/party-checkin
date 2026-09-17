import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { handleApi, sendJson, initStore } from "./eventApiCore.mjs";

const dist = path.resolve(process.cwd(), "dist");
const port = Number(process.env.PORT) || 5173;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};

function insideDist(filePath) {
  const rel = path.relative(dist, filePath);
  return rel === "" || Boolean(rel && !rel.startsWith("..") && !path.isAbsolute(rel));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  fs.createReadStream(filePath)
    .on("error", (err) => {
      console.error("file error", err);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end("file error");
      }
    })
    .pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0] || "/");
    if (urlPath === "/healthz") {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.end("ok");
      return;
    }
    if (await handleApi(req, res, port)) return;

    const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    let filePath = path.resolve(dist, relative);
    if (!insideDist(filePath)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(dist, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("missing dist/index.html");
      return;
    }
    sendFile(res, filePath);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) sendJson(res, 500, { error: String(err) });
  }
});

server.on("error", (err) => {
  console.error("server error", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("uncaught", err);
});

process.on("unhandledRejection", (err) => {
  console.error("unhandled", err);
});

server.listen(port, "0.0.0.0", () => {
  console.log(`listening on 0.0.0.0:${port}`);
  console.log(`cwd=${process.cwd()}`);
  console.log(`dist=${dist} exists=${fs.existsSync(path.join(dist, "index.html"))}`);
});

void initStore().catch((err) => {
  console.error("store init", err);
});
