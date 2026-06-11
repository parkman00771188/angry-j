import { useMemo } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  getPreviousDateRange,
  getRecordsByDateRange,
} from "../lib/anger";
import { AngerEpisodeRecord, AppSettings, CauseOption, DateRange, ResolvedTheme } from "../types";
import CauseDonutChart from "./CauseDonutChart";
import DailyTrendChart from "./DailyTrendChart";
import EpisodeLengthChart from "./EpisodeLengthChart";
import HourlyFrequencyChart from "./HourlyFrequencyChart";
import RecordInputCard from "./RecordInputCard";
import RecentRecordsTable from "./RecentRecordsTable";
import StatCards from "./StatCards";
import WeekdayHeatmap from "./WeekdayHeatmap";

type DashboardPageProps = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  settings: AppSettings;
  range: DateRange;
  resolvedTheme: ResolvedTheme;
  onCreateRecord: (record: AngerEpisodeRecord) => void;
  onUpdateRecord: (record: AngerEpisodeRecord) => void;
  onDeleteRecord: (id: string) => void;
  onDeleteRecords: (ids: string[]) => void;
  mobileRecorderOpen: boolean;
  onMobileRecorderClose: () => void;
  onViewAllRecords: () => void;
};

function DashboardPage({
  records,
  causes,
  settings,
  range,
  resolvedTheme,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord,
  onDeleteRecords,
  mobileRecorderOpen,
  onMobileRecorderClose,
  onViewAllRecords,
}: DashboardPageProps) {
  const visibleRecords = useMemo(() => getRecordsByDateRange(records, range), [records, range]);
  const previousRecords = useMemo(
    () => getRecordsByDateRange(records, getPreviousDateRange(range)),
    [records, range],
  );

  return (
    <div className="min-w-0 space-y-4">
      <section className="grid min-w-0 items-start gap-4 2xl:grid-cols-[minmax(520px,0.56fr)_minmax(0,1.44fr)]">
        <div className="hidden md:block">
          <RecordInputCard causes={causes} settings={settings} onCreateRecord={onCreateRecord} />
        </div>
        <div className="min-w-0 space-y-4">
          <StatCards
            records={visibleRecords}
            previousRecords={previousRecords}
          />
          <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(360px,0.86fr)]">
            <DailyTrendChart records={visibleRecords} range={range} theme={resolvedTheme} />
            <HourlyFrequencyChart records={visibleRecords} theme={resolvedTheme} />
            <WeekdayHeatmap records={visibleRecords} theme={resolvedTheme} />
          </div>
        </div>
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(420px,0.76fr)_minmax(0,1.24fr)]">
        <CauseDonutChart records={visibleRecords} causes={causes} theme={resolvedTheme} />
        <EpisodeLengthChart
          records={visibleRecords}
          previousRecords={previousRecords}
          range={range}
          theme={resolvedTheme}
        />
      </section>

      <RecentRecordsTable
        records={visibleRecords}
        causes={causes}
        dateTimeFormat={settings.dateTimeFormat}
        onUpdateRecord={onUpdateRecord}
        onDeleteRecord={onDeleteRecord}
        onDeleteRecords={onDeleteRecords}
        maxRows={6}
        allowDelete={false}
        onViewAll={onViewAllRecords}
      />

      {mobileRecorderOpen ? (
        <MobileRecordInputModal
          causes={causes}
          settings={settings}
          onCreateRecord={(record) => {
            onCreateRecord(record);
            onMobileRecorderClose();
          }}
          onClose={onMobileRecorderClose}
        />
      ) : null}
    </div>
  );
}

function MobileRecordInputModal({
  causes,
  settings,
  onCreateRecord,
  onClose,
}: {
  causes: CauseOption[];
  settings: AppSettings;
  onCreateRecord: (record: AngerEpisodeRecord) => void;
  onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/45 px-3 py-5 backdrop-blur-sm md:hidden">
      <div className="flex min-h-full items-start justify-center" onClick={onClose}>
        <div className="relative w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
          <button
            type="button"
            onClick={onClose}
            aria-label="기록 입력 닫기"
            className="icon-button absolute right-3 top-3 z-10 h-9 w-9"
          >
            <X className="h-4 w-4" />
          </button>
          <RecordInputCard causes={causes} settings={settings} onCreateRecord={onCreateRecord} />
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default DashboardPage;
