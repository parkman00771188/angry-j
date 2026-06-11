import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, CheckCircle2, Pencil, Trash2, X } from "lucide-react";
import { formatDate, formatDuration, formatTime, getCauseColor, getRecordCauses } from "../lib/anger";
import { AngerEpisodeRecord, AppSettings, CauseOption } from "../types";
import DeletePasswordModal from "./DeletePasswordModal";
import EditRecordModal from "./EditRecordModal";

type RecentRecordsTableProps = {
  records: AngerEpisodeRecord[];
  causes: CauseOption[];
  dateTimeFormat: AppSettings["dateTimeFormat"];
  onUpdateRecord: (record: AngerEpisodeRecord) => void;
  onDeleteRecord?: (id: string) => void;
  onDeleteRecords?: (ids: string[]) => void;
  maxRows?: number;
  allowDelete?: boolean;
  onViewAll?: () => void;
};

type PendingDelete = {
  ids: string[];
};

function RecentRecordsTable({
  records,
  causes,
  dateTimeFormat,
  onUpdateRecord,
  onDeleteRecord,
  onDeleteRecords,
  maxRows,
  allowDelete = true,
  onViewAll,
}: RecentRecordsTableProps) {
  const [editingRecord, setEditingRecord] = useState<AngerEpisodeRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<AngerEpisodeRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const sorted = useMemo(
    () => [...records].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [records],
  );
  const displayedRecords = useMemo(() => (maxRows ? sorted.slice(0, maxRows) : sorted), [maxRows, sorted]);
  const displayedIds = useMemo(() => displayedRecords.map((record) => record.id), [displayedRecords]);
  const canDelete = allowDelete && Boolean(onDeleteRecord);
  const allSelected = canDelete && displayedIds.length > 0 && displayedIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => displayedIds.includes(id)));
  }, [displayedIds]);

  const toggleRecord = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : displayedIds);
  };

  const handleBulkDelete = () => {
    if (!selectedIds.length) {
      return;
    }

    setPendingDelete({ ids: [...selectedIds] });
  };

  const confirmPendingDelete = () => {
    if (!pendingDelete) {
      return;
    }

    const idSet = new Set(pendingDelete.ids);

    if (onDeleteRecords) {
      onDeleteRecords(pendingDelete.ids);
    } else if (onDeleteRecord) {
      pendingDelete.ids.forEach(onDeleteRecord);
    }

    setSelectedIds((current) => current.filter((id) => !idSet.has(id)));
    setEditingRecord((current) => (current && idSet.has(current.id) ? null : current));
    setViewingRecord((current) => (current && idSet.has(current.id) ? null : current));
    setPendingDelete(null);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#d8e5f5] px-4 py-4 dark:border-white/[0.08] sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">최근 기록</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            저장된 기록은 언제든지 수정할 수 있습니다.
          </p>
        </div>
        <div className="flex w-full shrink-0 items-center justify-end gap-2 sm:w-auto">
        {onViewAll ? (
          <button type="button" onClick={onViewAll} className="secondary-button px-4 py-2 text-xs">
            전체보기
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
        {canDelete && selectedIds.length ? (
          <button type="button" onClick={handleBulkDelete} className="danger-button px-4 py-2 text-xs">
            <Trash2 className="h-4 w-4" />
            선택 삭제 {selectedIds.length}개
          </button>
        ) : null}
        </div>
      </div>

      {sorted.length ? (
        <>
        <div className="space-y-3 px-4 pb-4 pt-3 md:hidden">
          {displayedRecords.map((record) => {
            const selected = selectedIds.includes(record.id);
            const recordCauses = getRecordCauses(record);

            return (
              <article
                key={record.id}
                tabIndex={0}
                onClick={() => setViewingRecord(record)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setViewingRecord(record);
                  }
                }}
                className={`rounded-2xl border p-3 transition focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${
                  selected
                    ? "border-blue-200 bg-blue-50/85 dark:border-blue-400/25 dark:bg-blue-500/10"
                    : "border-[#e1ebf7] bg-white/80 dark:border-white/[0.08] dark:bg-white/[0.035]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800 dark:text-white">
                      {formatRecordDate(record.startTime, dateTimeFormat)}
                    </p>
                    <p className="mt-1 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {formatTime(record.startTime)} ~ {formatTime(record.endTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {canDelete ? (
                      <input
                        type="checkbox"
                        aria-label={`${formatRecordDate(record.startTime, dateTimeFormat)} 湲곕줉 ?좏깮`}
                        checked={selected}
                        onChange={() => toggleRecord(record.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="h-4 w-4 accent-blue-600"
                      />
                    ) : null}
                    <button
                      type="button"
                      aria-label="湲곕줉 ?섏젙"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingRecord(record);
                      }}
                      className="icon-button h-9 w-9"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <CausePills labels={recordCauses} causes={causes} />
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">
                    {formatDuration(record.durationSeconds)}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 break-words text-sm font-medium leading-5 text-slate-500 dark:text-slate-400">
                  {record.memo || "硫붾え ?놁쓬"}
                </p>
              </article>
            );
          })}
        </div>

        <div className="hidden overflow-x-auto px-5 pb-5 pt-3 md:block">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="rounded-xl bg-[#f7faff] text-xs font-black text-[#52698c] dark:bg-white/[0.04] dark:text-slate-300">
              <tr>
                {canDelete ? (
                <th className="rounded-l-xl px-4 py-3">
                  <input
                    type="checkbox"
                    aria-label="전체 기록 선택"
                    checked={allSelected}
                    onChange={toggleAll}
                    onClick={(event) => event.stopPropagation()}
                    className="h-4 w-4 accent-blue-600"
                  />
                </th>
                ) : null}
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">시작 시간</th>
                <th className="px-4 py-3">종료 시간</th>
                <th className="px-4 py-3">지속 시간</th>
                <th className="px-4 py-3">원인</th>
                <th className="px-4 py-3">메모</th>
                <th className="px-4 py-3">상태</th>
                <th className="rounded-r-xl px-4 py-3 text-right">수정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8eff8] dark:divide-white/[0.07]">
              {displayedRecords.map((record) => {
                const selected = selectedIds.includes(record.id);
                const recordCauses = getRecordCauses(record);

                return (
                <tr
                  key={record.id}
                  tabIndex={0}
                  onClick={() => setViewingRecord(record)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setViewingRecord(record);
                    }
                  }}
                  className={`cursor-pointer bg-transparent transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400/50 ${
                    selected
                      ? "bg-blue-50/80 dark:bg-blue-500/10"
                      : "hover:bg-slate-50/90 dark:hover:bg-white/[0.05]"
                  }`}
                >
                  {canDelete ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      aria-label={`${formatRecordDate(record.startTime, dateTimeFormat)} 기록 선택`}
                      checked={selected}
                      onChange={() => toggleRecord(record.id)}
                      onClick={(event) => event.stopPropagation()}
                      className="h-4 w-4 accent-blue-600"
                    />
                  </td>
                  ) : null}
                  <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700 dark:text-slate-200">
                    {formatRecordDate(record.startTime, dateTimeFormat)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {formatTime(record.startTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {formatTime(record.endTime)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-black text-slate-800 dark:text-white">
                    {formatDuration(record.durationSeconds)}
                  </td>
                  <td className="px-4 py-3">
                    <CausePills labels={recordCauses} causes={causes} />
                  </td>
                  <td className="max-w-[430px] truncate px-4 py-3 font-medium text-slate-500 dark:text-slate-400">
                    {record.memo || "메모 없음"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" />
                      저장됨
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      aria-label="기록 수정"
                      onClick={(event) => {
                        event.stopPropagation();
                        setEditingRecord(record);
                      }}
                      className="icon-button h-9 w-9"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      ) : (
        <div className="grid min-h-[220px] place-items-center bg-slate-50/70 px-4 text-center dark:bg-white/[0.02]">
          <div>
            <p className="font-black text-slate-800 dark:text-white">아직 기록이 없습니다</p>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              기록 입력 카드에서 첫 에피소드를 저장해보세요.
            </p>
          </div>
        </div>
      )}

      {editingRecord ? (
        <EditRecordModal
          record={editingRecord}
          causes={causes}
          onClose={() => setEditingRecord(null)}
          onUpdate={(record) => {
            onUpdateRecord(record);
            setEditingRecord(null);
          }}
          onDelete={(id) => {
            setPendingDelete({ ids: [id] });
          }}
          allowDelete={canDelete}
        />
      ) : null}

      {viewingRecord ? (
        <RecordDetailModal
          record={viewingRecord}
          causes={causes}
          dateTimeFormat={dateTimeFormat}
          onClose={() => setViewingRecord(null)}
          onEdit={() => {
            setViewingRecord(null);
            setEditingRecord(viewingRecord);
          }}
        />
      ) : null}

      {pendingDelete ? (
        <DeletePasswordModal
          title="기록 삭제"
          description={
            pendingDelete.ids.length === 1
              ? "이 기록을 삭제하려면 비밀번호를 입력하세요."
              : `선택한 기록 ${pendingDelete.ids.length}개를 삭제하려면 비밀번호를 입력하세요.`
          }
          confirmLabel={pendingDelete.ids.length === 1 ? "삭제" : `${pendingDelete.ids.length}개 삭제`}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmPendingDelete}
        />
      ) : null}
    </section>
  );
}

export default RecentRecordsTable;

function formatRecordDate(value: string, format: AppSettings["dateTimeFormat"]) {
  if (format === "24h") {
    return formatDate(value);
  }

  const date = new Date(value);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

function CausePills({ labels, causes }: { labels: string[]; causes: CauseOption[] }) {
  return (
    <div className="flex max-w-[260px] flex-wrap gap-1.5">
      {labels.map((label) => {
        const color = getCauseColor(label, causes);

        return (
          <span
            key={label}
            className="inline-flex min-w-16 justify-center rounded-full border px-2.5 py-1 text-xs font-black"
            style={{
              color,
              borderColor: `${color}55`,
              backgroundColor: `${color}16`,
            }}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

function RecordDetailModal({
  record,
  causes,
  dateTimeFormat,
  onClose,
  onEdit,
}: {
  record: AngerEpisodeRecord;
  causes: CauseOption[];
  dateTimeFormat: AppSettings["dateTimeFormat"];
  onClose: () => void;
  onEdit: () => void;
}) {
  const modal = (
    <div className="fixed inset-0 z-[1000] overflow-y-auto bg-slate-950/45 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div className="flex min-h-full items-center justify-center">
        <section className="card max-h-[calc(100vh-3rem)] w-full max-w-2xl overflow-y-auto p-4 sm:max-h-[calc(100vh-5rem)] sm:p-5">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">기록 상세</h2>
              <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                {formatRecordDate(record.startTime, dateTimeFormat)} {formatTime(record.startTime)}
              </p>
            </div>
            <button type="button" onClick={onClose} className="icon-button">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DetailItem label="시작 시간" value={`${formatRecordDate(record.startTime, dateTimeFormat)} ${formatTime(record.startTime)}`} />
            <DetailItem label="종료 시간" value={`${formatRecordDate(record.endTime, dateTimeFormat)} ${formatTime(record.endTime)}`} />
            <DetailItem label="지속 시간" value={formatDuration(record.durationSeconds)} />
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400">원인</p>
              <div className="mt-2">
                <CausePills labels={getRecordCauses(record)} causes={causes} />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.035] sm:col-span-2">
              <p className="text-xs font-black text-slate-500 dark:text-slate-400">메모</p>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm font-semibold leading-6 text-slate-800 dark:text-slate-100">
                {record.memo || "메모 없음"}
              </p>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="secondary-button px-5">
              닫기
            </button>
            <button type="button" onClick={onEdit} className="primary-button px-5">
              수정
            </button>
          </div>
        </section>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/[0.08] dark:bg-white/[0.035]">
      <p className="text-xs font-black text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 break-keep text-sm font-black text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
