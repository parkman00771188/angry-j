import { ClipboardList, Home, Settings } from "lucide-react";
import angryCharacter from "../assets/angry-character.png";
import { AppView } from "../types";

type SidebarProps = {
  view: AppView;
  onViewChange: (view: AppView) => void;
};

const menu = [
  { key: "dashboard" as const, label: "대시보드", icon: Home },
  { key: "records" as const, label: "최근 기록", icon: ClipboardList },
  { key: "settings" as const, label: "설정", icon: Settings },
];

function Sidebar({ view, onViewChange }: SidebarProps) {
  return (
    <>
      <div className="sticky top-0 z-40 w-screen max-w-full overflow-hidden border-b border-blue-500/20 bg-blue-700 px-3 py-3 text-white shadow-lg dark:border-white/[0.08] dark:bg-[#071426] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src={angryCharacter} alt="" className="h-11 w-11 shrink-0 rounded-2xl object-cover object-top" />
            <div>
              <p className="text-sm font-black tracking-tight sm:text-base">앵그리 J</p>
              <p className="text-xs font-semibold text-blue-100">마음케어</p>
            </div>
          </div>
          <div className="mr-8 flex shrink-0 rounded-2xl bg-white/12 p-1 sm:mr-0">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = item.key === view;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-label={item.label}
                  onClick={() => onViewChange(item.key)}
                  className={`grid h-9 w-9 place-items-center rounded-xl transition sm:h-10 sm:w-10 ${
                    active
                      ? "bg-white text-blue-700 shadow-sm dark:bg-blue-500 dark:text-white"
                      : "text-blue-100 hover:bg-white/10 dark:text-slate-300 dark:hover:bg-white/[0.07]"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <aside className="hidden w-[284px] shrink-0 overflow-hidden rounded-r-[34px] bg-gradient-to-b from-[#0867ff] via-[#075ce3] to-[#0245c7] p-5 text-white shadow-[18px_0_45px_rgba(37,99,235,0.22)] transition-colors duration-300 dark:from-[#071426] dark:via-[#08111f] dark:to-[#050814] dark:shadow-[18px_0_45px_rgba(0,0,0,0.38)] dark:ring-1 dark:ring-white/[0.08] lg:flex lg:min-h-screen lg:flex-col">
        <div className="relative mb-8 overflow-hidden rounded-[28px] px-3 pb-7 pt-5">
          <div className="absolute inset-0 rounded-[28px] bg-white/[0.05] dark:bg-white/[0.035]" />
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-300/20 blur-2xl dark:bg-blue-500/12" />
          <div className="relative">
            <div className="mx-auto h-36 w-36 overflow-visible">
              <img
                src={angryCharacter}
                alt="앵그리 J 캐릭터"
                className="h-40 w-40 -translate-x-2 object-contain drop-shadow-[0_18px_22px_rgba(0,36,120,0.34)]"
              />
            </div>
            <div className="mt-2 text-center">
              <p className="text-[38px] font-black leading-none tracking-tight text-white drop-shadow-[0_4px_12px_rgba(0,43,130,0.35)]">
                앵그리 J
              </p>
              <p className="mt-3 text-xl font-bold text-blue-100 dark:text-slate-300">마음케어</p>
            </div>
          </div>
        </div>

        <nav className="space-y-3">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = item.key === view;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onViewChange(item.key)}
                className={`flex w-full items-center gap-4 rounded-2xl px-6 py-4 text-lg font-black transition ${
                  active
                    ? "bg-white/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.13),0_16px_26px_rgba(0,37,112,0.18)] dark:bg-blue-500/18 dark:text-blue-100 dark:shadow-[inset_0_0_0_1px_rgba(96,165,250,0.22),0_16px_26px_rgba(0,0,0,0.22)]"
                    : "text-blue-100 hover:bg-white/10 hover:text-white dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-6 w-6" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto h-8" />
      </aside>
    </>
  );
}

export default Sidebar;
