import {
  CartesianGrid,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { groupRecordsByDay } from "../lib/anger";
import { AngerEpisodeRecord, DateRange, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart, getChartTheme } from "./ChartCard";

type DailyTrendChartProps = {
  records: AngerEpisodeRecord[];
  range: DateRange;
  theme: ResolvedTheme;
};

function DailyTrendChart({ records, range, theme }: DailyTrendChartProps) {
  const data = groupRecordsByDay(records, range);
  const chart = getChartTheme(theme);

  return (
    <ChartCard title="일별 기록 추이 (기록 수)" description="선택 기간의 날짜별 저장 기록 수" contentClassName="my-auto">
      {records.length ? (
        <div className="h-48 sm:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 18, right: 12, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: chart.tick, fontSize: 12 }} />
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
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0D66FF"
                strokeWidth={3}
                dot={{ r: 4.5, strokeWidth: 2, fill: theme === "dark" ? "#0B1220" : "#fff" }}
                activeDot={{ r: 6 }}
              >
                <LabelList
                  dataKey="count"
                  position="top"
                  fill={theme === "dark" ? "#DDE8FF" : "#24385E"}
                  fontSize={12}
                  fontWeight={900}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart message="선택한 기간에 기록이 없습니다." />
      )}
    </ChartCard>
  );
}

export default DailyTrendChart;
