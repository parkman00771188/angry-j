import { useEffect, useState } from "react";
import { AppSettings, CauseOption, ThemePreference } from "../types";
import { CLOUD_SECRET_KEY } from "../lib/sharedState";
import CauseSettingsPanel from "./CauseSettingsPanel";
import ThemeToggle from "./ThemeToggle";

type SettingsPageProps = {
  theme: ThemePreference;
  settings: AppSettings;
  causes: CauseOption[];
  onThemeChange: (theme: ThemePreference) => void;
  onSettingsChange: (settings: AppSettings) => void;
  onCausesChange: (causes: CauseOption[]) => void;
};

function SettingsPage({
  theme,
  settings,
  causes,
  onThemeChange,
  onSettingsChange,
  onCausesChange,
}: SettingsPageProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,0.75fr)_minmax(420px,1.25fr)]">
      <div className="space-y-4">
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
        <CloudSyncSettings />
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
