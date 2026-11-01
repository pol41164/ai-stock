"use client";

import { openSettings, useApiKey } from "@/lib/apiKey";

/** Header 上的設定按鈕；小圓點顯示是否已設定金鑰 */
export default function SettingsButton() {
  const key = useApiKey();
  const label = key === null ? "設定" : key ? "設定（已設定金鑰）" : "設定（尚未設定金鑰）";

  return (
    <button
      type="button"
      onClick={openSettings}
      aria-label={label}
      title={label}
      className="relative flex size-9 items-center justify-center rounded-full border border-line text-muted transition hover:border-line-strong hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {key !== null && (
        <span className={`absolute top-0.5 right-0.5 size-2 rounded-full ring-2 ring-ink ${key ? "bg-accent" : "bg-up"}`} />
      )}
    </button>
  );
}
