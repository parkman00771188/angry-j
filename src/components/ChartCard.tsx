import { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-3 sm:mb-4">
        <h2 className="break-keep text-base font-black text-slate-950 dark:text-white sm:text-[17px]">{title}</h2>
        {description ? (
          <p className="mt-1 text-xs font-semibold text-[#6b7f9f] dark:text-slate-400">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-44 place-items-center rounded-2xl border border-dashed border-[#d7e3f3] bg-[#f8fbff] px-4 text-center text-sm font-bold text-slate-500 dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-slate-400 sm:h-56">
      {message}
    </div>
  );
}

export function getChartTheme(theme: "light" | "dark") {
  return {
    grid: theme === "dark" ? "rgba(148, 163, 184, 0.16)" : "#E6EEF8",
    tick: theme === "dark" ? "#94A3B8" : "#5F7394",
    tooltipBg: theme === "dark" ? "#0B1220" : "#FFFFFF",
    tooltipBorder: theme === "dark" ? "rgba(255,255,255,0.1)" : "#E2E8F0",
    tooltipText: theme === "dark" ? "#F8FAFC" : "#0F172A",
  };
}
