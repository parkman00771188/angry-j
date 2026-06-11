import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const defaultStatePath = join(
  process.env.APPDATA || "",
  "angry-j-desktop",
  "anger-j-shared-state.json",
);
const inputPath = process.argv[2] || defaultStatePath;

if (!existsSync(inputPath)) {
  console.error(`Local state file not found: ${inputPath}`);
  process.exit(1);
}

const raw = JSON.parse(readFileSync(inputPath, "utf8"));
const now = new Date().toISOString();
const state = normalizeState({
  ...raw,
  initialized: true,
  updatedAt: now,
});

const sqlPath = join(tmpdir(), `angry-j-import-${Date.now()}.sql`);
writeFileSync(
  sqlPath,
  `INSERT INTO app_state (key, value, updated_at)
VALUES ('main', '${sqlString(JSON.stringify(state))}', '${sqlString(now)}')
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;
`,
  "utf8",
);

execFileSync(
  process.execPath,
  [join(rootDir, "node_modules", "wrangler", "bin", "wrangler.js"), "d1", "execute", "angry-j", "--remote", "--file", sqlPath],
  { stdio: "inherit" },
);

console.log(`Imported ${state.records.length} records from ${inputPath}`);

function normalizeState(value) {
  return {
    records: Array.isArray(value.records) ? value.records.map(normalizeRecord) : [],
    causes: Array.isArray(value.causes) ? value.causes : [],
    settings: value.settings ?? {},
    initialized: true,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : now,
  };
}

function normalizeRecord(record) {
  const causes = Array.isArray(record.causes) && record.causes.length
    ? record.causes
    : [record.cause].filter(Boolean);

  return {
    ...record,
    cause: causes[0] || record.cause || "기타",
    causes,
  };
}

function sqlString(value) {
  return String(value).replaceAll("'", "''");
}
