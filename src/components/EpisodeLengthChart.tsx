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
  calculateAverageDuration,
  formatDuration,
  groupAverageDurationByWeek,
} from "../lib/anger";
import { AngerEpisodeRecord, DateRange, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart, getChartTheme } from "./ChartCard";

type EpisodeLengthChartProps = {
  records: AngerEpisodeRecord[];
  previousRecords: AngerEpisodeRecord[];
  range: DateRange;
  theme: ResolvedTheme;
};

function EpisodeLengthChart({ records, previousRecords, range, theme }: EpisodeLengthChartProps) {
  const data = groupAverageDurationByWeek(records, range);
  const currentAverage = calculateAverageDuration(records);
  const previousAverage = calculateAverageDuration(previousRecords);
  const diff = currentAverage - previousAverage;
  const chart = getChartTheme(theme);

  return (
    <ChartCard title="평균 에피소드 길이 추이" description="주간 단위 평균 지속 시간">
      {records.length ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_170px]">
          <div className="h-56">
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
