import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { groupRecordsByCause } from "../lib/anger";
import { AngerEpisodeRecord, CauseOption, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart, getChartTheme } from "./ChartCard";

type CauseDonutChartProps = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  theme: ResolvedTheme;
};

function CauseDonutChart({ records, causes, theme }: CauseDonutChartProps) {
  const data = groupRecordsByCause(records, causes);
  const visibleCauseCount = data.length;
  const chart = getChartTheme(theme);

  return (
    <ChartCard title="원인별 비중 (이번 기간)" description="선택 기간의 원인 종류별 비율">
      {records.length && data.length ? (
        <div className="grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative h-44 sm:h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="count" nameKey="cause" innerRadius={54} outerRadius={84} paddingAngle={3}>
                  {data.map((item) => (
                    <Cell key={item.cause} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, _, item) => [`${value}회`, item.payload.cause]}
                  wrapperStyle={{ zIndex: 30, pointerEvents: "none" }}
                  contentStyle={{
                    borderRadius: 14,
                    borderColor: chart.tooltipBorder,
                    background: chart.tooltipBg,
                    color: chart.tooltipText,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">원인 종류</p>
                <p className="text-2xl font-black text-slate-950 dark:text-white">{visibleCauseCount}개</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 self-center">
            {data.map((item) => (
              <div key={item.cause} className="flex min-w-0 items-center gap-3 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="min-w-0 flex-1 break-words font-bold text-slate-700 dark:text-slate-200">{item.cause}</span>
                <span className="font-black text-slate-950 dark:text-white">{item.percentage}%</span>
                <span className="w-11 text-right text-xs font-bold text-slate-500 dark:text-slate-400">
                  {item.count}회
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyChart message="원인별 비중을 볼 기록이 없습니다." />
      )}
    </ChartCard>
  );
}

export default CauseDonutChart;
