type CauseOption = {
  id: string;
  label: string;
  color: string;
};

type AppSettings = {
  resetMemoAfterSave: boolean;
  confirmBeforeSave: boolean;
  dateTimeFormat: "24h" | "korean";
};

type SharedState = {
  records: unknown[];
  causes: CauseOption[];
  settings: AppSettings;
  initialized: boolean;
  updatedAt: string;
};

type BackupMeta = {
  id: string;
  createdAt: string;
  stateUpdatedAt: string;
  recordCount: number;
  causeCount: number;
};

type Env = {
  DB: D1Database;
  ANGRYJ_APP_SECRET?: string;
};

const DEFAULT_CAUSES: CauseOption[] = [
  { id: "work", label: "업무", color: "#2563EB" },
  { id: "relationship", label: "대인관계", color: "#14B8A6" },
  { id: "family", label: "가족", color: "#F59E0B" },
  { id: "traffic", label: "교통", color: "#F97316" },
  { id: "health", label: "건강", color: "#8B5CF6" },
  { id: "etc", label: "기타", color: "#64748B" },
];

const DEFAULT_SETTINGS: AppSettings = {
  resetMemoAfterSave: true,
  confirmBeforeSave: false,
  dateTimeFormat: "24h",
};

const STATE_KEY = "main";
const MAX_BACKUPS = 3;

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }

  await ensureSchema(env.DB);

  if (request.method === "GET") {
    return json({ backups: await listBackups(env.DB) });
  }

  if (request.method === "POST") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const backup = await createBackup(env.DB, body);
    return json({ backup, backups: await listBackups(env.DB) }, 201);
  }

  if (request.method === "PUT") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const id = typeof body === "object" && body !== null && "id" in body ? String(body.id) : "";
    if (!id) {
      return json({ error: "Backup id is required" }, 400);
    }

    const state = await restoreBackup(env.DB, id);
    if (!state) {
      return json({ error: "Backup not found" }, 404);
    }

    return json({ state, backups: await listBackups(env.DB) });
  }

  if (request.method === "DELETE") {
    const id = await readBackupId(request);

    if (!id) {
      return json({ error: "Backup id is required" }, 400);
    }

    const deleted = await deleteBackup(env.DB, id);
    if (!deleted) {
      return json({ error: "Backup not found" }, 404);
    }

    return json({ backups: await listBackups(env.DB) });
  }

  return json({ error: "Method not allowed" }, 405, {
    Allow: "GET, POST, PUT, DELETE",
  });
};

function isAuthorized(request: Request, env: Env) {
  if (!env.ANGRYJ_APP_SECRET) {
    return true;
  }

  return request.headers.get("X-AngryJ-Secret") === env.ANGRYJ_APP_SECRET;
}

async function ensureSchema(db: D1Database) {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    )
    .run();

  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS app_state_backups (
        id TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        created_at TEXT NOT NULL,
        state_updated_at TEXT NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 0,
        cause_count INTEGER NOT NULL DEFAULT 0
      )`,
    )
    .run();

  await db
    .prepare("CREATE INDEX IF NOT EXISTS idx_app_state_backups_created_at ON app_state_backups (created_at DESC)")
    .run();
}

async function listBackups(db: D1Database): Promise<BackupMeta[]> {
  const result = await db
    .prepare(
      `SELECT id, created_at, state_updated_at, record_count, cause_count
       FROM app_state_backups
       ORDER BY created_at DESC, id DESC
       LIMIT ?1`,
    )
    .bind(MAX_BACKUPS)
    .all<{
      id: string;
      created_at: string;
      state_updated_at: string;
      record_count: number;
      cause_count: number;
    }>();

  return (result.results ?? []).map((row) => ({
    id: row.id,
    createdAt: row.created_at,
    stateUpdatedAt: row.state_updated_at,
    recordCount: Number(row.record_count ?? 0),
    causeCount: Number(row.cause_count ?? 0),
  }));
}

async function createBackup(db: D1Database, value: unknown): Promise<BackupMeta> {
  const createdAt = new Date().toISOString();
  const state = normalizeState({
    ...(typeof value === "object" && value !== null ? value : {}),
    initialized: true,
    updatedAt: createdAt,
  });
  const id = createBackupId(createdAt);

  await db
    .prepare(
      `INSERT INTO app_state_backups (id, value, created_at, state_updated_at, record_count, cause_count)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(id, JSON.stringify(state), createdAt, state.updatedAt, state.records.length, state.causes.length)
    .run();

  await pruneBackups(db);

  return {
    id,
    createdAt,
    stateUpdatedAt: state.updatedAt,
    recordCount: state.records.length,
    causeCount: state.causes.length,
  };
}

async function restoreBackup(db: D1Database, id: string): Promise<SharedState | null> {
  const row = await db.prepare("SELECT value FROM app_state_backups WHERE id = ?1").bind(id).first<{ value: string }>();

  if (!row) {
    return null;
  }

  let value: unknown;

  try {
    value = JSON.parse(row.value);
  } catch {
    return null;
  }

  return writeState(db, value);
}

async function deleteBackup(db: D1Database, id: string) {
  const row = await db.prepare("SELECT id FROM app_state_backups WHERE id = ?1").bind(id).first<{ id: string }>();

  if (!row) {
    return false;
  }

  await db.prepare("DELETE FROM app_state_backups WHERE id = ?1").bind(id).run();
  return true;
}

async function writeState(db: D1Database, value: unknown): Promise<SharedState> {
  const updatedAt = new Date().toISOString();
  const state = normalizeState({
    ...(typeof value === "object" && value !== null ? value : {}),
    initialized: true,
    updatedAt,
  });

  await db
    .prepare(
      `INSERT INTO app_state (key, value, updated_at)
       VALUES (?1, ?2, ?3)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    )
    .bind(STATE_KEY, JSON.stringify(state), updatedAt)
    .run();

  return state;
}

async function pruneBackups(db: D1Database) {
  await db
    .prepare(
      `DELETE FROM app_state_backups
       WHERE id NOT IN (
         SELECT id FROM app_state_backups
         ORDER BY created_at DESC, id DESC
         LIMIT ?1
       )`,
    )
    .bind(MAX_BACKUPS)
    .run();
}

function createBackupId(createdAt: string) {
  const stamp = createdAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  const randomId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `backup-${stamp}-${randomId.slice(0, 8)}`;
}

async function readBackupId(request: Request) {
  const queryId = new URL(request.url).searchParams.get("id");

  if (queryId) {
    return queryId;
  }

  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && "id" in body ? String(body.id) : "";
  } catch {
    return "";
  }
}

function normalizeState(raw: Record<string, unknown>): SharedState {
  return {
    records: Array.isArray(raw.records) ? raw.records : [],
    causes: Array.isArray(raw.causes) && raw.causes.length ? (raw.causes as CauseOption[]) : DEFAULT_CAUSES,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(raw.settings && typeof raw.settings === "object" ? raw.settings : {}),
    },
    initialized: Boolean(raw.initialized),
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : "",
  };
}

function json(payload: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}
