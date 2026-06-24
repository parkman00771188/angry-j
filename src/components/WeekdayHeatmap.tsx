import { useRef, useState } from "react";
import type { MouseEvent } from "react";
import { groupRecordsByWeekdayHour, HEATMAP_DAYS, HOUR_BUCKETS } from "../lib/anger";
import { AngerEpisodeRecord, ResolvedTheme } from "../types";
import { ChartCard, EmptyChart } from "./ChartCard";

type WeekdayHeatmapProps = {
  records: AngerEpisodeRecord[];
  theme: ResolvedTheme;
};

type HeatmapTooltip = {
  x: number;
  y: number;
  day: string;
  hour: number;
  count: number;
};

function WeekdayHeatmap({ records, theme }: WeekdayHeatmapProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<HeatmapTooltip | null>(null);
  const matrix = groupRecordsByWeekdayHour(records);
  const max = Math.max(1, ...matrix.flat().map((cell) => cell.count));

  const showTooltip = (
    event: MouseEvent<HTMLDivElement>,
    day: string,
    cell: { hour: number; count: number },
  ) => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const rootRect = root.getBoundingClientRect();
    const cellRect = event.currentTarget.getBoundingClientRect();
    const halfTooltipWidth = 74;

    setTooltip({
      x: Math.min(
        Math.max(cellRect.left - rootRect.left + cellRect.width / 2, halfTooltipWidth),
        rootRect.width - halfTooltipWidth,
      ),
      y: Math.max(cellRect.top - rootRect.top - 10, 8),
      day,
      hour: cell.hour,
      count: cell.count,
    });
  };

  return (
    <ChartCard
      title="요일 · 시간대 히트맵 (기록 수)"
      description="오전 8시부터 오후 8시까지의 기록 분포입니다."
      contentClassName="my-auto"
    >
      {records.length ? (
        <div ref={rootRef} className="relative">
          <div
            className="subtle-x-scrollbar overflow-x-auto pb-2"
            onMouseLeave={() => setTooltip(null)}
            onScroll={() => setTooltip(null)}
          >
            <div
              className="mx-auto grid w-full min-w-[500px] max-w-[560px] items-center gap-1.5 sm:min-w-[560px]"
              style={{ gridTemplateColumns: `22px repeat(${HOUR_BUCKETS.length}, minmax(22px, 1fr))` }}
            >
              <div />
              {HOUR_BUCKETS.map((hour) => (
                <div key={hour} className="text-center text-[11px] font-bold text-slate-400">
                  {hour}시
                </div>
              ))}

              {HEATMAP_DAYS.map((day, rowIndex) => (
                <div key={day} className="contents">
                  <div className="text-xs font-black text-slate-500 dark:text-slate-400">{day}</div>
                  {matrix[rowIndex].map((cell) => (
                    <div
                      key={`${day}-${cell.hour}`}
                      aria-label={`${day} ${cell.hour}시: ${cell.count}회`}
                      className="h-6 rounded-md border border-white/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)] dark:border-[#0b1220] sm:h-7"
                      style={{ backgroundColor: getHeatColor(cell.count, max, theme) }}
                      onMouseEnter={(event) => showTooltip(event, day, cell)}
                      onMouseMove={(event) => showTooltip(event, day, cell)}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span>적음</span>
              <div className="h-2 w-32 rounded-full bg-gradient-to-r from-blue-100 to-blue-600 dark:from-blue-950 dark:to-blue-400" />
              <span>많음</span>
            </div>
          </div>

          {tooltip ? (
            <div
              className="pointer-events-none absolute z-30 min-w-[132px] rounded-[14px] border border-[#e2e8f0] bg-white px-3.5 py-3 text-sm text-slate-950 shadow-[0_14px_34px_rgba(15,23,42,0.16)] dark:border-white/[0.1] dark:bg-[#0b1220] dark:text-slate-50"
              style={{
                left: tooltip.x,
                top: tooltip.y,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="font-black">{tooltip.day} {tooltip.hour}시</div>
              <div className="mt-1 whitespace-nowrap font-black text-[#0d66ff] dark:text-blue-300">
                기록 수 : {tooltip.count}회
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyChart message="히트맵을 만들 기록이 없습니다." />
      )}
    </ChartCard>
  );
}

function getHeatColor(count: number, max: number, theme: ResolvedTheme) {
  if (count === 0) {
    return theme === "dark" ? "rgba(30, 41, 59, 0.58)" : "#EAF2FF";
  }

  const intensity = Math.min(1, count / max);
  const alpha = 0.24 + intensity * 0.72;
  return theme === "dark" ? `rgba(59, 130, 246, ${alpha})` : `rgba(13, 102, 255, ${alpha})`;
}

export default WeekdayHeatmap;
