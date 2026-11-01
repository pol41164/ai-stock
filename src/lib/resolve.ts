// 把使用者輸入（股票代碼或公司名稱）解析成可查詢的股票
// - 台股中文名稱 → FinMind 台股清單（免金鑰，快取在記憶體一天）
// - 英文公司名稱 → Yahoo Finance 搜尋
import { UserFacingError } from "./stock";

export type Candidate = { code: string; name: string };

export type Resolved = {
  /** 依序嘗試的 Yahoo 代碼，例如 ["2330.TW"] 或 ["2330.TW", "2330.TWO"] */
  yahooSymbols: string[];
  /** 顯示用的代碼（台股不含 .TW 後綴） */
  code: string;
  /** 顯示用的公司名稱；台股為中文名稱，查不到時為 null（改用 Yahoo 的名稱） */
  name: string | null;
  /** 是否透過公司名稱辨識而來 */
  byName: boolean;
  /** 其他可能的符合結果，供使用者改選 */
  alternatives: Candidate[];
};

const TW_CODE = /^\d{4,6}[A-Z]?$/;
const TICKER = /^[A-Z][A-Z0-9.^=-]{0,9}$|^\^[A-Z0-9.]{1,10}$/;
const CJK = /[㐀-鿿]/;

export const MAX_QUERY_LENGTH = 30;

export function validateQuery(query: string): string | null {
  if (!query) return "請輸入股票代碼或公司名稱，例如 2330、台積電、AAPL、Apple。";
  if (query.length > MAX_QUERY_LENGTH) return `股票代碼或公司名稱請在 ${MAX_QUERY_LENGTH} 字以內。`;
  if (/[<>{}\\]/.test(query)) return "股票代碼或公司名稱含有不支援的字元。";
  return null;
}

/* ---------- 台股清單（FinMind TaiwanStockInfo） ---------- */

type TwStock = { code: string; name: string; market: "twse" | "tpex" | string };
const TW_TTL = 24 * 60 * 60 * 1000;
let twCache: { list: TwStock[]; byCode: Map<string, TwStock>; fetchedAt: number } | null = null;

