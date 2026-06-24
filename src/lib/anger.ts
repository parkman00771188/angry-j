import {
  AngerEpisodeRecord,
  AppSettings,
  CauseOption,
  DateRange,
  RangeMode,
  ThemePreference,
} from "../types";

export const RECORDS_KEY = "anger-j-records";
export const CAUSES_KEY = "anger-j-causes";
export const THEME_KEY = "anger-j-theme";
export const SETTINGS_KEY = "anger-j-settings";

export const DEFAULT_CAUSES: CauseOption[] = [
  { id: "work", label: "업무", color: "#2563EB" },
  { id: "relationship", label: "대인관계", color: "#14B8A6" },
  { id: "family", label: "가족", color: "#F59E0B" },
  { id: "traffic", label: "교통", color: "#F97316" },
  { id: "health", label: "건강", color: "#8B5CF6" },
  { id: "etc", label: "기타", color: "#64748B" },
];

export const DEFAULT_SETTINGS: AppSettings = {
  resetMemoAfterSave: true,
  confirmBeforeSave: false,
  dateTimeFormat: "24h",
};

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
export const HEATMAP_DAYS = ["월", "화", "수", "목", "금", "토", "일"];
export const WEEKDAY_FILTER_OPTIONS = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
  { value: 6, label: "토" },
  { value: 0, label: "일" },
];
export const HOUR_RANGE_START = 8;
export const HOUR_RANGE_END = 20;
export const HOUR_BUCKETS = Array.from(
  { length: HOUR_RANGE_END - HOUR_RANGE_START + 1 },
  (_, index) => HOUR_RANGE_START + index,
);

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function monthInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export function dateTimeLocalValue(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${dateInputValue(date)}T${hour}:${minute}:${second}`;
}

export function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day} (${WEEKDAY_LABELS[date.getDay()]})`;
}

export function formatShortDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function formatShortDateWithWeekday(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);

  return `${date.getMonth() + 1}/${date.getDate()}(${WEEKDAY_LABELS[date.getDay()]})`;
}

export function isWeekendDate(value: string | Date) {
  const date =
    value instanceof Date
      ? value
      : /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00`)
        : new Date(value);
  const day = date.getDay();

  return day === 0 || day === 6;
}

export function formatTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${hour}:${minute}:${second}`;
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  }

  return `${seconds}초`;
}

