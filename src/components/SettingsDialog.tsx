"use client";

import { useEffect, useRef, useState } from "react";
import { API_KEY_HEADER, OPEN_SETTINGS_EVENT, getApiKey, maskKey, setApiKey, useApiKey } from "@/lib/apiKey";

type Status = { kind: "idle" } | { kind: "checking" } | { kind: "ok"; text: string } | { kind: "error"; text: string };

/** 全站共用的設定視窗：輸入、驗證、儲存或清除 OpenAI API Key */
export default function SettingsDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const savedKey = useApiKey();
  const [draft, setDraft] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const open = () => {
      setDraft(getApiKey());
      setShow(false);
      setStatus({ kind: "idle" });
      dialogRef.current?.showModal();
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, open);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, open);
  }, []);

  const close = () => dialogRef.current?.close();

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const key = draft.trim();
    if (!key) return;
    setStatus({ kind: "checking" });
    try {
      const res = await fetch("/api/verify-key", { method: "POST", headers: { [API_KEY_HEADER]: key } });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      // 只有確定無效（格式錯誤或 401）時不儲存；連線問題或額度上限仍允許儲存
      if (res.status === 400 || res.status === 401) {
        setStatus({ kind: "error", text: data.error ?? "金鑰無效。" });
        return;
      }
      setApiKey(key);
      setStatus(data.ok ? { kind: "ok", text: "金鑰有效，已儲存在這個瀏覽器。" } : { kind: "ok", text: `已儲存。${data.error ?? ""}` });
      if (data.ok) setTimeout(close, 900);
    } catch {
      setStatus({ kind: "error", text: "無法連線到伺服器驗證金鑰，請確認伺服器是否啟動。" });
    }
  }

  function clear() {
    setApiKey("");
    setDraft("");
    setStatus({ kind: "ok", text: "已從這個瀏覽器移除金鑰。" });
  }

  return (
    <dialog
      ref={dialogRef}
      onClick={(e) => e.target === dialogRef.current && close()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line-strong bg-panel p-0 text-fg shadow-2xl shadow-black/60 backdrop:bg-black/70 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={save} className="flex flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div>
            <h2 className="text-lg font-bold">設定</h2>
            <p className="mt-1 text-sm text-muted">使用你自己的 OpenAI API Key 進行分析。</p>
          </div>
          <button type="button" onClick={close} aria-label="關閉" className="rounded-lg px-2 py-1 text-muted transition hover:bg-white/5 hover:text-fg">
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 py-6">
          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between text-xs font-medium tracking-wide text-muted">
              OpenAI API Key
              {savedKey && <span className="font-mono text-accent">目前：{maskKey(savedKey)}</span>}
            </span>
            <div className="flex gap-2">
              <input
                type={show ? "text" : "password"}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setStatus({ kind: "idle" });
                }}
                placeholder="sk-..."
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-xl border border-line bg-ink px-4 py-3 font-mono text-sm outline-none placeholder:text-white/25 focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="shrink-0 rounded-xl border border-line px-3 text-sm text-muted transition hover:text-fg"
              >
                {show ? "隱藏" : "顯示"}
              </button>
            </div>
          </label>

          {status.kind !== "idle" && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                status.kind === "error" ? "bg-up/10 text-up" : status.kind === "ok" ? "bg-accent/10 text-accent" : "bg-white/5 text-muted"
              }`}
            >
              {status.kind === "checking" ? "正在向 OpenAI 驗證金鑰…" : status.text}
            </p>
          )}

          <ul className="space-y-1.5 rounded-xl border border-line bg-ink/60 px-4 py-3 text-xs leading-relaxed text-muted">
            <li>・金鑰只存在你這個瀏覽器的 localStorage，我們的伺服器不會保存。</li>
            <li>・每次分析時金鑰會隨請求送到伺服器，再由伺服器轉送給 OpenAI；費用由你的 OpenAI 帳戶支付。</li>
            <li>
              ・還沒有金鑰？到{" "}
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-fg underline underline-offset-2">
                OpenAI 後台
              </a>{" "}
              建立。在公用電腦上使用後，記得清除金鑰。
            </li>
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-6 py-4">
          <button
            type="button"
            onClick={clear}
            disabled={!savedKey}
            className="text-sm text-muted transition hover:text-up disabled:pointer-events-none disabled:opacity-40"
          >
            清除金鑰
          </button>
          <button
            type="submit"
            disabled={!draft.trim() || status.kind === "checking"}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {status.kind === "checking" ? "驗證中…" : "驗證並儲存"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
