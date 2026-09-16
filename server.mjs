import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleApi, sendJson } from "./eventApiCore.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, "dist");
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

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (await handleApi(req, res, port)) return;
    const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
    const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, "");
    let filePath = path.join(dist, safePath === path.sep || safePath === "/" ? "index.html" : safePath);
    if (!filePath.startsWith(dist)) {
      res.statusCode = 403;
      res.end("Forbidden");
      return;
    }
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(dist, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404;
      res.end("ยังไม่มีไฟล์เว็บ กรุณา build ก่อน");
      return;
    }
    sendFile(res, filePath);
  } catch (err) {
    if (!res.headersSent) sendJson(res, 500, { error: String(err) });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`cwd=${process.cwd()}`);
  console.log(`dist=${dist} exists=${fs.existsSync(path.join(dist, "index.html"))}`);
  console.log(`เปิดเว็บได้ที่พอร์ต ${port}`);
});
