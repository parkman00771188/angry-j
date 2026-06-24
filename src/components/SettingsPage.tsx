import { useEffect, useState } from "react";
import { ArchiveRestore, CloudBackup, RefreshCw, Trash2 } from "lucide-react";
import { AngerEpisodeRecord, AppSettings, CauseOption, ThemePreference } from "../types";
import {
  CLOUD_SECRET_KEY,
  createSharedBackup,
  deleteSharedBackup,
  fetchSharedBackups,
  restoreSharedBackup,
  SharedBackup,
  SharedState,
} from "../lib/sharedState";
import CauseSettingsPanel from "./CauseSettingsPanel";
import ThemeToggle from "./ThemeToggle";

type SettingsPageProps = {
  theme: ThemePreference;
  records: AngerEpisodeRecord[];
  settings: AppSettings;
  causes: CauseOption[];
  onThemeChange: (theme: ThemePreference) => void;
  onSettingsChange: (settings: AppSettings) => void;
  onCausesChange: (causes: CauseOption[]) => void;
  onStateRestore: (state: SharedState) => void;
};

function SettingsPage({
  theme,
  records,
  settings,
  causes,
  onThemeChange,
  onSettingsChange,
  onCausesChange,
  onStateRestore,
}: SettingsPageProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(420px,1.25fr)]">
      <div className="space-y-4">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        <CloudSyncSettings />
        <BackupSettings
          records={records}
          causes={causes}
          settings={settings}
          onStateRestore={onStateRestore}
        />
        <OtherSettings settings={settings} onSettingsChange={onSettingsChange} />
      </div>
      <CauseSettingsPanel causes={causes} onCausesChange={onCausesChange} />
    </div>
  );
}

