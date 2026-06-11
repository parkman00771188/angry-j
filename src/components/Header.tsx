import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, ChevronDown, Moon, Sun, Wifi } from "lucide-react";
import { AppView, DateRange, RangeMode, ResolvedTheme } from "../types";
import { dayRangeFrom, monthRangeFrom, monthInputValue, todayRange, weekRangeFrom } from "../lib/anger";

type HeaderProps = {
  view: AppView;
  range: DateRange;
  rangeMode: RangeMode;
  resolvedTheme: ResolvedTheme;
  onRangeChange: (range: DateRange, anchorValue?: string | Date) => void;
  onRangeModeChange: (mode: RangeMode) => void;
  onThemeToggle: () => void;
};

type ServerInfo = {
  lanUrl: string;
};

const rangeModes: Array<{ key: RangeMode; label: string }> = [
  { key: "day", label: "일별" },
  { key: "week", label: "주별" },
  { key: "month", label: "월별" },
  { key: "custom", label: "기간별" },
];

const headerCopy: Record<AppView, { title: ReactNode; description: string }> = {
  dashboard: {
    title: (
      <>
        <span className="text-[#0c67ff]">J</span>의 기록 대시보드
      </>
    ),
    description: "앵그리 J를 기록하고 확인하세요!",
  },
  records: {
    title: "최근 기록",
    description: "선택한 기간의 기록을 확인하고 필요한 기록을 수정하거나 삭제하세요.",
  },
  settings: {
    title: "설정",
    description: "테마, 원인 항목, 기록 환경설정을 관리하세요.",
  },
};

function Header({
  view,
  range,
  rangeMode,
  resolvedTheme,
  onRangeChange,
  onRangeModeChange,
  onThemeToggle,
}: HeaderProps) {
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/server-info.json", { cache: "no-store", signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: ServerInfo | null) => setServerInfo(data))
      .catch(() => setServerInfo(null));

    return () => controller.abort();
  }, []);

  const updateRange = (key: keyof DateRange, value: string) => {
    const nextRange = { ...range, [key]: value };
    onRangeChange(nextRange, nextRange.end);
  };

  const applyToday = () => {
    const now = new Date();

    if (rangeMode === "day") {
      onRangeChange(dayRangeFrom(now), now);
      return;
    }

    if (rangeMode === "week") {
      onRangeChange(weekRangeFrom(now), now);
      return;
    }

    if (rangeMode === "month") {
      onRangeChange(monthRangeFrom(now), now);
      return;
    }

    onRangeChange(todayRange(), now);
  };

  const handlePrimaryDateChange = (value: string) => {
    if (rangeMode === "day") {
      onRangeChange(dayRangeFrom(value), value);
      return;
    }

    if (rangeMode === "week") {
      onRangeChange(weekRangeFrom(value), value);
      return;
    }

    onRangeChange(monthRangeFrom(value), value);
  };

  const copy = headerCopy[view];
  const showRangeControls = view !== "settings";
  const ThemeIcon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <header className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <h1 className="break-keep text-[32px] font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-[36px] xl:text-[44px]">
          {copy.title}
        </h1>
        <p className="mt-2 text-sm font-bold leading-6 text-[#62789c] dark:text-slate-400 sm:text-base">
          {copy.description}
        </p>
        {serverInfo && view === "dashboard" ? (
          <a
            href={serverInfo.lanUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/15 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15"
          >
            <Wifi className="h-3.5 w-3.5" />
            같은 네트워크 접속: {serverInfo.lanUrl}
          </a>
        ) : null}
      </div>

      <div className="flex flex-col items-start gap-3 pt-1 xl:items-end">
        {showRangeControls ? (
          <div className="inline-flex rounded-[14px] border border-[#d4e1f2] bg-white p-1 shadow-[0_10px_24px_rgba(30,86,180,0.10)] dark:border-white/[0.08] dark:bg-white/[0.04]">
            {rangeModes.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onRangeModeChange(item.key)}
                className={`rounded-[10px] px-3 py-2 text-xs font-black transition sm:px-4 ${
                  rangeMode === item.key
                    ? "bg-[#0d66ff] text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)]"
                    : "text-[#52698c] hover:bg-blue-50 dark:text-slate-300 dark:hover:bg-white/[0.08]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          {showRangeControls ? (
            <div className="flex items-center gap-2 rounded-[14px] border border-[#d4e1f2] bg-white px-4 py-3 shadow-[0_10px_24px_rgba(30,86,180,0.12)] dark:border-white/[0.08] dark:bg-white/[0.04]">
              <CalendarDays className="h-4 w-4 text-slate-500 dark:text-slate-400" />
              {rangeMode === "custom" ? (
                <>
                  <input
                    aria-label="시작 날짜"
                    type="date"
                    value={range.start}
                    onChange={(event) => updateRange("start", event.target.value)}
                    className="min-w-[120px] bg-transparent text-sm font-black text-[#273c63] outline-none dark:text-slate-200"
                  />
                  <span className="font-black text-slate-400">~</span>
                  <input
                    aria-label="종료 날짜"
                    type="date"
                    value={range.end}
                    onChange={(event) => updateRange("end", event.target.value)}
                    className="min-w-[120px] bg-transparent text-sm font-black text-[#273c63] outline-none dark:text-slate-200"
                  />
                </>
              ) : (
                <>
                  <input
                    aria-label={rangeMode === "month" ? "월 선택" : "날짜 선택"}
                    type={rangeMode === "month" ? "month" : "date"}
                    value={rangeMode === "month" ? monthInputValue(new Date(`${range.start}T00:00:00`)) : range.start}
                    onChange={(event) => handlePrimaryDateChange(event.target.value)}
                    className="min-w-[140px] bg-transparent text-sm font-black text-[#273c63] outline-none dark:text-slate-200"
                  />
                  {rangeMode === "week" ? (
                    <span className="hidden text-xs font-black text-slate-400 sm:inline">
                      {range.start} ~ {range.end}
                    </span>
                  ) : null}
                </>
              )}
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          ) : null}

          {showRangeControls ? (
            <button
              type="button"
              onClick={applyToday}
              className="rounded-[14px] border border-[#d4e1f2] bg-white px-6 py-3 text-sm font-black text-[#273c63] shadow-[0_10px_24px_rgba(30,86,180,0.12)] transition hover:bg-blue-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
            >
              오늘
            </button>
          ) : null}

          <button
            type="button"
            aria-label="테마 변경"
            title={resolvedTheme === "dark" ? "라이트 테마로 변경" : "다크 테마로 변경"}
            onClick={onThemeToggle}
            className="icon-button h-12 w-12 rounded-[14px]"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
