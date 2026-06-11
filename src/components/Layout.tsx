import { ReactNode } from "react";
import { AppView, DateRange, RangeMode, ResolvedTheme } from "../types";
import Header from "./Header";
import Sidebar from "./Sidebar";

type LayoutProps = {
  children: ReactNode;
  view: AppView;
  range: DateRange;
  rangeMode: RangeMode;
  resolvedTheme: ResolvedTheme;
  onViewChange: (view: AppView) => void;
  onRangeChange: (range: DateRange, anchorValue?: string | Date) => void;
  onRangeModeChange: (mode: RangeMode) => void;
  onThemeToggle: () => void;
  onMobileRecordInputOpen?: () => void;
};

function Layout({
  children,
  view,
  range,
  rangeMode,
  resolvedTheme,
  onViewChange,
  onRangeChange,
  onRangeModeChange,
  onThemeToggle,
  onMobileRecordInputOpen,
}: LayoutProps) {
  return (
    <div className="min-h-screen lg:flex">
      <Sidebar view={view} onViewChange={onViewChange} />
      <main className="min-w-0 flex-1 overflow-hidden px-3 py-4 sm:px-6 sm:py-5 lg:px-7 xl:px-8">
        <Header
          view={view}
          range={range}
          rangeMode={rangeMode}
          resolvedTheme={resolvedTheme}
          onRangeChange={onRangeChange}
          onRangeModeChange={onRangeModeChange}
          onThemeToggle={onThemeToggle}
          onMobileRecordInputOpen={onMobileRecordInputOpen}
        />
        {children}
      </main>
    </div>
  );
}

export default Layout;
