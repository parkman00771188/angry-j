import { useEffect, useMemo, useState } from "react";
import { Check, Info, Pause, Play, Square } from "lucide-react";
import {
  createId,
  formatClockDuration,
  formatTime,
} from "../lib/anger";
import { AngerEpisodeRecord, AppSettings, CauseOption, RecorderStatus } from "../types";

type RecordInputCardProps = {
  causes: CauseOption[];
  settings: AppSettings;
  onCreateRecord: (record: AngerEpisodeRecord) => void;
};

const statusMeta: Record<RecorderStatus, { label: string; dot: string; text: string }> = {
  idle: { label: "대기 중", dot: "bg-blue-500", text: "text-blue-600 dark:text-blue-300" },
  recording: { label: "기록 중", dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-300" },
  paused: { label: "일시정지", dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-300" },
};

function RecordInputCard({ causes, settings, onCreateRecord }: RecordInputCardProps) {
  const defaultCause = causes[0]?.label ?? "기타";
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [selectedCauses, setSelectedCauses] = useState<string[]>([defaultCause]);
  const [memo, setMemo] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [accumulatedSeconds, setAccumulatedSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const availableLabels = new Set(causes.map((item) => item.label));
    const nextSelected = selectedCauses.filter((cause) => availableLabels.has(cause));

    if (!nextSelected.length) {
      setSelectedCauses([defaultCause]);
      return;
    }

    if (nextSelected.length !== selectedCauses.length) {
      setSelectedCauses(nextSelected);
    }
  }, [causes, defaultCause, selectedCauses]);

  useEffect(() => {
    if (status !== "recording" || runStartedAt === null) {
      setElapsedSeconds(accumulatedSeconds);
      return;
    }

    const update = () => {
      setElapsedSeconds(accumulatedSeconds + Math.floor((Date.now() - runStartedAt) / 1000));
    };

    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [accumulatedSeconds, runStartedAt, status]);

  const meta = statusMeta[status];
  const memoLength = memo.length;
  const started = status !== "idle";

  const displayStartTime = useMemo(() => (startTime ? formatTime(startTime) : "--:--:--"), [startTime]);
  const displayEndTime = useMemo(() => (endTime ? formatTime(endTime) : "--:--:--"), [endTime]);

  const handleStart = () => {
    if (status === "recording") {
      return;
    }

    if (status === "idle") {
      const now = new Date();
      setStartTime(now);
      setEndTime(null);
      setAccumulatedSeconds(0);
      setElapsedSeconds(0);
    }

    setRunStartedAt(Date.now());
    setStatus("recording");
  };

  const handlePause = () => {
    if (status !== "recording" || runStartedAt === null) {
      return;
    }

    const nextElapsed = accumulatedSeconds + Math.floor((Date.now() - runStartedAt) / 1000);
    setAccumulatedSeconds(nextElapsed);
    setElapsedSeconds(nextElapsed);
    setRunStartedAt(null);
    setStatus("paused");
  };

  const handleStop = () => {
    if (!startTime || status === "idle") {
      return;
    }

    if (settings.confirmBeforeSave && !window.confirm("기록을 종료하고 저장할까요?")) {
      return;
    }

    const now = new Date();
    const finalDuration =
      status === "recording" && runStartedAt !== null
        ? accumulatedSeconds + Math.floor((Date.now() - runStartedAt) / 1000)
        : accumulatedSeconds;
    const durationSeconds = Math.max(1, finalDuration);
    const savedCauses = selectedCauses.length ? selectedCauses : [defaultCause || "기타"];

    const record: AngerEpisodeRecord = {
      id: createId("episode"),
      cause: savedCauses[0],
      causes: savedCauses,
      memo: memo.trim() || undefined,
      startTime: startTime.toISOString(),
      endTime: now.toISOString(),
      durationSeconds,
      status: "saved",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    onCreateRecord(record);
    setStatus("idle");
    setStartTime(null);
    setEndTime(null);
    setRunStartedAt(null);
    setAccumulatedSeconds(0);
    setElapsedSeconds(0);
    if (settings.resetMemoAfterSave) {
      setMemo("");
    }
  };

  const toggleCause = (label: string) => {
    setSelectedCauses((current) => {
      if (current.includes(label)) {
        return current.length > 1 ? current.filter((cause) => cause !== label) : current;
      }

      return [...current, label];
    });
  };

  return (
    <section className="card p-4 sm:p-5 xl:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[22px] font-black tracking-tight text-slate-950 dark:text-white">기록 입력</h2>
          <div className="mt-3 flex min-h-11 w-full min-w-0 flex-wrap items-center gap-2 rounded-xl bg-[#f3f7ff] px-3 py-2 dark:bg-white/[0.05] sm:mt-4 sm:px-4">
            <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
            <span className={`text-sm font-black ${meta.text}`}>{meta.label}</span>
            <span className="min-w-0 flex-1 break-words text-xs font-semibold leading-5 text-slate-500 dark:text-slate-400">
              {status === "idle" ? "아래에서 시작 버튼을 눌러 기록을 시작하세요." : formatClockDuration(elapsedSeconds)}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-base font-black text-slate-800 dark:text-slate-100">원인 선택</p>
            <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
              여러 원인을 함께 선택할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {causes.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={selectedCauses.includes(item.label)}
              onClick={() => toggleCause(item.label)}
              className={`inline-flex min-w-[62px] items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-[13px] font-black transition ${
                selectedCauses.includes(item.label)
                  ? "border-blue-500 bg-[#0d66ff] text-white shadow-[0_10px_24px_rgba(37,99,235,0.25)]"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              }`}
            >
              {selectedCauses.includes(item.label) ? <Check className="h-3.5 w-3.5" /> : null}
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <label className="text-base font-black text-slate-800 dark:text-slate-100" htmlFor="episode-memo">
          메모 <span className="text-xs font-semibold text-slate-400">(선택)</span>
        </label>
        <div className="relative mt-2">
          <textarea
            id="episode-memo"
            maxLength={300}
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="기록 상황에 대한 메모를 입력하세요..."
            rows={3}
            className="soft-input min-h-[88px] w-full resize-none pb-8"
          />
          <span className="absolute bottom-3 right-3 text-xs font-bold text-slate-400">
            {memoLength} / 300
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={status === "recording"}
          className="primary-button"
        >
          <Play className="h-4 w-4 fill-current" />
          {status === "paused" ? "재개" : "시작"}
        </button>
        <button
          type="button"
          onClick={handlePause}
          disabled={status !== "recording"}
          className="secondary-button"
        >
          <Pause className="h-4 w-4 fill-current" />
          일시정지
        </button>
        <button type="button" onClick={handleStop} disabled={!started} className="danger-button">
          <Square className="h-4 w-4 fill-current" />
          종료
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 overflow-hidden rounded-2xl border border-[#d8e5f5] bg-[#f8fbff] text-center dark:border-white/[0.08] dark:bg-white/[0.03]">
        <TimeCell label="시작 시간" value={displayStartTime} />
        <TimeCell label="종료 시간" value={displayEndTime} />
        <TimeCell label="경과 시간" value={formatClockDuration(elapsedSeconds)} />
      </div>

      <p className="mt-3 flex min-w-0 items-start gap-2 break-words text-xs font-semibold leading-5 text-blue-600 dark:text-blue-300">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        종료 버튼을 누르면 자동 저장되며, 최근 기록에서 수정할 수 있습니다.
      </p>
    </section>
  );
}

function TimeCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r border-slate-200 px-2 py-2.5 last:border-r-0 dark:border-white/[0.08] sm:px-3 sm:py-3">
      <p className="truncate text-[11px] font-bold text-slate-500 dark:text-slate-400 sm:text-xs">{label}</p>
      <p className="mt-1 truncate font-mono text-[12px] font-black text-slate-950 dark:text-white sm:text-[15px]">{value}</p>
    </div>
  );
}

export default RecordInputCard;
