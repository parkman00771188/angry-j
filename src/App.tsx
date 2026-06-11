import { useEffect, useMemo, useRef, useState } from "react";
import DashboardPage from "./components/DashboardPage";
import Layout from "./components/Layout";
import RecordsPage from "./components/RecordsPage";
import SettingsPage from "./components/SettingsPage";
import {
  CAUSES_KEY,
  DEFAULT_CAUSES,
  DEFAULT_SETTINGS,
  RECORDS_KEY,
  SETTINGS_KEY,
  THEME_KEY,
  dateInputValue,
  defaultDateRange,
  getStoredTheme,
  rangeFromMode,
  getRecordCauses,
} from "./lib/anger";
import { fetchSharedState, saveSharedState, SharedState } from "./lib/sharedState";
import {
  AngerEpisodeRecord,
  AppSettings,
  AppView,
  CauseOption,
  DateRange,
  RangeMode,
  ResolvedTheme,
  ThemePreference,
} from "./types";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function resolveTheme(theme: ThemePreference): ResolvedTheme {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  return theme;
}

function normalizeSharedState(state: SharedState | null) {
  if (!state) {
    return null;
  }

  return {
    records: Array.isArray(state.records) ? state.records : [],
    causes: Array.isArray(state.causes) && state.causes.length ? state.causes : DEFAULT_CAUSES,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(state.settings ?? {}),
    },
    initialized: Boolean(state.initialized),
    updatedAt: state.updatedAt ?? "",
  };
}

function normalizeRangeAnchor(value?: string | Date, fallback = dateInputValue(new Date())) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : dateInputValue(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateValue = /^\d{4}-\d{2}$/.test(trimmed) ? `${trimmed}-01` : trimmed.slice(0, 10);
    const date = new Date(`${dateValue}T00:00:00`);

    return Number.isNaN(date.getTime()) ? fallback : dateInputValue(date);
  }

  return fallback;
}

