// POST /api/stock-analyst：取得股票歷史數據、計算技術指標，交給 OpenAI 回答使用者問題（串流回傳）
import OpenAI from "openai";
import { buildSnapshot } from "@/lib/indicators";
import { readApiKey } from "@/lib/openai";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompt";
import { UserFacingError, getStockHistory, normalizeSymbol, validateSymbol } from "@/lib/stock";

const MAX_QUESTION_LENGTH = 1000;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const symbol = normalizeSymbol(String(body.symbol ?? ""));
  const question = String(body.question ?? "").trim();

  const symbolError = validateSymbol(symbol);
  if (symbolError) return error(symbolError, 400);
  if (!question) return error("請輸入想詢問的問題。", 400);
  if (question.length > MAX_QUESTION_LENGTH) return error(`問題請在 ${MAX_QUESTION_LENGTH} 字以內。`, 400);

  // BYOK：使用者自備的金鑰由 header 帶入，只用於這次請求，不記錄、不保存
  const { key: apiKey, error: keyError } = readApiKey(request);
  if (keyError) return error(keyError, 401);

  try {
    const stock = await getStockHistory(symbol);
    if (stock.bars.length < 20) return error("這檔股票的交易資料太少，無法進行技術分析。", 422);
    const snapshot = buildSnapshot(stock.bars);

    const client = new OpenAI({ apiKey, timeout: 120_000, maxRetries: 1 });
    const model = process.env.OPENAI_MODEL || "gpt-5-mini";
    const completion = await client.chat.completions.create({
      model,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(stock, snapshot, question) },
      ],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          console.error("[api/stock-analyst] stream", err);
          controller.enqueue(encoder.encode("\n\n> ⚠️ 回答傳送到一半中斷了，請再試一次。"));
        } finally {
          controller.close();
        }
      },
    });

    // 近 120 日收盤價，供前端畫走勢小圖
    const closes = stock.bars.slice(-120).map((b) => Math.round(b.close * 100) / 100);
    const meta = { symbol: stock.symbol, name: stock.name, currency: stock.currency, exchange: stock.exchange, model, snapshot, closes };
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Stock-Meta": encodeURIComponent(JSON.stringify(meta)),
      },
    });
  } catch (err) {
    if (err instanceof UserFacingError) return error(err.message, err.status);
    if (err instanceof OpenAI.APIError) {
      console.error("[api/stock-analyst]", err.status, err.message);
      switch (err.status) {
        case 401:
          return error("OpenAI API Key 無效，請到「設定」重新輸入你的金鑰。", 401);
        case 403:
        case 404:
          return error(`你的 OpenAI 帳號無法使用 ${process.env.OPENAI_MODEL || "gpt-5-mini"} 模型，請到 OpenAI 後台確認專案的模型權限。`, 403);
        case 429:
          return error("OpenAI 請求次數或額度已達上限，請稍後再試，或到 OpenAI 後台確認帳戶餘額。", 429);
        default:
          return error(`OpenAI 服務暫時無法使用（${err.status ?? "連線失敗"}），請稍後再試。`, 502);
      }
    }
    console.error("[api/stock-analyst]", err);
    return error("分析時發生未預期的錯誤，請稍後再試。", 500);
  }
}

function error(message: string, status: number) {
  return Response.json({ error: message }, { status });
}
