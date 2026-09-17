import fs from "node:fs";
import path from "node:path";

const DEFAULT_SETTINGS = {
  eventName: "งานเลี้ยง ปาร์ตี้ หน้ากากทักซิโด ยินดีตำแหน่งใหม่ รองด้วง ใหญ่กว่าเดิม",
  eventDate: "",
  venue: "โบว์ลิ่ง",
  teamCount: 4,
  publicUrl: "",
};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "event.json");

export { DEFAULT_SETTINGS, DATA_DIR, DATA_FILE };

export function emptyState() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    guests: [],
    teams: [],
    prizes: [],
    raffleWinners: [],
    updatedAt: 0,
  };
}

function normalizeState(parsed) {
  const base = emptyState();
  if (!parsed || typeof parsed !== "object") return base;
  return {
    ...base,
    ...parsed,
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    guests: parsed.guests ?? [],
    teams: parsed.teams ?? [],
    prizes: parsed.prizes ?? [],
    raffleWinners: parsed.raffleWinners ?? [],
    updatedAt: Number(parsed.updatedAt) || 0,
  };
}

function richness(state) {
  return (state.guests?.length || 0) * 10 + (state.prizes?.length || 0) + (state.raffleWinners?.length || 0);
}

function readFileState() {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyState();
    return normalizeState(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")));
  } catch (err) {
    console.error("read event file", err);
    return emptyState();
  }
}

function writeFileState(state) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf8");
}

let cache = emptyState();
let pool = null;
let initPromise = null;
let usingPostgres = false;

function databaseUrl() {
  return process.env.DATABASE_URL?.trim() || "";
}

async function getPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (pool) return pool;
  const pg = await import("pg");
  const Pool = pg.default?.Pool || pg.Pool;
  pool = new Pool({
    connectionString: url,
    max: 2,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
  });
  return pool;
}

async function ensureTable(db) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS party_event_state (
      id INTEGER PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function readPostgres() {
  const db = await getPool();
  if (!db) return null;
  await ensureTable(db);
  const result = await db.query("SELECT payload FROM party_event_state WHERE id = 1");
  if (!result.rows[0]) return emptyState();
  return normalizeState(result.rows[0].payload);
}

async function writePostgres(state) {
  const db = await getPool();
  if (!db) return;
  await ensureTable(db);
  await db.query(
    `
      INSERT INTO party_event_state (id, payload, updated_at)
      VALUES (1, $1::jsonb, NOW())
      ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
    `,
    [JSON.stringify(state)],
  );
}

export async function initStore() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    cache = readFileState();
    try {
      if (databaseUrl()) {
        const remote = await readPostgres();
        if (richness(remote) >= richness(cache)) {
          cache = remote;
          if (richness(remote) > 0) writeFileState(cache);
        } else if (richness(cache) > 0) {
          await writePostgres(cache);
        }
        usingPostgres = true;
        console.log(`event store: postgres guests=${cache.guests.length}`);
      } else {
        console.log(`event store: local file only guests=${cache.guests.length}`);
      }
    } catch (err) {
      usingPostgres = false;
      console.error("event store postgres failed, using file", err);
    }
  })();
  return initPromise;
}

export async function ensureStore() {
  await initStore();
}

export function readState() {
  return cache;
}

export async function writeState(state) {
  cache = normalizeState({ ...state, updatedAt: Date.now() });
  writeFileState(cache);
  if (usingPostgres || databaseUrl()) {
    try {
      await writePostgres(cache);
      usingPostgres = true;
    } catch (err) {
      console.error("event store postgres write failed", err);
    }
  }
  return cache;
}

export function storeKind() {
  return usingPostgres ? "postgres" : "file";
}
