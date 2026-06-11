import { useEffect, useMemo, useState } from "react";
import { Check, Plus, RotateCcw, Trash2 } from "lucide-react";
import { createId } from "../lib/anger";
import { CauseOption } from "../types";

type CauseSettingsPanelProps = {
  causes: CauseOption[];
  onCausesChange: (causes: CauseOption[]) => void;
};

const palette = ["#2563EB", "#14B8A6", "#F59E0B", "#F97316", "#8B5CF6", "#EF4444", "#64748B"];

function CauseSettingsPanel({ causes, onCausesChange }: CauseSettingsPanelProps) {
  const [draftCauses, setDraftCauses] = useState(causes);
  const [newLabel, setNewLabel] = useState("");
  const [newColor, setNewColor] = useState("#2563EB");
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!isEditing) {
      setDraftCauses(causes);
    }
  }, [causes, isEditing]);

  const dirty = useMemo(
    () => JSON.stringify(draftCauses) !== JSON.stringify(causes),
    [causes, draftCauses],
  );

  const markEditing = () => {
    setIsEditing(true);
    setMessage("");
  };

  const updateCause = (id: string, patch: Partial<CauseOption>) => {
    markEditing();
    setDraftCauses((current) => current.map((cause) => (cause.id === id ? { ...cause, ...patch } : cause)));
  };

  const addCause = () => {
    const label = newLabel.trim();

    if (!label) {
      setMessage("추가할 원인 이름을 입력해주세요.");
      return;
    }

    if (draftCauses.some((cause) => cause.label.trim() === label)) {
      setMessage("이미 같은 이름의 원인이 있습니다.");
      return;
    }

    markEditing();
    setDraftCauses((current) => [...current, { id: createId("cause"), label, color: newColor }]);
    setNewLabel("");
  };

  const deleteCause = (id: string) => {
    if (draftCauses.length <= 1) {
      alert("원인은 최소 1개 이상 필요합니다.");
      return;
    }

    markEditing();
    setDraftCauses((current) => current.filter((cause) => cause.id !== id));
  };

  const resetDraft = () => {
    setDraftCauses(causes);
    setNewLabel("");
    setIsEditing(false);
    setMessage("");
  };

  const saveDraft = () => {
    const normalized = draftCauses
      .map((cause) => ({
        ...cause,
        label: cause.label.trim(),
        color: cause.color || "#64748B",
      }))
      .filter((cause) => cause.label);

    if (!normalized.length) {
      setMessage("원인은 최소 1개 이상 필요합니다.");
      return;
    }

    const labels = normalized.map((cause) => cause.label);
    const duplicate = labels.find((label, index) => labels.indexOf(label) !== index);

    if (duplicate) {
      setMessage(`중복된 원인 이름이 있습니다: ${duplicate}`);
      return;
    }

    onCausesChange(normalized);
    setDraftCauses(normalized);
    setIsEditing(false);
    setMessage("원인 설정이 저장되었습니다.");
  };

  return (
    <section className="card p-5">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">원인 관리</h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            기록 입력과 차트에 사용할 원인 항목과 색상을 관리합니다.
          </p>
        </div>
        <div className="flex gap-2">
          {dirty ? (
            <button type="button" onClick={resetDraft} className="secondary-button px-3 py-2 text-xs">
              <RotateCcw className="h-4 w-4" />
              되돌리기
            </button>
          ) : null}
          <button type="button" onClick={saveDraft} disabled={!dirty} className="primary-button px-3 py-2 text-xs">
            <Check className="h-4 w-4" />
            변경 저장
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.03] md:grid-cols-[minmax(0,1fr)_140px_120px]">
        <input
          value={newLabel}
          onChange={(event) => setNewLabel(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              addCause();
            }
          }}
          placeholder="새 원인 이름"
          className="soft-input"
        />
        <div className="flex items-center gap-2">
          <input
            aria-label="새 원인 색상"
            type="color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
            className="h-11 w-12 cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
          />
          <div className="flex flex-wrap gap-1">
            {palette.slice(0, 4).map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`${color} 선택`}
                onClick={() => setNewColor(color)}
                className="h-5 w-5 rounded-full border border-white shadow"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
        <button type="button" onClick={addCause} className="primary-button py-2">
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {message ? (
        <p
          className={`mb-4 rounded-xl px-3 py-2 text-sm font-bold ${
            message.includes("저장")
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300"
          }`}
        >
          {message}
        </p>
      ) : null}

      <div className="space-y-3">
        {draftCauses.map((cause) => (
          <div
            key={cause.id}
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 dark:border-white/[0.08] dark:bg-white/[0.04] md:grid-cols-[36px_minmax(0,1fr)_120px_42px]"
          >
            <span className="h-9 w-9 rounded-xl" style={{ backgroundColor: cause.color }} />
            <input
              value={cause.label}
              onChange={(event) => updateCause(cause.id, { label: event.target.value })}
              className="soft-input"
            />
            <input
              aria-label={`${cause.label} 색상`}
              type="color"
              value={cause.color}
              onChange={(event) => updateCause(cause.id, { color: event.target.value })}
              className="h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1 dark:border-white/[0.08] dark:bg-white/[0.04]"
            />
            <button
              type="button"
              aria-label="원인 삭제"
              onClick={() => deleteCause(cause.id)}
              className="icon-button h-11 w-11 hover:text-red-600 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default CauseSettingsPanel;
