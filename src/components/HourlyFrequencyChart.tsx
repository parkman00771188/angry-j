import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { groupRecordsByHour } from "../lib/anger";
import { AngerEpisodeRecord, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart, getChartTheme } from "./ChartCard";

type HourlyFrequencyChartProps = {
  records: AngerEpisodeRecord[];
  theme: ResolvedTheme;
};

function HourlyFrequencyChart({ records, theme }: HourlyFrequencyChartProps) {
  const data = groupRecordsByHour(records);
  const peak = data.reduce((best, item) => (item.count > best.count ? item : best), data[0]);
  const chart = getChartTheme(theme);

  return (
    <ChartCard title="시간대별 기록 빈도 (기록 수)" description="오전 8시부터 오후 8시까지 1시간 단위로 집계됩니다.">
      {records.length ? (
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 18, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
              <XAxis
                dataKey="label"
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={{ fill: chart.tick, fontSize: 11 }}
              />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}회`, "기록 수"]}
                contentStyle={{
                  borderRadius: 14,
                  borderColor: chart.tooltipBorder,
                  background: chart.tooltipBg,
                  color: chart.tooltipText,
                }}
              />
              <Bar dataKey="count" radius={[7, 7, 0, 0]} maxBarSize={26}>
                <LabelList
                  dataKey="count"
                  position="top"
                  fill={theme === "dark" ? "#DDE8FF" : "#24385E"}
                  fontSize={12}
                  fontWeight={900}
                />
                {data.map((item) => (
                  <Cell key={item.hour} fill={item.hour === peak.hour && peak.count > 0 ? "#0D66FF" : "#6EA4FF"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="시간대별 빈도를 계산할 기록이 없습니다." />
      )}
    </ChartCard>
  );
}

export default HourlyFrequencyChart;
