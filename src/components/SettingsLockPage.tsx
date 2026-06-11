import { FormEvent, useEffect, useRef, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { isAdminPassword } from "../lib/adminAuth";

type SettingsLockPageProps = {
  onUnlock: () => void;
};

function SettingsLockPage({ onUnlock }: SettingsLockPageProps) {
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

    onUnlock();
  };

  return (
    <section className="grid min-h-[calc(100vh-220px)] place-items-center px-1 py-8 sm:min-h-[calc(100vh-240px)]">
      <form onSubmit={handleSubmit} className="card w-full max-w-md p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
            <LockKeyhole className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">비밀번호를 입력하세요</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-400">
              설정을 변경하려면 비밀번호 확인이 필요합니다.
            </p>
          </div>
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

        <button type="submit" className="primary-button mt-5 w-full justify-center py-3" disabled={!password}>
          확인
        </button>
      </form>
    </section>
  );
}

export default SettingsLockPage;
