import {
  categoryOf,
  composeName,
  DEFAULT_SETTINGS,
  rankLevelOf,
  type AppState,
  type Guest,
  type Prize,
} from "./types";

const KEY = "party-checkin-v1";

const emptyState = (): AppState => ({
  settings: { ...DEFAULT_SETTINGS },
  guests: [],
  teams: [],
  prizes: [],
  raffleWinners: [],
  updatedAt: Date.now(),
});

export function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizePrize(raw: Partial<Prize>): Prize {
  return {
    id: raw.id || uid(),
    name: (raw.name ?? "").trim() || "ของรางวัล",
    quantity: Math.max(1, Math.round(Number(raw.quantity) || 1)),
    sponsorName: (raw.sponsorName ?? "").trim(),
    sponsorOrg: (raw.sponsorOrg ?? "").trim(),
    sponsorPhone: (raw.sponsorPhone ?? "").trim(),
    note: (raw.note ?? "").trim(),
    source: raw.source === "sponsor" ? "sponsor" : "staff",
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

export function normalizeGuest(raw: Partial<Guest> & { name?: string }): Guest {
  const firstName = (raw.firstName ?? "").trim() || (raw.name ?? "").trim().split(/\s+/)[0] || "";
  const lastName =
    (raw.lastName ?? "").trim() ||
    (raw.name ?? "")
      .trim()
      .split(/\s+/)
      .slice(1)
      .join(" ");
  const rank = (raw.rank ?? "").trim();
  return {
    id: raw.id || uid(),
    firstName,
    lastName,
    nickname: (raw.nickname ?? "").trim(),
    name: composeName(firstName, lastName) || (raw.name ?? "").trim(),
    rank,
    rankLevel: raw.rankLevel ?? rankLevelOf(rank),
    category: raw.category ?? categoryOf(rank),
    unit: raw.unit ?? "",
    phone: raw.phone ?? "",
    companionCount: Math.max(0, Math.round(Number(raw.companionCount) || 0)),
    source: raw.source ?? "upload",
    checkedIn: Boolean(raw.checkedIn),
    checkedInAt: raw.checkedInAt,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

function normalizeState(parsed: Partial<AppState> | null): AppState {
  const base = emptyState();
  if (!parsed) return base;
  return {
    ...base,
    ...parsed,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    guests: (parsed.guests ?? []).map(normalizeGuest),
    teams: parsed.teams ?? [],
    prizes: (parsed.prizes ?? []).map(normalizePrize),
    raffleWinners: parsed.raffleWinners ?? [],
  };
}

function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return normalizeState(JSON.parse(raw) as AppState);
  } catch {
    return emptyState();
  }
}

let state = loadLocal();
let lastLocalWrite = 0;
let syncTimer: number | undefined;
const listeners = new Set<() => void>();

function emit(persistRemote = true) {
  lastLocalWrite = Date.now();
  state = { ...state, updatedAt: lastLocalWrite };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn());
  if (persistRemote) {
    void fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => undefined);
  }
}

export function getState(): AppState {
  return state;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(patch: Partial<AppState> | ((prev: AppState) => AppState)) {
  state = typeof patch === "function" ? patch(state) : { ...state, ...patch };
  emit(true);
}

export function applyRemote(remote: AppState) {
  state = normalizeState(remote);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((fn) => fn());
}

function shouldKeepLocal(remote: AppState) {
  const remoteAt = remote.updatedAt ?? 0;
  const localAt = state.updatedAt ?? 0;
  if (remoteAt >= localAt) return false;
  return (
    (state.guests.length > 0 && remote.guests.length === 0) ||
    (state.prizes.length > 0 && remote.prizes.length === 0 && remote.guests.length === 0)
  );
}

export async function restoreIfServerEmpty() {
  try {
    const res = await fetch("/api/state");
    if (!res.ok) return;
    const remote = normalizeState((await res.json()) as AppState);
    if (shouldKeepLocal(remote)) {
      emit(true);
      return;
    }
    if (remote.guests.length > 0 || remote.prizes.length > 0) {
      applyRemote(remote);
    }
  } catch {
    // keep local copy
  }
}

export async function startAdminSync() {
  await restoreIfServerEmpty();

  window.clearInterval(syncTimer);
  syncTimer = window.setInterval(async () => {
    if (Date.now() - lastLocalWrite < 900) return;
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;
      const remote = normalizeState((await res.json()) as AppState);
      if (shouldKeepLocal(remote)) {
        emit(true);
        return;
      }
      const remoteAt = remote.updatedAt ?? 0;
      const localAt = state.updatedAt ?? 0;
      const guestsChanged =
        JSON.stringify(remote.guests.map((g) => g.id)) !== JSON.stringify(state.guests.map((g) => g.id));
      const prizesChanged =
        JSON.stringify(remote.prizes.map((p) => p.id)) !== JSON.stringify(state.prizes.map((p) => p.id));
      if (remoteAt >= localAt && (guestsChanged || prizesChanged)) {
        applyRemote(remote);
      } else if (remoteAt > localAt) {
        applyRemote(remote);
      }
    } catch {
      // ignore
    }
  }, 2500);
}

export async function registerGuest(input: Omit<Guest, "id" | "createdAt" | "checkedIn" | "checkedInAt" | "name"> & Partial<Pick<Guest, "id" | "checkedIn">>) {
  const guest = normalizeGuest({
    ...input,
    id: input.id ?? uid(),
    checkedIn: input.checkedIn ?? true,
    checkedInAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  const res = await fetch("/api/guests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(guest),
  });

  if (res.status === 409) {
    const body = (await res.json()) as { error?: string; guest?: Guest };
    throw new Error(body.error || "ลงทะเบียนซ้ำ");
  }
  if (!res.ok) {
    throw new Error("ส่งข้อมูลไปเครื่องเจ้าหน้าที่ไม่ได้ กรุณาต่อ Wi‑Fi เดียวกับงานแล้วลองใหม่");
  }
  return guest;
}

export async function registerPrize(input: Omit<Prize, "id" | "createdAt"> & Partial<Pick<Prize, "id" | "createdAt">>) {
  const prize = normalizePrize({
    ...input,
    id: input.id ?? uid(),
    createdAt: input.createdAt ?? new Date().toISOString(),
  });

  const res = await fetch("/api/prizes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prize),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "ส่งของรางวัลไปเครื่องเจ้าหน้าที่ไม่ได้ กรุณาลองใหม่");
  }
  return prize;
}

export function guestQrPayload(guest: Guest): string {
  return `GUEST:${guest.id}`;
}

export function parseGuestQr(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.startsWith("GUEST:")) return trimmed.slice(6);
  return trimmed || null;
}

export function downloadJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-event-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJson(file: File): Promise<void> {
  return file.text().then((text) => {
    const parsed = JSON.parse(text) as AppState;
    if (!parsed || !Array.isArray(parsed.guests)) {
      throw new Error("ไฟล์สำรองไม่ถูกต้อง");
    }
    state = normalizeState(parsed);
    emit(true);
  });
}

export function resetAll() {
  state = emptyState();
  emit(true);
}

export async function resetForNewEvent(options: { clearPrizes?: boolean } = {}) {
  const res = await fetch("/api/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clearPrizes: Boolean(options.clearPrizes) }),
  });
  if (!res.ok) {
    throw new Error("รีเซตบนเซิร์ฟเวอร์ไม่สำเร็จ กรุณาลองใหม่");
  }
  const remote = normalizeState((await res.json()) as AppState);
  lastLocalWrite = Date.now();
  applyRemote(remote);
}
