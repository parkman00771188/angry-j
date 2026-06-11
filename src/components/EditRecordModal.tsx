import { useState } from "react";
import { createPortal } from "react-dom";
import { Check, Trash2, X } from "lucide-react";
import { dateInputValue, formatDuration, getCauseColor, getRecordCauses } from "../lib/anger";
import { AngerEpisodeRecord, CauseOption } from "../types";

type DateTimeParts = {
  date: string;
  hour: string;
  minute: string;
  second: string;
};

type EditRecordModalProps = {
  record: AngerEpisodeRecord;
  causes: CauseOption[];
  onClose: () => void;
  onUpdate: (record: AngerEpisodeRecord) => void;
  onDelete?: (id: string) => void;
  allowDelete?: boolean;
};

const hourOptions = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, "0"));
const minuteSecondOptions = Array.from({ length: 60 }, (_, value) => String(value).padStart(2, "0"));

function EditRecordModal({ record, causes, onClose, onUpdate, onDelete, allowDelete = true }: EditRecordModalProps) {
  const [selectedCauses, setSelectedCauses] = useState(() => getRecordCauses(record));
  const [memo, setMemo] = useState(record.memo ?? "");
  const [startTime, setStartTimeState] = useState(() => toDateTimeParts(record.startTime));
  const [endTime, setEndTime] = useState(() => toDateTimeParts(record.endTime));
  const [error, setError] = useState("");

  const startDate = toDate(startTime);
  const endDate = toDate(endTime);
  const durationSeconds =
    Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())
      ? 0
      : Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000));

  const setStartTime = (nextTime: DateTimeParts) => {
    const dayDelta = getDayDelta(startTime.date, nextTime.date);

    setStartTimeState(nextTime);

    if (dayDelta !== 0) {
      setEndTime((current) => ({
        ...current,
        date: shiftDateValue(current.date, dayDelta),
      }));
    }
  };

  const handleSave = () => {
    const start = toDate(startTime);
    const end = toDate(endTime);
    const savedCauses = selectedCauses.length ? selectedCauses : [causes[0]?.label ?? "기타"];

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("시작 시간과 종료 시간을 다시 확인해주세요.");
      return;
    }

    if (end <= start) {
      setError("종료 시간은 시작 시간보다 늦어야 합니다.");
      return;
    }

    onUpdate({
      ...record,
      cause: savedCauses[0],
      causes: savedCauses,
      memo: memo.trim() || undefined,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationSeconds: Math.round((end.getTime() - start.getTime()) / 1000),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDelete = () => {
    if (onDelete && window.confirm("이 기록을 삭제할까요? 삭제한 기록은 되돌릴 수 없습니다.")) {
      onDelete(record.id);
    }
  };

  const causeOptions = [
    ...causes,
    ...selectedCauses
      .filter((cause) => !causes.some((item) => item.label === cause))
      .map((label) => ({ id: `unknown-${label}`, label, color: "#64748B" })),
  ];

  const toggleCause = (label: string) => {
    setSelectedCauses((current) => {
      if (current.includes(label)) {
        return current.length > 1 ? current.filter((cause) => cause !== label) : current;
      }

      return [...current, label];
    });
  };

  const modal = (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div className="flex min-h-full items-start justify-center sm:items-center">
        <section className="card max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto p-5 sm:max-h-[calc(100vh-5rem)]">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">기록 수정</h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              원인, 메모, 시작/종료 시간을 수정할 수 있습니다.
            </p>
          </div>
          <button type="button" onClick={onClose} className="icon-button">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="block">
            <p className="text-sm font-black text-slate-700 dark:text-slate-200">원인</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {causeOptions.map((item) => {
                const selected = selectedCauses.includes(item.label);
                const color = getCauseColor(item.label, causes);

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleCause(item.label)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black transition ${
                      selected
                        ? "text-white shadow-[0_10px_24px_rgba(37,99,235,0.18)]"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-slate-300 dark:hover:bg-white/[0.08]"
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: color,
                            backgroundColor: color,
                          }
                        : undefined
                    }
                  >
                    {selected ? <Check className="h-3.5 w-3.5" /> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 dark:border-blue-400/15 dark:bg-blue-500/10">
            <p className="text-xs font-black text-slate-500 dark:text-slate-400">수정 후 지속 시간</p>
            <p className="mt-2 text-xl font-black text-slate-950 dark:text-white">{formatDuration(durationSeconds)}</p>
          </div>

          <DateTimeField label="시작 시간" value={startTime} onChange={setStartTime} />

          <DateTimeField label="종료 시간" value={endTime} onChange={setEndTime} />

          <label className="block md:col-span-2">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">메모</span>
            <textarea
              maxLength={300}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
              rows={4}
              className="soft-input mt-2 w-full resize-none"
            />
          </label>
        </div>

        {error ? <p className="mt-4 text-sm font-bold text-red-500">{error}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          {allowDelete && onDelete ? (
          <button type="button" onClick={handleDelete} className="danger-button">
            <Trash2 className="h-4 w-4" />
            삭제
          </button>
          ) : (
            <span />
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="secondary-button px-5">
              취소
            </button>
            <button type="button" onClick={handleSave} className="primary-button px-5">
              저장
            </button>
          </div>
        </div>
        </section>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default EditRecordModal;

function toDateTimeParts(value: string | Date): DateTimeParts {
  const date = value instanceof Date ? value : new Date(value);

  return {
    date: dateInputValue(date),
    hour: String(date.getHours()).padStart(2, "0"),
    minute: String(date.getMinutes()).padStart(2, "0"),
    second: String(date.getSeconds()).padStart(2, "0"),
  };
}

function toDate(value: DateTimeParts) {
  return new Date(`${value.date}T${value.hour}:${value.minute}:${value.second}`);
}

function getDayDelta(previousDate: string, nextDate: string) {
  const previous = new Date(`${previousDate}T00:00:00`);
  const next = new Date(`${nextDate}T00:00:00`);

  if (Number.isNaN(previous.getTime()) || Number.isNaN(next.getTime())) {
    return 0;
  }

  return Math.round((next.getTime() - previous.getTime()) / 86400000);
}

function shiftDateValue(value: string, dayDelta: number) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  date.setDate(date.getDate() + dayDelta);
  return dateInputValue(date);
}

function DateTimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateTimeParts;
  onChange: (value: DateTimeParts) => void;
}) {
  const update = (key: keyof DateTimeParts, nextValue: string) => {
    onChange({ ...value, [key]: nextValue });
  };

  return (
    <fieldset className="block">
      <legend className="text-sm font-black text-slate-700 dark:text-slate-200">{label}</legend>
      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_86px_86px_86px] gap-2 max-sm:grid-cols-2">
        <input
          type="date"
          value={value.date}
          onChange={(event) => update("date", event.target.value)}
          className="soft-input w-full max-sm:col-span-2"
        />
        <select
          aria-label={`${label} 시`}
          value={value.hour}
          onChange={(event) => update("hour", event.target.value)}
          className="soft-input w-full"
        >
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {hour}시
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} 분`}
          value={value.minute}
          onChange={(event) => update("minute", event.target.value)}
          className="soft-input w-full"
        >
          {minuteSecondOptions.map((minute) => (
            <option key={minute} value={minute}>
              {minute}분
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} 초`}
          value={value.second}
          onChange={(event) => update("second", event.target.value)}
          className="soft-input w-full"
        >
          {minuteSecondOptions.map((second) => (
            <option key={second} value={second}>
              {second}초
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
