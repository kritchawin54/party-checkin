import { spawn } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const exe = path.resolve("tools/cloudflared.exe");
const url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe";

function download() {
  fs.mkdirSync("tools", { recursive: true });
  return new Promise((resolve, reject) => {
    const follow = (target) => {
      https
        .get(target, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            follow(res.headers.location);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`download failed ${res.statusCode}`));
            return;
          }
          const file = fs.createWriteStream(exe);
          res.pipe(file);
          file.on("finish", () => file.close(() => resolve(undefined)));
        })
        .on("error", reject);
    };
    follow(url);
  });
}

if (!fs.existsSync(exe)) {
  console.log("กำลังดาวน์โหลดโปรแกรมเปิดลิงก์สาธารณะ...");
  await download();
}

console.log("กำลังเปิดลิงก์สาธารณะ HTTPS ให้ทุกคนเข้าได้...");
const child = spawn(exe, ["tunnel", "--no-autoupdate", "--url", "http://127.0.0.1:5173"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let found = "";
function inspect(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);
  const match = text.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (match && !found) {
    found = match[0];
    fs.mkdirSync("data", { recursive: true });
    fs.writeFileSync("data/public-url.txt", found, "utf8");
    console.log(`\nลิงก์สาธารณะ: ${found}`);
    console.log(`ให้แขกเปิด: ${found}/join\n`);
  }
}

child.stdout.on("data", inspect);
child.stderr.on("data", inspect);
child.on("exit", (code) => process.exit(code ?? 0));
