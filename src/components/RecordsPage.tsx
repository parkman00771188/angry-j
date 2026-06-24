import { useMemo } from "react";
import { getRecordsByDateRange, getRecordsByWeekday, WEEKDAY_LABELS } from "../lib/anger";
import { AngerEpisodeRecord, AppSettings, CauseOption, DateRange, RangeMode } from "../types";
import RecentRecordsTable from "./RecentRecordsTable";

type RecordsPageProps = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  settings: AppSettings;
  range: DateRange;
  rangeMode: RangeMode;
  selectedWeekday: number;
  onUpdateRecord: (record: AngerEpisodeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteRecords: (ids: string[]) => void;
};

function RecordsPage({
  records,
  causes,
  settings,
  range,
  rangeMode,
  selectedWeekday,
  onUpdateRecord,
  onDeleteRecord,
  onDeleteRecords,
}: RecordsPageProps) {
  const visibleRecords = useMemo(
    () => (rangeMode === "weekday" ? getRecordsByWeekday(records, selectedWeekday) : getRecordsByDateRange(records, range)),
    [records, range, rangeMode, selectedWeekday],
  );
  const filteredLabel = rangeMode === "weekday" ? `선택 요일(${WEEKDAY_LABELS[selectedWeekday]}) 기록` : "선택 기간 기록";

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <SummaryCard label={filteredLabel} value={`${visibleRecords.length}개`} />
        <SummaryCard label="전체 저장 기록" value={`${records.length}개`} />
        <SummaryCard
          label="가장 최근 기록"
          value={visibleRecords[0] ? new Date(visibleRecords[0].startTime).toLocaleDateString("ko-KR") : "-"}
          compactValue
        />
      </section>

      <RecentRecordsTable
        records={visibleRecords}
        causes={causes}
        dateTimeFormat={settings.dateTimeFormat}
        onUpdateRecord={onUpdateRecord}
        onDeleteRecord={onDeleteRecord}
        onDeleteRecords={onDeleteRecords}
      />
    </div>
  );
}

function SummaryCard({ label, value, compactValue = false }: { label: string; value: string; compactValue?: boolean }) {
  return (
    <article className="card flex min-h-[118px] min-w-0 flex-col justify-between p-3 sm:min-h-[132px] sm:p-4 lg:min-h-[150px] lg:p-5">
      <p className="break-keep text-xs font-black leading-5 text-[#52698c] dark:text-slate-400 sm:text-sm">{label}</p>
      <p
        className={`mt-2 break-words font-black tracking-tight text-slate-950 dark:text-white ${
          compactValue ? "text-[17px] leading-tight sm:text-2xl" : "text-[30px] leading-none sm:text-3xl"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

export default RecordsPage;
