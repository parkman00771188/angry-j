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

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }

  await ensureSchema(env.DB);

  if (request.method === "GET") {
    return json(await readState(env.DB));
  }

  if (request.method === "PUT" || request.method === "POST") {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    return json(await writeState(env.DB, body));
  }

  return json({ error: "Method not allowed" }, 405, {
    Allow: "GET, PUT, POST",
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
}

async function readState(db: D1Database): Promise<SharedState> {
  const row = await db.prepare("SELECT value, updated_at FROM app_state WHERE key = ?1").bind(STATE_KEY).first<{
    value: string;
    updated_at: string;
  }>();

  if (!row) {
    return getDefaultState();
  }

  try {
    return normalizeState({
      ...JSON.parse(row.value),
      initialized: true,
      updatedAt: row.updated_at,
    });
  } catch {
    return getDefaultState();
  }
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

function getDefaultState(): SharedState {
  return {
    records: [],
    causes: DEFAULT_CAUSES,
    settings: DEFAULT_SETTINGS,
    initialized: false,
    updatedAt: "",
  };
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
