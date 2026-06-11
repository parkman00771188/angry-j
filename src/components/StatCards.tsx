import { Activity, Clock3, PenLine, Tag, TimerReset } from "lucide-react";
import {
  calculateAverageDuration,
  calculateTotalDuration,
  formatDuration,
  getMostFrequentHour,
  getTopCause,
} from "../lib/anger";
import { AngerEpisodeRecord } from "../types";

type StatCardsProps = {
  records: AngerEpisodeRecord[];
  previousRecords: AngerEpisodeRecord[];
};

function StatCards({ records, previousRecords }: StatCardsProps) {
  const mostHour = getMostFrequentHour(records);
  const topCause = getTopCause(records);
  const totalDuration = calculateTotalDuration(records);
  const previousTotalDuration = calculateTotalDuration(previousRecords);
  const averageDuration = calculateAverageDuration(records);
  const previousAverageDuration = calculateAverageDuration(previousRecords);

  const cards = [
    {
      title: "선택 기간 기록 수",
      value: `${records.length}회`,
      delta: formatNumberDelta(records.length - previousRecords.length, "회"),
      icon: PenLine,
      tone: "blue",
    },
    {
      title: "선택 기간 총 기록 시간",
      value: formatDuration(totalDuration),
      delta: formatDurationDelta(totalDuration - previousTotalDuration),
      icon: Clock3,
      tone: "green",
    },
    {
      title: "가장 많이 기록된 시간대",
      value: mostHour ? mostHour.label : "-",
      delta: mostHour ? `${mostHour.count}회 (${mostHour.percentage}%)` : "기록 없음",
      icon: TimerReset,
      tone: "purple",
    },
    {
      title: "주요 원인",
      value: topCause ? topCause.cause : "-",
      delta: topCause ? `${topCause.count}회 (${topCause.percentage}%)` : "기록 없음",
      icon: Tag,
      tone: "orange",
    },
    {
      title: "평균 에피소드 길이",
      value: formatDuration(averageDuration),
      delta: formatDurationDelta(averageDuration - previousAverageDuration),
      icon: Activity,
      tone: "blue",
    },
  ];

  return (
    <section className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <article key={card.title} className="card min-h-[156px] p-5">
            <div
              className={`mb-4 grid h-[52px] w-[52px] place-items-center rounded-[18px] ${toneClasses[card.tone]}`}
            >
              <Icon className="h-7 w-7" />
            </div>
            <p className="min-h-10 text-sm font-black leading-5 text-[#24385e] dark:text-slate-300">{card.title}</p>
            <p className="mt-2 text-[27px] font-black tracking-tight text-slate-950 dark:text-white">
              {card.value}
            </p>
            <p
              className={`mt-2 text-xs font-black ${
                card.delta.startsWith("↑")
                  ? "text-red-500"
                  : card.delta.startsWith("↓")
                    ? "text-blue-600 dark:text-blue-300"
                    : "text-slate-500 dark:text-slate-400"
              }`}
            >
              {card.delta}
            </p>
          </article>
        );
      })}
    </section>
  );
}

const toneClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
  purple: "bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-300",
};

function formatNumberDelta(value: number, unit: string) {
  if (value > 0) {
    return `이전 기간보다 ↑ ${value}${unit}`;
  }

  if (value < 0) {
    return `이전 기간보다 ↓ ${Math.abs(value)}${unit}`;
  }

  return "이전 기간과 동일";
}

function formatDurationDelta(value: number) {
  if (value > 0) {
    return `↑ ${formatDuration(value)}`;
  }

  if (value < 0) {
    return `↓ ${formatDuration(Math.abs(value))}`;
  }

  return "변화 없음";
}

export default StatCards;
