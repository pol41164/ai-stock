// （僅供 client component 使用）使用者自備的 OpenAI API Key（BYOK）：只存在使用者自己的瀏覽器 localStorage
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "candle.openaiApiKey";
const CHANGE_EVENT = "candle:apikey-change";
export const OPEN_SETTINGS_EVENT = "candle:open-settings";
/** 呼叫我們的 API 時，用這個 header 帶上金鑰 */
export const API_KEY_HEADER = "X-OpenAI-Key";

export function getApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setApiKey(key: string) {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 無痕模式或封鎖儲存空間時無法保存，僅略過
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback); // 其他分頁修改時同步
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** 讀取目前的金鑰；server 端渲染時為 null（代表尚未讀取，避免 hydration 不一致） */
export function useApiKey(): string | null {
  return useSyncExternalStore(subscribe, getApiKey, () => null);
}

export function openSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

/** 顯示用：只露出前 7 碼與後 4 碼 */
export function maskKey(key: string): string {
  return key.length <= 12 ? "••••" : `${key.slice(0, 7)}••••${key.slice(-4)}`;
}