async function getTwStocks() {
  if (twCache && Date.now() - twCache.fetchedAt < TW_TTL) return twCache;
  try {
    const res = await fetch("https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockInfo", {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    const body = (await res.json()) as { status?: number; data?: { stock_id?: string; stock_name?: string; type?: string }[] };
    if (!res.ok || body.status !== 200 || !Array.isArray(body.data)) throw new Error(`HTTP ${res.status}`);
    const byCode = new Map<string, TwStock>();
    for (const r of body.data) {
      // 同一檔股票會因多個產業分類重複出現，以代碼去重
      if (r.stock_id && r.stock_name && !byCode.has(r.stock_id.toUpperCase())) {
        byCode.set(r.stock_id.toUpperCase(), { code: r.stock_id.toUpperCase(), name: r.stock_name, market: r.type ?? "" });
      }
    }
    twCache = { list: [...byCode.values()], byCode, fetchedAt: Date.now() };
  } catch (err) {
    console.warn("[resolve] 無法取得台股清單：", (err as Error).message);
    if (!twCache) return null; // 第一次就失敗：沒有快取可用
  }
  return twCache;
}

const normalizeName = (s: string) => s.replace(/\s+/g, "").replace(/臺/g, "台").toUpperCase();

/** 依名稱相似度排序：完全相同 > 開頭相同 > 包含；同分時名稱越短、代碼越短（一般股票）越前面 */
function searchTw(list: TwStock[], query: string): TwStock[] {
  const q = normalizeName(query);
  const scored: { s: TwStock; score: number }[] = [];
  for (const s of list) {
    const name = normalizeName(s.name);
    let score = 0;
    if (name === q) score = 1000;
    else if (name.startsWith(q)) score = 500 - (name.length - q.length);
    else if (name.includes(q)) score = 300 - (name.length - q.length);
    if (score > 0) scored.push({ s, score });
  }
  scored.sort((a, b) => b.score - a.score || a.s.code.length - b.s.code.length || a.s.code.localeCompare(b.s.code));
  return scored.map((x) => x.s);
}

const twYahoo = (s: TwStock) => (s.market === "tpex" ? [`${s.code}.TWO`] : s.market === "twse" ? [`${s.code}.TW`] : [`${s.code}.TW`, `${s.code}.TWO`]);

/* ---------- Yahoo 搜尋（英文名稱） ---------- */

const US_EXCHANGES = new Set(["NMS", "NYQ", "NGM", "NCM", "ASE", "PCX", "BTS", "NAS", "NYS"]);

type YahooHit = Candidate & { preferred: boolean };

async function searchYahoo(query: string): Promise<YahooHit[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0`;
  try {
    const res = await fetch(url, { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(10_000) });
    const body = (await res.json()) as { quotes?: { symbol?: string; quoteType?: string; exchange?: string; shortname?: string; longname?: string }[] };
    const quotes = (body.quotes ?? []).filter(
      (q) => q.symbol && (q.quoteType === "EQUITY" || q.quoteType === "ETF") && !q.symbol.includes("="),
    );
    // 優先美股與台股，其次其他市場
    const rank = (q: (typeof quotes)[number]) => (US_EXCHANGES.has(q.exchange ?? "") || /\.TWO?$/.test(q.symbol!) ? 0 : 1);
    return quotes
      .map((q, i) => ({ q, i }))
      .sort((a, b) => rank(a.q) - rank(b.q) || a.i - b.i)
      .map(({ q }) => ({ code: q.symbol!, name: q.longname ?? q.shortname ?? q.symbol!, preferred: rank(q) === 0 }));
  } catch {
    throw new UserFacingError("暫時無法搜尋公司名稱，請改用股票代碼查詢。", 502);
  }
}

/* ---------- 對外：解析輸入 ---------- */

export async function resolveQuery(raw: string): Promise<Resolved> {
  const query = raw.trim();
  const upper = query.toUpperCase();

  // 1. 台股代碼：用清單判斷上市（.TW）或上櫃（.TWO），並取得中文名稱
  if (TW_CODE.test(upper)) {
    const tw = await getTwStocks();
    const hit = tw?.byCode.get(upper);
    return {
      yahooSymbols: hit ? twYahoo(hit) : [`${upper}.TW`, `${upper}.TWO`],
      code: upper,
      name: hit?.name ?? null,
      byName: false,
      alternatives: [],
    };
  }

  // 2. 中文名稱：搜尋台股清單
  if (CJK.test(query)) {
    const tw = await getTwStocks();
    if (!tw) throw new UserFacingError("暫時無法取得台股名稱清單，請改用股票代碼查詢（例如 2330）。", 502);
    const hits = searchTw(tw.list, query);
    if (hits.length === 0) {
      throw new UserFacingError(`找不到名稱包含「${query}」的台股。美股請輸入英文名稱或代碼，例如 Apple、AAPL。`, 404);
    }
    const [best, ...rest] = hits;
    return {
      yahooSymbols: twYahoo(best),
      code: best.code,
      name: best.name,
      byName: true,
      alternatives: rest.slice(0, 5).map((s) => ({ code: s.code, name: s.name })),
    };
  }

  // 3. 看起來像代碼（例如 AAPL、BRK.B）：先當代碼查；查不到時呼叫端會改用名稱搜尋
  if (TICKER.test(upper) && !/\s/.test(query)) {
    return { yahooSymbols: [upper], code: upper, name: null, byName: false, alternatives: [] };
  }

  // 4. 其他（英文公司名稱，如 "Taiwan Semiconductor"）：Yahoo 搜尋
  return resolveByYahooSearch(query);
}

export async function resolveByYahooSearch(query: string): Promise<Resolved> {
  const hits = await searchYahoo(query);
  if (hits.length === 0) {
    throw new UserFacingError(`找不到「${query}」對應的股票，請確認名稱或改用股票代碼。`, 404);
  }
  const [best, ...rest] = hits;
  // 台股改用中文名稱與不含後綴的代碼顯示
  const tw = hits.some((h) => /\.TWO?$/.test(h.code)) ? await getTwStocks() : null;
  const display = (h: YahooHit): Candidate => {
    const twCode = h.code.match(/^(\d{4,6}[A-Z]?)\.TWO?$/)?.[1];
    return twCode ? { code: twCode, name: tw?.byCode.get(twCode)?.name ?? h.name } : { code: h.code, name: h.name };
  };
  const shown = display(best);
  return {
    yahooSymbols: [best.code],
    code: shown.code,
    name: shown.name,
    byName: true,
    // 其他候選只列美股與台股，避免出現其他國家的重複掛牌
    alternatives: rest.filter((h) => h.preferred).slice(0, 5).map(display),
  };
}
