import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AverageDurationBucketMode,
  calculateAverageDuration,
  formatDuration,
  getDateRangeLength,
  groupAverageDuration,
} from "../lib/anger";
import { AngerEpisodeRecord, DateRange, RangeMode, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart, getChartTheme } from "./ChartCard";

type EpisodeLengthChartProps = {
  records: AngerEpisodeRecord[];
  previousRecords: AngerEpisodeRecord[];
  range: DateRange;
  rangeMode: RangeMode;
  theme: ResolvedTheme;
};

const CUSTOM_DAILY_LIMIT_DAYS = 21;
const bucketOptions: Array<{ mode: AverageDurationBucketMode; label: string }> = [
  { mode: "day", label: "일별" },
  { mode: "week", label: "주별" },
  { mode: "month", label: "월별" },
];

function EpisodeLengthChart({ records, previousRecords, range, rangeMode, theme }: EpisodeLengthChartProps) {
  const rangeLength = getDateRangeLength(range);
  const canUseDailyCustom = rangeLength <= CUSTOM_DAILY_LIMIT_DAYS;
  const defaultCustomBucketMode: AverageDurationBucketMode = canUseDailyCustom ? "day" : "week";
  const [customBucketMode, setCustomBucketMode] = useState<AverageDurationBucketMode>(defaultCustomBucketMode);
  const safeCustomBucketMode = canUseDailyCustom || customBucketMode !== "day" ? customBucketMode : "week";
  const activeBucketMode = rangeMode === "custom" ? safeCustomBucketMode : bucketModeFromRangeMode(rangeMode);
  const visibleBucketOptions = useMemo(
    () => bucketOptions.filter((option) => canUseDailyCustom || option.mode !== "day"),
    [canUseDailyCustom],
  );
  const data = useMemo(
    () => groupAverageDuration(records, range, activeBucketMode),
    [activeBucketMode, range, records],
  );
  const currentAverage = calculateAverageDuration(records);
  const previousAverage = calculateAverageDuration(previousRecords);
  const diff = currentAverage - previousAverage;
  const chart = getChartTheme(theme);
  const description = getChartDescription(rangeMode, activeBucketMode);

  useEffect(() => {
    if (rangeMode === "custom") {
      setCustomBucketMode(defaultCustomBucketMode);
    }
  }, [defaultCustomBucketMode, range.end, range.start, rangeMode]);

  return (
    <ChartCard
      title="평균 에피소드 길이 추이"
      description={description}
      contentClassName="my-auto"
      actions={
        rangeMode === "custom" ? (
          <div className="grid grid-flow-col rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.08] dark:bg-white/[0.04]">
            {visibleBucketOptions.map((option) => {
              const active = option.mode === safeCustomBucketMode;

              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => setCustomBucketMode(option.mode)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-black transition ${
                    active
                      ? "bg-[#0d66ff] text-white shadow-[0_8px_18px_rgba(37,99,235,0.22)]"
                      : "text-[#52698c] hover:bg-white dark:text-slate-300 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        ) : null
      }
    >
      {records.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 14, right: 12, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `${value}분`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: chart.tick, fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value, _, item) => [
                    formatDuration(item.payload.averageSeconds),
                    "평균 길이",
                  ]}
                  contentStyle={{
                    borderRadius: 14,
                    borderColor: chart.tooltipBorder,
                    background: chart.tooltipBg,
                    color: chart.tooltipText,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="averageMinutes"
                  stroke="#2F6BFF"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: theme === "dark" ? "#0B1220" : "#fff" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-400/15 dark:bg-blue-500/10">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400">이번 기간 평균</p>
            <p className="mt-3 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              {formatDuration(currentAverage)}
            </p>
            <p className="mt-4 text-xs font-bold text-slate-500 dark:text-slate-400">이전 기간 대비</p>
            <p className={`mt-1 text-sm font-black ${diff > 0 ? "text-red-500" : diff < 0 ? "text-blue-600 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}`}>
              {diff > 0 ? `↑ ${formatDuration(diff)}` : diff < 0 ? `↓ ${formatDuration(Math.abs(diff))}` : "변화 없음"}
            </p>
          </div>
        </div>
      ) : (
        <EmptyChart message="평균 길이를 계산할 기록이 없습니다." />
      )}
    </ChartCard>
  );
}

export default EpisodeLengthChart;

function bucketModeFromRangeMode(rangeMode: RangeMode): AverageDurationBucketMode {
  if (rangeMode === "week") {
    return "day";
  }

  if (rangeMode === "month") {
    return "week";
  }

  return "day";
}

function getChartDescription(rangeMode: RangeMode, bucketMode: AverageDurationBucketMode) {
  if (rangeMode === "week") {
    return "선택한 주의 일별 평균 지속 시간";
  }

  if (rangeMode === "month") {
    return "선택한 월의 주별 평균 지속 시간";
  }

  if (rangeMode === "custom") {
    return `${bucketLabel(bucketMode)} 평균 지속 시간`;
  }

  return "선택한 날짜의 평균 지속 시간";
}

function bucketLabel(mode: AverageDurationBucketMode) {
  if (mode === "month") {
    return "월별";
  }

  if (mode === "week") {
    return "주별";
  }

  return "일별";
}
