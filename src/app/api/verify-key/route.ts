// POST /api/verify-key：檢查使用者輸入的 OpenAI API Key 是否有效（不會儲存金鑰）
import OpenAI from "openai";
import { readApiKey } from "@/lib/openai";

export async function POST(request: Request) {
  const { key, error } = readApiKey(request);
  if (error) return Response.json({ ok: false, error }, { status: 400 });

  try {
    const client = new OpenAI({ apiKey: key, timeout: 15_000, maxRetries: 0 });
    await client.models.list();
    return Response.json({ ok: true });
  } catch (err) {
    const status = err instanceof OpenAI.APIError ? err.status : undefined;
    if (status === 401) return Response.json({ ok: false, error: "金鑰無效，OpenAI 不接受這組金鑰。" }, { status: 401 });
    if (status === 429) return Response.json({ ok: false, error: "金鑰有效，但目前請求次數或額度已達上限。" }, { status: 429 });
    return Response.json({ ok: false, error: "暫時無法連線到 OpenAI 驗證金鑰，請稍後再試。" }, { status: 502 });
  }
}