export function formatClockDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds,
  ).padStart(2, "0")}`;
}

export function defaultDateRange(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 13);

  return {
    start: dateInputValue(start),
    end: dateInputValue(end),
  };
}

export function todayRange(): DateRange {
  const today = dateInputValue(new Date());
  return { start: today, end: today };
}

export function dayRangeFrom(value: string | Date): DateRange {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const day = dateInputValue(date);

  return { start: day, end: day };
}

export function weekRangeFrom(value: string | Date): DateRange {
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  const start = new Date(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: dateInputValue(start),
    end: dateInputValue(end),
  };
}

export function monthRangeFrom(value: string | Date): DateRange {
  const date = value instanceof Date ? value : new Date(`${value}-01T00:00:00`);
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start: dateInputValue(start),
    end: dateInputValue(end),
  };
}

export function rangeFromMode(mode: RangeMode, value: string | Date = new Date()): DateRange {
  if (mode === "day") {
    return dayRangeFrom(value);
  }

  if (mode === "week") {
    return weekRangeFrom(value);
  }

  if (mode === "month") {
    return monthRangeFrom(value);
  }

  return defaultDateRange();
}

export function getDateRangeLength(range: DateRange) {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

export function getPreviousDateRange(range: DateRange): DateRange {
  const days = getDateRangeLength(range);
  const currentStart = new Date(`${range.start}T00:00:00`);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);
  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - days + 1);

  return {
    start: dateInputValue(previousStart),
    end: dateInputValue(previousEnd),
  };
}

export function getDatesBetween(range: DateRange) {
  const dates: Date[] = [];
  const cursor = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

export function getTodayRecords(records: AngerEpisodeRecord[], baseDate = new Date()) {
  const today = dateInputValue(baseDate);
  return records.filter((record) => dateInputValue(new Date(record.startTime)) === today);
}

export function getRecordsByDateRange(records: AngerEpisodeRecord[], range: DateRange) {
  const start = new Date(`${range.start}T00:00:00`).getTime();
  const end = new Date(`${range.end}T23:59:59`).getTime();

  return records.filter((record) => {
    const time = new Date(record.startTime).getTime();
    return time >= start && time <= end;
  });
}

export function getRecordsByWeekday(records: AngerEpisodeRecord[], weekday: number) {
  return records.filter((record) => new Date(record.startTime).getDay() === weekday);
}

export function calculateTotalDuration(records: AngerEpisodeRecord[]) {
  return records.reduce((sum, record) => sum + record.durationSeconds, 0);
}

export function calculateAverageDuration(records: AngerEpisodeRecord[]) {
  if (!records.length) {
    return 0;
  }

  return Math.round(calculateTotalDuration(records) / records.length);
}

export function getWeekdayRecords(records: AngerEpisodeRecord[]) {
  return records.filter((record) => !isWeekendDate(record.startTime));
}

export function getMostFrequentHour(records: AngerEpisodeRecord[]) {
  if (!records.length) {
    return null;
  }

  const counts = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: 0,
  }));

  records.forEach((record) => {
    counts[new Date(record.startTime).getHours()].count += 1;
  });

  const top = counts.reduce((best, item) => (item.count > best.count ? item : best), counts[0]);
  return {
    ...top,
    label: `${top.hour}시`,
    percentage: Math.round((top.count / records.length) * 100),
  };
}

export function getMostFrequentWeekday(records: AngerEpisodeRecord[]) {
  if (!records.length) {
    return null;
  }

  const counts = WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label: `${label}요일`,
    count: 0,
  }));

  records.forEach((record) => {
    counts[new Date(record.startTime).getDay()].count += 1;
  });

  const top = counts.reduce((best, item) => (item.count > best.count ? item : best), counts[0]);
  return {
    ...top,
    percentage: Math.round((top.count / records.length) * 100),
  };
}

export function getRecordCauses(record: Pick<AngerEpisodeRecord, "cause" | "causes">) {
  const labels = Array.isArray(record.causes) && record.causes.length ? record.causes : [record.cause];
  return [...new Set(labels.map((label) => String(label ?? "").trim()).filter(Boolean))];
}

export function getTopCause(records: AngerEpisodeRecord[]) {
  if (!records.length) {
    return null;
  }

  const grouped = new Map<string, number>();
  let totalCauseSelections = 0;

  records.forEach((record) => {
    getRecordCauses(record).forEach((cause) => {
      grouped.set(cause, (grouped.get(cause) ?? 0) + 1);
      totalCauseSelections += 1;
    });
  });

  if (!grouped.size || totalCauseSelections === 0) {
    return null;
  }

  const [cause, count] = [...grouped.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    cause,
    count,
    percentage: Math.round((count / totalCauseSelections) * 100),
  };
}

export function getCauseColor(cause: string, causes: CauseOption[]) {
  return causes.find((item) => item.label === cause)?.color ?? "#64748B";
}

export function groupRecordsByDay(records: AngerEpisodeRecord[], range: DateRange) {
  const grouped = new Map<string, number>();
  records.forEach((record) => {
    const key = dateInputValue(new Date(record.startTime));
    grouped.set(key, (grouped.get(key) ?? 0) + 1);
  });

  return getDatesBetween(range).map((date) => {
    const key = dateInputValue(date);
    return {
      key,
      label: formatShortDate(date),
      count: grouped.get(key) ?? 0,
    };
  });
}

export function getHourBucket(hour: number) {
  if (hour < HOUR_RANGE_START || hour > HOUR_RANGE_END) {
    return null;
  }

  return hour;
}

export function groupRecordsByHour(records: AngerEpisodeRecord[]) {
  const grouped = new Map<number, number>();
  HOUR_BUCKETS.forEach((hour) => grouped.set(hour, 0));

  records.forEach((record) => {
    const bucket = getHourBucket(new Date(record.startTime).getHours());
    if (bucket === null) {
      return;
    }

    grouped.set(bucket, (grouped.get(bucket) ?? 0) + 1);
  });

  return HOUR_BUCKETS.map((hour) => ({
    hour,
    label: `${hour}시`,
    count: grouped.get(hour) ?? 0,
  }));
}

export function groupRecordsByWeekdayHour(records: AngerEpisodeRecord[]) {
  return HEATMAP_DAYS.map((dayLabel) =>
    HOUR_BUCKETS.map((hour) => {
      const count = records.filter((record) => {
        const date = new Date(record.startTime);
        const label = WEEKDAY_LABELS[date.getDay()];
        return label === dayLabel && getHourBucket(date.getHours()) === hour;
      }).length;

      return {
        day: dayLabel,
        hour,
        count,
      };
    }),
  );
}

export function groupRecordsByCause(records: AngerEpisodeRecord[], causes: CauseOption[]) {
  const grouped = new Map<string, number>();
  let totalCauseSelections = 0;

  records.forEach((record) => {
    getRecordCauses(record).forEach((cause) => {
      grouped.set(cause, (grouped.get(cause) ?? 0) + 1);
      totalCauseSelections += 1;
    });
  });

  const configured = new Set(causes.map((cause) => cause.label));
  const unknownCauses = [...grouped.keys()].filter((cause) => !configured.has(cause));
  const allCauses = [
    ...causes,
    ...unknownCauses.map((label) => ({ id: `unknown-${label}`, label, color: "#64748B" })),
  ];

  const items = allCauses
    .map((cause) => ({
      cause: cause.label,
      count: grouped.get(cause.label) ?? 0,
      color: cause.color,
      percentage: 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  return applyRoundedPercentages(items, totalCauseSelections);
}

function applyRoundedPercentages<T extends { count: number; percentage: number }>(items: T[], total: number) {
  if (!items.length || total <= 0) {
    return items;
  }

  const computed = items.map((item, index) => {
    const raw = (item.count / total) * 100;
    return {
      index,
      percentage: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    };
  });

  let remaining = 100 - computed.reduce((sum, item) => sum + item.percentage, 0);
  const byRemainder = [...computed].sort((a, b) => b.remainder - a.remainder || a.index - b.index);

  for (const item of byRemainder) {
    if (remaining <= 0) {
      break;
    }

    item.percentage += 1;
    remaining -= 1;
  }

  const percentagesByIndex = new Map(byRemainder.map((item) => [item.index, item.percentage]));
  return items.map((item, index) => ({
    ...item,
    percentage: percentagesByIndex.get(index) ?? 0,
  }));
}

export type AverageDurationBucketMode = "day" | "week" | "month";

type AverageDurationOptions = {
  excludeWeekends?: boolean;
};

type AverageDurationBucket = {
  key: string;
  label: string;
  start: Date;
  end: Date;
  records: AngerEpisodeRecord[];
};

export function groupAverageDuration(
  records: AngerEpisodeRecord[],
  range: DateRange,
  mode: AverageDurationBucketMode,
  options: AverageDurationOptions = {},
) {
  const buckets =
    mode === "day"
      ? getAverageDurationDayBuckets(range)
      : mode === "month"
        ? getAverageDurationMonthBuckets(range)
        : getAverageDurationWeekBuckets(range);
  const visibleBuckets = options.excludeWeekends && mode === "day"
    ? buckets.filter((bucket) => !isWeekendDate(bucket.start))
    : buckets;
  const scopedRecords = options.excludeWeekends ? getWeekdayRecords(records) : records;

  scopedRecords.forEach((record) => {
    const time = new Date(record.startTime).getTime();
    const bucket = visibleBuckets.find((item) => time >= item.start.getTime() && time <= item.end.getTime());
    if (bucket) {
      bucket.records.push(record);
    }
  });

  return visibleBuckets.map((bucket) => {
    const averageSeconds = calculateAverageDuration(bucket.records);

    return {
      key: bucket.key,
      label: bucket.label,
      averageSeconds,
      averageMinutes: Math.round(averageSeconds / 60),
      count: bucket.records.length,
    };
  });
}

function getAverageDurationDayBuckets(range: DateRange): AverageDurationBucket[] {
  return getDatesBetween(range).map((date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return {
      key: dateInputValue(date),
      label: formatShortDate(date),
      start,
      end,
      records: [],
    };
  });
}

function getAverageDurationWeekBuckets(range: DateRange): AverageDurationBucket[] {
  const weeks: AverageDurationBucket[] = [];

  const cursor = new Date(`${range.start}T00:00:00`);
  const last = new Date(`${range.end}T23:59:59`);

  while (cursor <= last) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    if (end > last) {
      end.setTime(last.getTime());
    }

    weeks.push({
      key: `${dateInputValue(start)}-${dateInputValue(end)}`,
      label: `${formatShortDate(start)}~${formatShortDate(end)}`,
      start,
      end,
      records: [],
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

function getAverageDurationMonthBuckets(range: DateRange): AverageDurationBucket[] {
  const months: AverageDurationBucket[] = [];

  const rangeStart = new Date(`${range.start}T00:00:00`);
  const rangeEnd = new Date(`${range.end}T23:59:59`);
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);

  while (cursor <= rangeEnd) {
    const start = new Date(Math.max(cursor.getTime(), rangeStart.getTime()));
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    const end = new Date(Math.min(monthEnd.getTime(), rangeEnd.getTime()));

    months.push({
      key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      label: `${cursor.getFullYear()}.${cursor.getMonth() + 1}`,
      start,
      end,
      records: [],
    });

    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months;
}

export function groupAverageDurationByWeek(records: AngerEpisodeRecord[], range: DateRange) {
  const weeks: Array<{
    key: string;
    label: string;
    start: Date;
    end: Date;
    records: AngerEpisodeRecord[];
  }> = [];

  const cursor = new Date(`${range.start}T00:00:00`);
  const last = new Date(`${range.end}T23:59:59`);

  while (cursor <= last) {
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    if (end > last) {
      end.setTime(last.getTime());
    }

    weeks.push({
      key: `${dateInputValue(start)}-${dateInputValue(end)}`,
      label: `${formatShortDate(start)}~${formatShortDate(end)}`,
      start,
      end,
      records: [],
    });

    cursor.setDate(cursor.getDate() + 7);
  }

  records.forEach((record) => {
    const time = new Date(record.startTime).getTime();
    const bucket = weeks.find((week) => time >= week.start.getTime() && time <= week.end.getTime());
    if (bucket) {
      bucket.records.push(record);
    }
  });

  return weeks.map((week) => ({
    key: week.key,
    label: week.label,
    averageSeconds: calculateAverageDuration(week.records),
    averageMinutes: Math.round(calculateAverageDuration(week.records) / 60),
    count: week.records.length,
  }));
}

export function generateSampleRecords(causes = DEFAULT_CAUSES, baseDate = new Date()) {
  const causeLabels = causes.map((cause) => cause.label);
  const fallbackCause = causeLabels[0] ?? "업무";
  const pickCause = (label: string) => (causeLabels.includes(label) ? label : fallbackCause);

  const samples = [
    [0, 15, 12, 29, "업무", "팀장 미팅 시간 변경으로 스트레스가 쌓여 목소리에 힘이 들어감"],
    [0, 11, 3, 22, "대인관계", "상대방의 무례한 말에 순간적으로 기분이 상함"],
    [1, 18, 32, 33, "업무", "회의에서 내 의견이 무시되어 화가 남"],
    [1, 8, 47, 18, "교통", "출근길 교통 체증으로 지각할까봐 짜증남"],
    [2, 21, 14, 22, "가족", "가족과의 대화 중 의견 충돌로 감정이 격해짐"],
    [3, 13, 20, 27, "업무", "업무 마감 시간 압박으로 스트레스가 쌓임"],
    [3, 16, 50, 31, "건강", "컨디션이 좋지 않아 작은 일에도 예민해짐"],
    [4, 9, 10, 24, "교통", "이동 시간이 길어져 계획이 틀어짐"],
    [4, 15, 35, 35, "업무", "갑작스러운 추가 요청으로 집중이 흐트러짐"],
    [5, 10, 45, 19, "기타", "작은 실수가 반복되어 스스로에게 답답함을 느낌"],
    [5, 19, 8, 29, "대인관계", "메시지 답변이 차갑게 느껴져 감정이 올라옴"],
    [6, 14, 55, 30, "업무", "일정 조율이 길어져 피로감이 커짐"],
    [7, 8, 35, 20, "건강", "수면 부족으로 하루 종일 예민했음"],
    [7, 15, 18, 34, "업무", "마감 전 확인할 일이 늘어나 압박감이 커짐"],
    [8, 12, 10, 26, "가족", "집안일 분담 이야기를 하다 의견이 엇갈림"],
    [8, 18, 28, 28, "교통", "퇴근길 정체가 길어져 약속 시간에 늦을까 걱정됨"],
    [9, 9, 25, 16, "기타", "예상보다 일이 늦게 풀려 답답함을 느낌"],
    [9, 15, 45, 32, "대인관계", "피드백을 받는 과정에서 말투가 신경 쓰임"],
    [10, 11, 30, 27, "업무", "자료 수정 요청이 반복되어 지침"],
    [10, 20, 5, 25, "건강", "두통 때문에 집중이 떨어지고 예민해짐"],
    [11, 7, 50, 18, "교통", "버스 환승이 꼬여 출근 시간이 길어짐"],
    [11, 16, 22, 30, "업무", "공유가 늦어져 일정이 밀림"],
    [12, 13, 15, 23, "대인관계", "같은 내용을 반복 설명하며 답답함을 느낌"],
    [12, 18, 40, 36, "가족", "서로 기대한 역할이 달라 대화가 길어짐"],
    [13, 10, 5, 21, "기타", "계획이 예상대로 진행되지 않아 짜증이 남"],
    [13, 15, 30, 29, "업무", "마감 직전 긴장감이 높아짐"],
  ] as const;

  return samples.map(([dayOffset, hour, minute, durationMinutes, cause, memo], index) => {
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() - dayOffset);
    start.setHours(hour, minute, 0, 0);

    if (start.getTime() > baseDate.getTime()) {
      start.setDate(start.getDate() - 1);
    }

    const end = new Date(start);
    const extraSeconds = (index % 5) * 11;
    end.setSeconds(end.getSeconds() + durationMinutes * 60 + extraSeconds);
    const now = new Date(end);

    return {
      id: `sample-${start.getTime()}-${index}`,
      cause: pickCause(cause),
      causes: [pickCause(cause)],
      memo,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationSeconds: Math.round((end.getTime() - start.getTime()) / 1000),
      status: "saved" as const,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

export function getStoredTheme(raw: string | null): ThemePreference {
  return raw === "light" || raw === "dark" || raw === "system" ? raw : "system";
}