function App() {
  const [view, setView] = useState<AppView>("dashboard");
  const [records, setRecords] = useState<AngerEpisodeRecord[]>(() => readJson(RECORDS_KEY, []));
  const [causes, setCauses] = useState<CauseOption[]>(() => readJson(CAUSES_KEY, DEFAULT_CAUSES));
  const [theme, setTheme] = useState<ThemePreference>(() => getStoredTheme(localStorage.getItem(THEME_KEY)));
  const [settings, setSettings] = useState<AppSettings>(() => readJson(SETTINGS_KEY, DEFAULT_SETTINGS));
  const [range, setRange] = useState<DateRange>(defaultDateRange);
  const [customRange, setCustomRange] = useState<DateRange>(defaultDateRange);
  const [rangeAnchor, setRangeAnchor] = useState(() => dateInputValue(new Date()));
  const [rangeMode, setRangeMode] = useState<RangeMode>("custom");
  const [mobileRecorderOpen, setMobileRecorderOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));
  const [sharedReady, setSharedReady] = useState(false);
  const [sharedAvailable, setSharedAvailable] = useState(false);
  const initialLocalStateRef = useRef({
    records,
    causes,
    settings,
  });
  const skipNextSharedSaveRef = useRef(false);
  const lastSharedUpdatedAtRef = useRef("");

  useEffect(() => {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    window.localStorage.setItem(CAUSES_KEY, JSON.stringify(causes));
  }, [causes]);

  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    const updateTheme = () => {
      const next = resolveTheme(theme);
      setResolvedTheme(next);
      document.documentElement.classList.toggle("dark", next === "dark");
    };

    updateTheme();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", updateTheme);

    return () => media.removeEventListener("change", updateTheme);
  }, [theme]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    const controller = new AbortController();

    async function hydrateSharedState() {
      try {
        const remote = normalizeSharedState(await fetchSharedState(controller.signal));

        if (!remote) {
          setSharedReady(true);
          return;
        }

        setSharedAvailable(true);

        if (remote.initialized) {
          skipNextSharedSaveRef.current = true;
          lastSharedUpdatedAtRef.current = remote.updatedAt;
          setRecords(remote.records);
          setCauses(remote.causes);
          setSettings(remote.settings);
        } else {
          const saved = normalizeSharedState(await saveSharedState(initialLocalStateRef.current));
          lastSharedUpdatedAtRef.current = saved?.updatedAt ?? "";
        }
      } catch {
        setSharedAvailable(false);
      } finally {
        setSharedReady(true);
      }
    }

    hydrateSharedState();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!sharedReady || !sharedAvailable) {
      return;
    }

    if (skipNextSharedSaveRef.current) {
      skipNextSharedSaveRef.current = false;
      return;
    }

    const timeout = window.setTimeout(() => {
      saveSharedState({ records, causes, settings })
        .then((state) => {
          if (state?.updatedAt) {
            lastSharedUpdatedAtRef.current = state.updatedAt;
          }
        })
        .catch(() => {
          setSharedAvailable(false);
        });
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [causes, records, settings, sharedAvailable, sharedReady]);

  useEffect(() => {
    if (!sharedReady || !sharedAvailable) {
      return;
    }

    const interval = window.setInterval(() => {
      fetchSharedState()
        .then((state) => {
          const remote = normalizeSharedState(state);

          if (!remote?.initialized || !remote.updatedAt || remote.updatedAt === lastSharedUpdatedAtRef.current) {
            return;
          }

          skipNextSharedSaveRef.current = true;
          lastSharedUpdatedAtRef.current = remote.updatedAt;
          setRecords(remote.records);
          setCauses(remote.causes);
          setSettings(remote.settings);
        })
        .catch(() => {
          setSharedAvailable(false);
        });
    }, 2500);

    return () => window.clearInterval(interval);
  }, [sharedAvailable, sharedReady]);

  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [records],
  );

  const addRecord = (record: AngerEpisodeRecord) => {
    setRecords((current) => [record, ...current]);
    setToast("기록이 저장되었습니다.");
  };

  const updateRecord = (record: AngerEpisodeRecord) => {
    setRecords((current) => current.map((item) => (item.id === record.id ? record : item)));
    setToast("기록이 수정되었습니다.");
  };

  const updateCauses = (nextCauses: CauseOption[]) => {
    const previousById = new Map(causes.map((cause) => [cause.id, cause]));
    const renameMap = new Map<string, string>();

    nextCauses.forEach((next) => {
      const previous = previousById.get(next.id);
      if (previous && previous.label !== next.label && next.label.trim()) {
        renameMap.set(previous.label, next.label.trim());
      }
    });

    const normalized = nextCauses.map((cause) => ({
      ...cause,
      label: cause.label.trim() || "이름 없음",
    }));

    setCauses(normalized);

    if (renameMap.size) {
      const now = new Date().toISOString();
      setRecords((current) =>
        current.map((record) => {
          const renamedCauses = getRecordCauses(record).map((cause) => renameMap.get(cause) ?? cause);
          const causeChanged = renamedCauses.some((cause, index) => cause !== getRecordCauses(record)[index]);

          return causeChanged
            ? {
                ...record,
                cause: renamedCauses[0] ?? record.cause,
                causes: renamedCauses,
                updatedAt: now,
              }
            : record;
        }),
      );
    }
  };

  const deleteRecord = (id: string) => {
    setRecords((current) => current.filter((record) => record.id !== id));
    setToast("기록이 삭제되었습니다.");
  };

  const deleteRecords = (ids: string[]) => {
    const idSet = new Set(ids);
    setRecords((current) => current.filter((record) => !idSet.has(record.id)));
    setToast(`${ids.length}개 기록이 삭제되었습니다.`);
  };

  const changeRange = (nextRange: DateRange, anchorValue?: string | Date) => {
    setRange(nextRange);

    if (rangeMode === "custom") {
      setCustomRange(nextRange);
    }

    setRangeAnchor((current) => normalizeRangeAnchor(anchorValue ?? nextRange.end, current));
  };

  const changeRangeMode = (mode: RangeMode) => {
    setRangeMode(mode);

    if (mode === "custom") {
      setRange(customRange);
      setRangeAnchor((current) => normalizeRangeAnchor(customRange.end, current));
      return;
    }

    const anchorValue = normalizeRangeAnchor(rangeAnchor);
    const anchor = new Date(`${anchorValue}T00:00:00`);
    setRange(rangeFromMode(mode, Number.isNaN(anchor.getTime()) ? new Date() : anchor));
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const changeView = (nextView: AppView) => {
    setView(nextView);

    if (nextView !== "dashboard") {
      setMobileRecorderOpen(false);
    }
  };

  return (
    <div className="theme-glow min-h-screen">
      <Layout
        view={view}
        range={range}
        rangeMode={rangeMode}
        resolvedTheme={resolvedTheme}
        onViewChange={changeView}
        onRangeChange={changeRange}
        onRangeModeChange={changeRangeMode}
        onThemeToggle={toggleTheme}
        onMobileRecordInputOpen={() => setMobileRecorderOpen(true)}
      >
        {view === "dashboard" ? (
          <DashboardPage
            records={sortedRecords}
            causes={causes}
            settings={settings}
            range={range}
            resolvedTheme={resolvedTheme}
            onCreateRecord={addRecord}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
            onDeleteRecords={deleteRecords}
            mobileRecorderOpen={mobileRecorderOpen}
            onMobileRecorderClose={() => setMobileRecorderOpen(false)}
            onViewAllRecords={() => changeView("records")}
          />
        ) : view === "records" ? (
          <RecordsPage
            records={sortedRecords}
            causes={causes}
            settings={settings}
            range={range}
            onUpdateRecord={updateRecord}
            onDeleteRecord={deleteRecord}
            onDeleteRecords={deleteRecords}
          />
        ) : (
          <SettingsPage
            theme={theme}
            settings={settings}
            causes={causes}
            onThemeChange={setTheme}
            onSettingsChange={setSettings}
            onCausesChange={updateCauses}
          />
        )}
      </Layout>

      {toast ? (
        <div className="fixed right-5 top-5 z-50 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-bold text-emerald-700 shadow-[0_18px_55px_rgba(15,23,42,0.18)] dark:border-emerald-400/20 dark:bg-[#0b1220] dark:text-emerald-300">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

export default App;
