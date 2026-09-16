import { uid } from "../store";
import { categoryOf, composeName, rankLevelOf, type Guest } from "../types";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === "," || ch === "\t" || ch === ";") {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function normalizeHeader(h: string): string {
  return h.replace(/^\uFEFF/, "").trim().toLowerCase();
}

function parseCategory(value: string, rank: string): Guest["category"] {
  const v = value.trim().toLowerCase();
  if (["เยาวชน", "เด็ก", "youth", "kid", "child", "เด็ก-เยาวชน"].includes(v)) {
    return "youth";
  }
  if (v) return "adult";
  return categoryOf(rank);
}

export function parseGuestCsv(text: string): Guest[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim());
  if (!lines.length) return [];

  const header = splitCsvLine(lines[0]).map(normalizeHeader);
  const hasHeader = header.some((h) =>
    ["ชื่อ", "name", "ชื่อจริง", "นามสกุล", "ยศ", "ตำแหน่ง", "rank"].includes(h),
  );
  const rows = hasHeader ? lines.slice(1) : lines;
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));

  const nameI = hasHeader ? idx(["ชื่อ", "ชื่อ-นามสกุล", "name"]) : 0;
  const firstI = hasHeader ? idx(["ชื่อจริง", "firstname", "first"]) : -1;
  const lastI = hasHeader ? idx(["นามสกุล", "lastname", "last"]) : -1;
  const nickI = hasHeader ? idx(["ชื่อเล่น", "nickname", "nick"]) : -1;
  const rankI = hasHeader ? idx(["ยศ", "ตำแหน่ง", "ระดับ", "rank"]) : 1;
  const levelI = hasHeader ? idx(["ระดับยศ", "level", "ranklevel"]) : -1;
  const catI = hasHeader ? idx(["ประเภท", "category"]) : -1;
  const unitI = hasHeader ? idx(["หน่วยงาน", "unit", "สังกัด"]) : -1;
  const phoneI = hasHeader ? idx(["เบอร์โทร", "โทร", "phone"]) : -1;
  const companionI = hasHeader ? idx(["ผู้ติดตาม", "จำนวนผู้ติดตาม", "companions", "companioncount"]) : -1;

  const now = new Date().toISOString();
  const guests: Guest[] = [];

  for (const line of rows) {
    const cols = splitCsvLine(line);
    const firstName = (firstI >= 0 ? cols[firstI] : "")?.trim() || "";
    const lastName = (lastI >= 0 ? cols[lastI] : "")?.trim() || "";
    const full = (nameI >= 0 ? cols[nameI] : "")?.trim() || composeName(firstName, lastName);
    if (!full && !firstName) continue;
    const parts = full.split(/\s+/);
    const first = firstName || parts[0] || "";
    const last = lastName || parts.slice(1).join(" ");
    const rank = (rankI >= 0 ? cols[rankI] : "")?.trim() || "";
    const levelRaw = levelI >= 0 ? cols[levelI] ?? "" : "";
    const n = Number(levelRaw);
    guests.push({
      id: uid(),
      firstName: first,
      lastName: last,
      nickname: (nickI >= 0 ? cols[nickI] : "")?.trim() || "",
      name: composeName(first, last) || full,
      rank,
      rankLevel: Number.isFinite(n) && n >= 1 && n <= 10 ? Math.round(n) : rankLevelOf(rank),
      category: parseCategory(catI >= 0 ? cols[catI] ?? "" : "", rank),
      unit: (unitI >= 0 ? cols[unitI] : "")?.trim() || "",
      phone: (phoneI >= 0 ? cols[phoneI] : "")?.trim() || "",
      companionCount: Math.max(0, Math.round(Number(companionI >= 0 ? cols[companionI] : 0) || 0)),
      source: "upload",
      checkedIn: false,
      createdAt: now,
    });
  }
  return guests;
}

export function guestsToCsv(guests: Guest[]): string {
  const header = ["ชื่อจริง", "นามสกุล", "ชื่อเล่น", "ตำแหน่ง", "ระดับยศ", "ประเภท", "หน่วยงาน", "เบอร์โทร", "ผู้ติดตาม", "เช็คอิน", "แหล่งที่มา"];
  const rows = guests.map((g) =>
    [
      g.firstName,
      g.lastName,
      g.nickname,
      g.rank,
      String(g.rankLevel),
      g.category === "adult" ? "ผู้ใหญ่" : "เยาวชน",
      g.unit,
      g.phone,
      String(g.companionCount || 0),
      g.checkedIn ? "มาแล้ว" : "ยังไม่มา",
      g.source === "scan" ? "สแกน QR" : g.source === "onsite" ? "กรอกหน้างาน" : "อัปโหลด",
    ]
      .map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
      .join(","),
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadText(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\uFEFF" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
