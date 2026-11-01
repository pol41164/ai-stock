// server 端：從請求 header 讀取使用者自備的 OpenAI API Key（BYOK），不使用伺服器環境變數

export const API_KEY_HEADER = "x-openai-key";

export function readApiKey(request: Request): { key: string; error?: undefined } | { key?: undefined; error: string } {
  const key = request.headers.get(API_KEY_HEADER)?.trim() ?? "";
  if (!key) return { error: "尚未設定 OpenAI API Key，請先到「設定」輸入你的金鑰。" };
  if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(key)) {
    return { error: "OpenAI API Key 格式不正確，應以 sk- 開頭，請到「設定」重新輸入。" };
  }
  return { key };
}