function CloudSyncSettings() {
  const [secret, setSecret] = useState("");

  useEffect(() => {
    setSecret(window.localStorage.getItem(CLOUD_SECRET_KEY) ?? "");
  }, []);

  const saveSecret = (value: string) => {
    setSecret(value);

    if (value.trim()) {
      window.localStorage.setItem(CLOUD_SECRET_KEY, value.trim());
    } else {
      window.localStorage.removeItem(CLOUD_SECRET_KEY);
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">클라우드 동기화</h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          Cloudflare에 설정한 비밀키가 있으면 같은 값을 입력하세요.
        </p>
      </div>

      <label className="block rounded-2xl border border-slate-200 p-4 dark:border-white/[0.08]">
        <span className="text-sm font-black text-slate-800 dark:text-slate-100">동기화 비밀키</span>
        <input
          type="password"
          value={secret}
          onChange={(event) => saveSecret(event.target.value)}
          placeholder="ANGRYJ_APP_SECRET"
          className="soft-input mt-2 w-full"
        />
      </label>
    </section>
  );
}

type BackupMessage = {
  tone: "success" | "error";
  text: string;
};

function BackupSettings({
  records,
  causes,
  settings,
  onStateRestore,
}: {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  settings: AppSettings;
  onStateRestore: (state: SharedState) => void;
}) {
  const [backups, setBackups] = useState<SharedBackup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState<BackupMessage | null>(null);
  const busy = creating || Boolean(workingId) || Boolean(deletingId);

  const loadBackups = async (signal?: AbortSignal) => {
    setLoading(true);

    try {
      const result = await fetchSharedBackups(signal);

      if (signal?.aborted) {
        return;
      }

      if (!result) {
        throw new Error("Backups are unavailable");
      }

      setBackups(result.backups);
    } catch {
      if (!signal?.aborted) {
        setMessage({ tone: "error", text: "백업 목록을 불러오지 못했습니다. Cloudflare 연결을 확인해주세요." });
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadBackups(controller.signal);

    return () => controller.abort();
  }, []);

  const handleCreateBackup = async () => {
    setCreating(true);
    setMessage(null);

    try {
      const result = await createSharedBackup({ records, causes, settings });

      if (!result) {
        throw new Error("Backup failed");
      }

      setBackups(result.backups);
      setMessage({ tone: "success", text: "새 백업을 저장했습니다. 백업은 최근 3개만 보관됩니다." });
    } catch {
      setMessage({ tone: "error", text: "백업을 저장하지 못했습니다. Cloudflare 연결을 확인해주세요." });
    } finally {
      setCreating(false);
    }
  };

  const handleRestoreBackup = async (backup: SharedBackup) => {
    const confirmed = window.confirm(
      `${formatBackupDateTime(backup.createdAt)} 백업으로 현재 기록을 복원할까요?\n현재 기록, 원인, 표시 설정이 백업 내용으로 바뀝니다.`,
    );

    if (!confirmed) {
      return;
    }

    setWorkingId(backup.id);
    setMessage(null);

    try {
      const result = await restoreSharedBackup(backup.id);

      if (!result?.state) {
        throw new Error("Restore failed");
      }

      setBackups(result.backups);
      onStateRestore(result.state);
      setMessage({ tone: "success", text: "백업에서 최근 기록을 복원했습니다." });
    } catch {
      setMessage({ tone: "error", text: "백업 복원에 실패했습니다. 잠시 뒤 다시 시도해주세요." });
    } finally {
      setWorkingId("");
    }
  };

  const handleDeleteBackup = async (backup: SharedBackup) => {
    const confirmed = window.confirm(`${formatBackupDateTime(backup.createdAt)} 백업을 삭제할까요?\n삭제한 백업은 다시 복원할 수 없습니다.`);

    if (!confirmed) {
      return;
    }

    setDeletingId(backup.id);
    setMessage(null);

    try {
      const result = await deleteSharedBackup(backup.id);

      if (!result) {
        throw new Error("Delete failed");
      }

      setBackups(result.backups);
      setMessage({ tone: "success", text: "선택한 백업을 삭제했습니다." });
    } catch {
      setMessage({ tone: "error", text: "백업 삭제에 실패했습니다. 잠시 뒤 다시 시도해주세요." });
    } finally {
      setDeletingId("");
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">데이터 백업</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            Cloudflare D1에 현재 기록을 백업하고 필요할 때 다시 불러옵니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadBackups()}
            disabled={loading || busy}
            className="secondary-button px-3 py-2 text-xs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            새로고침
          </button>
          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={busy}
            className="primary-button px-3 py-2 text-xs"
          >
            <CloudBackup className="h-4 w-4" />
            {creating ? "저장 중" : "백업 생성"}
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black text-blue-700 dark:text-blue-200">Cloudflare D1 백업</span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-blue-700 dark:bg-white/[0.08] dark:text-blue-200">
            {backups.length}/3
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold leading-5 text-blue-600 dark:text-blue-200/80">
          새 백업을 만들면 4번째 백업부터 가장 오래된 항목이 자동으로 정리됩니다.
        </p>
      </div>

      {message ? (
        <p
          className={`mb-4 rounded-xl px-3 py-2 text-sm font-bold ${
            message.tone === "success"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {message.text}
        </p>
      ) : null}

      <div className="space-y-3">
        {loading && !backups.length ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400">
            백업 목록을 불러오는 중입니다.
          </div>
        ) : backups.length ? (
          backups.map((backup) => (
            <div
              key={backup.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/[0.08] dark:bg-white/[0.04] sm:grid-cols-[minmax(0,1fr)_176px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                  {formatBackupDateTime(backup.createdAt)}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">
                  기록 {backup.recordCount}개 · 원인 {backup.causeCount}개
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400 dark:text-slate-500">
                  상태 기준 {formatBackupDateTime(backup.stateUpdatedAt)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_44px]">
                <button
                  type="button"
                  onClick={() => handleRestoreBackup(backup)}
                  disabled={busy}
                  className="secondary-button px-3 py-2 text-xs"
                >
                  <ArchiveRestore className="h-4 w-4" />
                  {workingId === backup.id ? "복원 중" : "복원"}
                </button>
                <button
                  type="button"
                  aria-label="백업 삭제"
                  title="백업 삭제"
                  onClick={() => handleDeleteBackup(backup)}
                  disabled={busy}
                  className="danger-button px-3 py-2 text-xs sm:px-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sm:hidden">{deletingId === backup.id ? "삭제 중" : "삭제"}</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm font-bold text-slate-500 dark:border-white/[0.12] dark:text-slate-400">
            아직 저장된 백업이 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}

function formatBackupDateTime(value: string) {
  const date = new Date(value);

  if (!value || Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function OtherSettings({
  settings,
  onSettingsChange,
}: {
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">기타 설정</h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          기록 저장 이후의 동작과 표시 방식을 조정합니다.
        </p>
      </div>

      <div className="space-y-3">
        <ToggleRow
          title="기록 저장 후 메모 초기화"
          description="종료 버튼으로 저장한 뒤 메모 입력값을 비웁니다."
          checked={settings.resetMemoAfterSave}
          onChange={(checked) => onSettingsChange({ ...settings, resetMemoAfterSave: checked })}
        />
        <ToggleRow
          title="종료 시 저장 확인"
          description="종료 버튼을 누를 때 확인창을 한 번 더 표시합니다."
          checked={settings.confirmBeforeSave}
          onChange={(checked) => onSettingsChange({ ...settings, confirmBeforeSave: checked })}
        />

        <div className="rounded-2xl border border-slate-200 p-4 dark:border-white/[0.08]">
          <label className="text-sm font-black text-slate-800 dark:text-slate-100" htmlFor="date-format">
            날짜/시간 표시 방식
          </label>
          <select
            id="date-format"
            value={settings.dateTimeFormat}
            onChange={(event) =>
              onSettingsChange({ ...settings, dateTimeFormat: event.target.value as AppSettings["dateTimeFormat"] })
            }
            className="soft-input mt-2 w-full"
          >
            <option value="24h">24시간제</option>
            <option value="korean">한국어 문장형</option>
          </select>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]">
      <span>
        <span className="block text-sm font-black text-slate-800 dark:text-slate-100">{title}</span>
        <span className="mt-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-blue-600"
      />
    </label>
  );
}

export default SettingsPage;
