import { useMemo } from "react";
import { getRecordsByDateRange } from "../lib/anger";
import { AngerEpisodeRecord, AppSettings, CauseOption, DateRange } from "../types";
import RecentRecordsTable from "./RecentRecordsTable";

type RecordsPageProps = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  settings: AppSettings;
  range: DateRange;
  onUpdateRecord: (record: AngerEpisodeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteRecords: (ids: string[]) => void;
};

function RecordsPage({
  records,
  causes,
  settings,
  range,
  onUpdateRecord,
  onDeleteRecord,
  onDeleteRecords,
}: RecordsPageProps) {
  const visibleRecords = useMemo(() => getRecordsByDateRange(records, range), [records, range]);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="선택 기간 기록" value={`${visibleRecords.length}개`} />
        <SummaryCard label="전체 저장 기록" value={`${records.length}개`} />
        <SummaryCard
          label="가장 최근 기록"
          value={records[0] ? new Date(records[0].startTime).toLocaleDateString("ko-KR") : "-"}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="card p-5">
      <p className="text-sm font-black text-[#52698c] dark:text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">{value}</p>
    </article>
  );
}

export default RecordsPage;
