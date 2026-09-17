import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { DATA_DIR, emptyState, ensureStore, readState, storeKind, writeState } from "./eventStore.mjs";

export { emptyState, ensureStore, initStore, readState, writeState } from "./eventStore.mjs";

const PUBLIC_FILE = path.join(DATA_DIR, "public-url.txt");

export function readPublicUrlFile() {
  try {
    return fs.existsSync(PUBLIC_FILE) ? fs.readFileSync(PUBLIC_FILE, "utf8").trim() : "";
  } catch {
    return "";
  }
}

export function writePublicUrlFile(url) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(PUBLIC_FILE, url.trim(), "utf8");
}

function lanAddresses() {
  const out = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    for (const addr of addrs ?? []) {
      const v4 = addr.family === "IPv4" || addr.family === 4;
      if (!v4 || addr.internal) continue;
      if (addr.address.startsWith("169.254.")) continue;
      out.push({ name, address: addr.address });
    }
  }
  return out.sort((a, b) => score(b.address) - score(a.address));
}

function score(ip) {
  if (ip.startsWith("192.168.")) return 3;
  if (ip.startsWith("10.")) return 2;
  return 1;
}

function joinUrl(base) {
  const clean = base.replace(/\/+$/, "");
  return `${clean}/join`;
}

function isLocalHost(host) {
  const h = host.split(":")[0];
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

export function collectJoinUrls(req, port, state) {
  const urls = [];
  const seen = new Set();
  const add = (name, url) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push({ name, url });
  };

  const host = String(req.headers.host || "");
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0] || (isLocalHost(host) ? "http" : "https");
  if (host && !isLocalHost(host)) add("อินเทอร์เน็ต", joinUrl(`${proto}://${host}`));

  const fromEnv = process.env.PUBLIC_URL?.trim() || "";
  if (fromEnv) add("PUBLIC_URL", joinUrl(fromEnv));
  if (state.settings.publicUrl) add("ลิงก์ที่ตั้งไว้", joinUrl(state.settings.publicUrl));
  const fromFile = readPublicUrlFile();
  if (fromFile) add("ลิงก์สาธารณะ", joinUrl(fromFile));

  for (const item of lanAddresses()) {
    add(item.name, `http://${item.address}:${port}/join`);
  }
  if (host) add("เครื่องนี้", joinUrl(`${proto}://${host}`));
  return urls;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(data));
}

function mergeById(current = [], incoming = []) {
  const map = new Map();
  for (const item of current) {
    if (item?.id) map.set(item.id, item);
  }
  for (const item of incoming) {
    if (item?.id) map.set(item.id, item);
  }
  return [...map.values()];
}

let queue = Promise.resolve();
const withLock = (fn) => {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
};

export async function handleApi(req, res, port) {
  const url = req.url?.split("?")[0] ?? "";
  if (req.method === "OPTIONS" && url.startsWith("/api/")) {
    sendJson(res, 204, {});
    return true;
  }
  if (!url.startsWith("/api/")) return false;
  await ensureStore();

  if (url === "/api/info" && req.method === "GET") {
    const state = readState();
    sendJson(res, 200, {
      eventName: state.settings.eventName,
      guestCount: state.guests.length,
      prizeCount: state.prizes.length,
      persist: storeKind(),
      urls: collectJoinUrls(req, port, state),
    });
    return true;
  }

  if (url === "/api/state" && req.method === "GET") {
    sendJson(res, 200, readState());
    return true;
  }

  if (url === "/api/state" && req.method === "PUT") {
    const body = JSON.parse(await readBody(req));
    await withLock(async () => {
      const current = readState();
      const incoming = { ...emptyState(), ...body };
      const incomingGuests = incoming.guests ?? [];
      if (incomingGuests.length === 0 && current.guests.length > 0) {
        sendJson(res, 200, current);
        return;
      }
      await writeState({
        ...incoming,
        guests: mergeById(current.guests, incomingGuests),
        prizes: mergeById(current.prizes, incoming.prizes ?? []),
        raffleWinners: mergeById(current.raffleWinners, incoming.raffleWinners ?? []),
        teams: incoming.teams?.length ? incoming.teams : current.teams,
      });
      sendJson(res, 200, readState());
    });
    return true;
  }

  if (url === "/api/public-url" && req.method === "POST") {
    const body = JSON.parse(await readBody(req));
    const next = String(body.url || "").trim().replace(/\/+$/, "");
    writePublicUrlFile(next);
    const state = readState();
    state.settings.publicUrl = next;
    await writeState(state);
    sendJson(res, 200, { url: next });
    return true;
  }

  if (url === "/api/guests" && req.method === "POST") {
    const guest = JSON.parse(await readBody(req));
    if (!guest?.firstName || !guest?.lastName || !guest?.nickname || !guest?.rank) {
      sendJson(res, 400, { error: "กรอกชื่อ นามสกุล ชื่อเล่น และตำแหน่งให้ครบ" });
      return true;
    }
    await withLock(async () => {
      const state = readState();
      const phone = (guest.phone || "").replace(/\D/g, "");
      const first = guest.firstName.trim().toLowerCase();
      const last = guest.lastName.trim().toLowerCase();
      const nick = guest.nickname.trim().toLowerCase();
      const dup = state.guests.find((g) => {
        const gPhone = (g.phone || "").replace(/\D/g, "");
        if (phone && gPhone && gPhone === phone) return true;
        return (
          g.firstName.trim().toLowerCase() === first &&
          g.lastName.trim().toLowerCase() === last &&
          (g.nickname || "").trim().toLowerCase() === nick
        );
      });
      if (dup) {
        sendJson(res, 409, { error: "รายชื่อนี้ลงทะเบียนแล้ว", guest: dup });
        return;
      }
      state.guests.push(guest);
      await writeState(state);
      sendJson(res, 201, guest);
    });
    return true;
  }

  if (url === "/api/prizes" && req.method === "GET") {
    const state = readState();
    sendJson(
      res,
      200,
      state.prizes.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        sponsorName: p.sponsorName || "",
        sponsorOrg: p.sponsorOrg || "",
        note: p.note || "",
        source: p.source || "staff",
      })),
    );
    return true;
  }

  if (url === "/api/prizes" && req.method === "POST") {
    const prize = JSON.parse(await readBody(req));
    if (!prize?.name || !prize?.sponsorName) {
      sendJson(res, 400, { error: "กรอกชื่อของรางวัล และชื่อผู้สนับสนุนให้ครบ" });
      return true;
    }
    const next = {
      id: prize.id || `prize-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: String(prize.name).trim(),
      quantity: Math.max(1, Math.round(Number(prize.quantity) || 1)),
      sponsorName: String(prize.sponsorName).trim(),
      sponsorOrg: String(prize.sponsorOrg || "").trim(),
      sponsorPhone: String(prize.sponsorPhone || "").trim(),
      note: String(prize.note || "").trim(),
      source: prize.source === "staff" ? "staff" : "sponsor",
      createdAt: prize.createdAt || new Date().toISOString(),
    };
    await withLock(async () => {
      const state = readState();
      state.prizes.push(next);
      await writeState(state);
      sendJson(res, 201, next);
    });
    return true;
  }

  sendJson(res, 404, { error: "not found" });
  return true;
}
