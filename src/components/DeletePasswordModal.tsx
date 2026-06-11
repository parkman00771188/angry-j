import { FormEvent, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LockKeyhole, X } from "lucide-react";
import { isAdminPassword } from "../lib/adminAuth";

type DeletePasswordModalProps = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function DeletePasswordModal({
  title = "삭제 확인",
  description = "기록을 삭제하려면 비밀번호를 입력하세요.",
  confirmLabel = "삭제",
  onCancel,
  onConfirm,
}: DeletePasswordModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAdminPassword(password)) {
      setError("비밀번호가 맞지 않습니다.");
      setPassword("");
      return;
    }

    onConfirm();
  };

  return createPortal(
    <div className="fixed inset-0 z-[1100] overflow-y-auto bg-slate-950/50 px-4 py-6 backdrop-blur-sm sm:py-10">
      <div className="flex min-h-full items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="card max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto p-4 sm:max-h-[calc(100vh-5rem)] sm:p-5"
        >
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300">
                <LockKeyhole className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            </div>
            <button type="button" onClick={onCancel} className="icon-button">
              <X className="h-5 w-5" />
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-black text-slate-700 dark:text-slate-200">비밀번호</span>
            <input
              ref={inputRef}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
              className="soft-input mt-2 w-full"
              autoComplete="current-password"
            />
          </label>

          {error ? <p className="mt-3 text-sm font-bold text-red-500">{error}</p> : null}

          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onCancel} className="secondary-button px-5">
              취소
            </button>
            <button type="submit" className="danger-button px-5" disabled={!password}>
              {confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

export default DeletePasswordModal;
