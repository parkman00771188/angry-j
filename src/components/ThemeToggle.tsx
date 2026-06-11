import { Monitor, Moon, Sun } from "lucide-react";
import { ThemePreference } from "../types";

type ThemeToggleProps = {
  theme: ThemePreference;
  onThemeChange: (theme: ThemePreference) => void;
};

const options = [
  { value: "light" as const, label: "라이트", icon: Sun },
  { value: "dark" as const, label: "다크", icon: Moon },
  { value: "system" as const, label: "시스템", icon: Monitor },
];

function ThemeToggle({ theme, onThemeChange }: ThemeToggleProps) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-black text-slate-950 dark:text-white">테마 설정</h2>
        <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
          라이트, 다크, 시스템 설정을 선택할 수 있습니다.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        {options.map((option) => {
          const Icon = option.icon;
          const active = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onThemeChange(option.value)}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                active
                  ? "border-blue-500 bg-blue-50 text-blue-700 shadow-[0_12px_28px_rgba(37,99,235,0.12)] dark:bg-blue-500/10 dark:text-blue-300"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
              }`}
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl ${
                  active ? "bg-blue-600 text-white dark:bg-blue-500" : "bg-slate-100 dark:bg-white/[0.06]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="font-black">{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ThemeToggle;
