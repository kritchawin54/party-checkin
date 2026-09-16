export type Category = "adult" | "youth";
export type GuestSource = "upload" | "onsite" | "scan";

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  nickname: string;
  name: string;
  rank: string;
  rankLevel: number;
  category: Category;
  unit: string;
  phone: string;
  companionCount: number;
  source: GuestSource;
  checkedIn: boolean;
  checkedInAt?: string;
  createdAt: string;
};

export type PrizeSource = "staff" | "sponsor";

export type Prize = {
  id: string;
  name: string;
  quantity: number;
  sponsorName: string;
  sponsorOrg: string;
  sponsorPhone: string;
  note: string;
  source: PrizeSource;
  createdAt: string;
};

export type RaffleWinner = {
  id: string;
  guestId: string;
  prizeId: string;
  prizeName: string;
  drawnAt: string;
};

export type BowlingTeam = {
  id: string;
  name: string;
  color: string;
  captainId?: string;
  memberIds: string[];
};

export type EventSettings = {
  eventName: string;
  eventDate: string;
  venue: string;
  teamCount: number;
  publicUrl: string;
};

export type AppState = {
  settings: EventSettings;
  guests: Guest[];
  teams: BowlingTeam[];
  prizes: Prize[];
  raffleWinners: RaffleWinner[];
  groupedAt?: string;
  updatedAt?: number;
};

export const RANK_PRESETS: { rank: string; level: number }[] = [
  { rank: "ผบก.", level: 10 },
  { rank: "รอง ผบก.", level: 9 },
  { rank: "ผกก.", level: 8 },
  { rank: "รอง ผกก.", level: 7 },
  { rank: "สว.", level: 6 },
  { rank: "รอง สว.", level: 5 },
  { rank: "ด.ต.", level: 4 },
  { rank: "ผบ.หมู่", level: 3 },
  { rank: "อื่นๆ / ประชาชน", level: 2 },
  { rank: "ครอบครัว / ผู้ติดตาม", level: 1 },
  { rank: "เยาวชน / เด็ก", level: 1 },
];

export const TEAM_COLORS = [
  "#ff2d7b",
  "#5ce1e6",
  "#ffe566",
  "#b6ff6a",
  "#ff8a4c",
  "#c084fc",
  "#38bdf8",
  "#f472b6",
];

export const DEFAULT_SETTINGS: EventSettings = {
  eventName: "งานเลี้ยง ปาร์ตี้ หน้ากากทักซิโด ยินดีตำแหน่งใหม่ รองด้วง ใหญ่กว่าเดิม",
  eventDate: "",
  venue: "โบว์ลิ่ง",
  teamCount: 4,
  publicUrl: "",
};

export const QR_PREFIX = "GUEST:";

export function composeName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}

export function guestLabel(guest: Pick<Guest, "name" | "nickname" | "firstName" | "lastName">): string {
  const full = guest.name || composeName(guest.firstName, guest.lastName);
  return guest.nickname ? `${guest.nickname} · ${full}` : full;
}

export function rankLevelOf(rank: string): number {
  const exact = RANK_PRESETS.find((p) => p.rank === rank);
  if (exact) return exact.level;
  const r = rank.toLowerCase();
  if (r.includes("ผบก") && r.includes("รอง")) return 9;
  if (r.includes("ผบก")) return 10;
  if (r.includes("ผกก") && r.includes("รอง")) return 7;
  if (r.includes("ผกก")) return 8;
  if (r.includes("สว") && r.includes("รอง")) return 5;
  if (r.includes("สว")) return 6;
  if (r.includes("ด.ต") || r.includes("ดาบ")) return 4;
  if (r.includes("ผบ.หมู่") || r.includes("หมู่")) return 3;
  if (r.includes("เยาวชน") || r.includes("เด็ก") || r.includes("ครอบครัว")) return 1;
  return 2;
}

export function categoryOf(rank: string): Category {
  if (/เยาวชน|เด็ก/.test(rank)) return "youth";
  return "adult";
}

export function prizeLabel(prize: Pick<Prize, "name" | "sponsorName">): string {
  return prize.sponsorName ? `${prize.name} · สนับสนุนโดย ${prize.sponsorName}` : prize.name;
}
