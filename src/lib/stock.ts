// 從 Yahoo Finance 取得股票歷史日線資料（免金鑰，只在 server 端呼叫）

export type Bar = {
  date: string; // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockHistory = {
  symbol: string; // 實際查詢用的代碼，例如 2330.TW、AAPL
  name: string;
  currency: string;
  exchange: string;
  bars: Bar[]; // 日期升序
};

/** 帶有 HTTP 狀態碼、可直接顯示給使用者的錯誤 */
export class UserFacingError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const SYMBOL_PATTERN = /^[A-Z0-9^][A-Z0-9.^=-]{0,14}$/;

export function normalizeSymbol(raw: string): string {
  return raw.trim().toUpperCase();
}

export function validateSymbol(symbol: string): string | null {
  if (!symbol) return "請輸入股票代碼，例如台股 2330、0050，或美股 AAPL、NVDA。";
  if (!SYMBOL_PATTERN.test(symbol)) return "股票代碼格式不正確，例如台股 2330、美股 AAPL。";
  return null;
}

/**
 * 依使用者輸入產生要嘗試的 Yahoo 代碼：
 * 純數字（可帶一個英文字尾，如 00632R）視為台股，先試上市（.TW）再試上櫃（.TWO）；其餘原樣查詢。
 */
function candidateSymbols(symbol: string): string[] {
  if (/^\d{4,6}[A-Z]?$/.test(symbol)) return [`${symbol}.TW`, `${symbol}.TWO`];
  return [symbol];
}

export async function getStockHistory(input: string): Promise<StockHistory> {
  let lastError: UserFacingError | null = null;
  for (const symbol of candidateSymbols(input)) {
    try {
      const history = await fetchYahoo(symbol);
      if (history.bars.length > 0) return history;
      lastError = new UserFacingError(`查無 ${input} 的交易資料。`, 404);
    } catch (err) {
      if (!(err instanceof UserFacingError) || err.status !== 404) throw err;
      lastError = err;
    }
  }
  throw lastError ?? new UserFacingError(`查無 ${input} 的交易資料。`, 404);
}

type YahooChart = {
  chart?: {
    result?: {
      meta?: {
        symbol?: string;
        currency?: string;
        longName?: string;
        shortName?: string;
        fullExchangeName?: string;
        exchangeName?: string;
        gmtoffset?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: {
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }[];
      };
    }[];
    error?: { code?: string; description?: string } | null;
  };
};

async function fetchYahoo(symbol: string): Promise<StockHistory> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;

  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new UserFacingError("無法連線到股價資料來源，請檢查網路後再試一次。", 502);
  }

  let body: YahooChart;
  try {
    body = (await res.json()) as YahooChart;
  } catch {
    throw new UserFacingError(`股價資料來源回應異常（HTTP ${res.status}），請稍後再試。`, 502);
  }

  const result = body.chart?.result?.[0];
  if (res.status === 404 || body.chart?.error?.code === "Not Found" || !result) {
    throw new UserFacingError(`查無股票代碼 ${symbol.replace(/\.TWO?$/, "")}，請確認代碼是否正確。`, 404);
  }
  if (!res.ok) {
    throw new UserFacingError(`股價資料來源暫時無法使用（HTTP ${res.status}），請稍後再試。`, 502);
  }

  const meta = result.meta ?? {};
  const offset = meta.gmtoffset ?? 0;
  const q = result.indicators?.quote?.[0] ?? {};
  const bars: Bar[] = [];
  (result.timestamp ?? []).forEach((t, i) => {
    const bar = {
      date: new Date((t + offset) * 1000).toISOString().slice(0, 10),
      open: q.open?.[i] ?? NaN,
      high: q.high?.[i] ?? NaN,
      low: q.low?.[i] ?? NaN,
      close: q.close?.[i] ?? NaN,
      volume: q.volume?.[i] ?? 0,
    };
    // 略過停牌或資料缺漏的交易日
    if ([bar.open, bar.high, bar.low, bar.close].every((v) => Number.isFinite(v) && v > 0)) bars.push(bar);
  });
  // 去除重複日期（盤中時最後一筆可能與前一筆同日）
  const unique = bars.filter((b, i) => i === bars.length - 1 || b.date !== bars[i + 1].date);

  return {
    symbol: meta.symbol ?? symbol,
    name: meta.longName ?? meta.shortName ?? symbol,
    currency: meta.currency ?? "",
    exchange: meta.fullExchangeName ?? meta.exchangeName ?? "",
    bars: unique,
  };
}
