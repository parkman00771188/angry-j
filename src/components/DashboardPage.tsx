import { useMemo } from "react";
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
  onViewAllRecords,
}: DashboardPageProps) {
  const visibleRecords = useMemo(() => getRecordsByDateRange(records, range), [records, range]);
  const previousRecords = useMemo(
    () => getRecordsByDateRange(records, getPreviousDateRange(range)),
    [records, range],
  );

  return (
    <div className="space-y-4">
      <section className="grid items-start gap-4 2xl:grid-cols-[minmax(520px,0.56fr)_minmax(0,1.44fr)]">
        <RecordInputCard causes={causes} settings={settings} onCreateRecord={onCreateRecord} />
        <div className="space-y-4">
          <StatCards
            records={visibleRecords}
            previousRecords={previousRecords}
          />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(360px,0.86fr)]">
            <DailyTrendChart records={visibleRecords} range={range} theme={resolvedTheme} />
            <HourlyFrequencyChart records={visibleRecords} theme={resolvedTheme} />
            <WeekdayHeatmap records={visibleRecords} theme={resolvedTheme} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(420px,0.76fr)_minmax(0,1.24fr)]">
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
    </div>
  );
}

export default DashboardPage;
