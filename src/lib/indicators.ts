// 技術指標計算（輸入皆為日期升序的日線資料）
import type { Bar } from "./stock";

export type Snapshot = {
  date: string;
  close: number;
  change: number;
  changePct: number;
  returns: { d5: number | null; d20: number | null; d60: number | null; y1: number | null };
  ma: { ma5: number | null; ma20: number | null; ma60: number | null };
  rsi14: number | null;
  macd: { dif: number; dea: number; hist: number } | null;
  kd: { k: number; d: number } | null;
  bollinger: { upper: number; middle: number; lower: number } | null;
  volume: { last: number; avg20: number | null; ratio: number | null };
  range: { high: number; low: number; highDate: string; lowDate: string };
  levels: { resistance: number[]; support: number[] };
};

export const round = (n: number, digits = 2) => Math.round(n * 10 ** digits) / 10 ** digits;

function sma(values: number[], window: number): (number | null)[] {
  const out: (number | null)[] = [];
  let sum = 0;
  values.forEach((v, i) => {
    sum += v;
    if (i >= window) sum -= values[i - window];
    out.push(i >= window - 1 ? sum / window : null);
  });
  return out;
}

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

/** RSI（Wilder 平滑法） */
function rsi(closes: number[], period = 14): number | null {
  if (closes.length <= period) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
  }
  if (loss === 0) return 100;
  return 100 - 100 / (1 + gain / loss);
}

/** MACD(12, 26, 9)：DIF = EMA12 − EMA26，DEA = DIF 的 9 日 EMA，柱狀體 = DIF − DEA */
function macd(closes: number[]) {
  if (closes.length < 35) return null;
  const e12 = ema(closes, 12);
  const e26 = ema(closes, 26);
  const dif = closes.map((_, i) => e12[i] - e26[i]);
  const dea = ema(dif, 9);
  const i = closes.length - 1;
  return { dif: dif[i], dea: dea[i], hist: dif[i] - dea[i] };
}

/** KD(9, 3, 3)：台股常用的隨機指標 */
function kd(bars: Bar[], period = 9) {
  if (bars.length < period) return null;
  let k = 50;
  let d = 50;
  for (let i = period - 1; i < bars.length; i++) {
    const win = bars.slice(i - period + 1, i + 1);
    const hi = Math.max(...win.map((b) => b.high));
    const lo = Math.min(...win.map((b) => b.low));
    const rsv = hi === lo ? 50 : ((bars[i].close - lo) / (hi - lo)) * 100;
    k = (2 / 3) * k + (1 / 3) * rsv;
    d = (2 / 3) * d + (1 / 3) * k;
  }
  return { k, d };
}

/**
 * 歷史支撐 / 阻力：找出近 120 個交易日的波段高低點（前後各 5 日內的最高 / 最低），
 * 取高於現價的高點作為阻力、低於現價的低點作為支撐，相近（差距 1.5% 內）的價位合併。
 */
function levels(bars: Bar[], close: number) {
  const recent = bars.slice(-120);
  const w = 5;
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = w; i < recent.length - w; i++) {
    const win = recent.slice(i - w, i + w + 1);
    if (recent[i].high === Math.max(...win.map((b) => b.high))) highs.push(recent[i].high);
    if (recent[i].low === Math.min(...win.map((b) => b.low))) lows.push(recent[i].low);
  }
  const merge = (arr: number[]) =>
    arr
      .sort((a, b) => a - b)
      .reduce<number[]>((acc, v) => {
        const last = acc[acc.length - 1];
        if (last !== undefined && Math.abs(v - last) / last < 0.015) acc[acc.length - 1] = (last + v) / 2;
        else acc.push(v);
        return acc;
      }, []);
  return {
    resistance: merge(highs.filter((h) => h > close)).slice(0, 3).map((v) => round(v)),
    support: merge(lows.filter((l) => l < close)).reverse().slice(0, 3).map((v) => round(v)),
  };
}

const pct = (from: number | undefined, to: number) => (from ? round(((to - from) / from) * 100) : null);
const r = (v: number | null) => (v == null ? null : round(v));

export function buildSnapshot(bars: Bar[]): Snapshot {
  const closes = bars.map((b) => b.close);
  const vols = bars.map((b) => b.volume);
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2] ?? last;
  const n = closes.length;

  const ma20 = sma(closes, 20)[n - 1];
  let bollinger: Snapshot["bollinger"] = null;
  if (ma20 != null) {
    const win = closes.slice(-20);
    const sd = Math.sqrt(win.reduce((s, v) => s + (v - ma20) ** 2, 0) / 20);
    bollinger = { upper: round(ma20 + 2 * sd), middle: round(ma20), lower: round(ma20 - 2 * sd) };
  }

  const m = macd(closes);
  const k = kd(bars);
  const avg20 = sma(vols, 20)[n - 1];
  const hiBar = bars.reduce((a, b) => (b.high > a.high ? b : a));
  const loBar = bars.reduce((a, b) => (b.low < a.low ? b : a));

  return {
    date: last.date,
    close: round(last.close),
    change: round(last.close - prev.close),
    changePct: pct(prev.close, last.close) ?? 0,
    returns: {
      d5: pct(closes[n - 6], last.close),
      d20: pct(closes[n - 21], last.close),
      d60: pct(closes[n - 61], last.close),
      y1: pct(closes[0], last.close),
    },
    ma: { ma5: r(sma(closes, 5)[n - 1]), ma20: r(ma20), ma60: r(sma(closes, 60)[n - 1]) },
    rsi14: r(rsi(closes)),
    macd: m && { dif: round(m.dif, 3), dea: round(m.dea, 3), hist: round(m.hist, 3) },
    kd: k && { k: round(k.k), d: round(k.d) },
    bollinger,
    volume: { last: last.volume, avg20: avg20 == null ? null : Math.round(avg20), ratio: avg20 ? round(last.volume / avg20) : null },
    range: { high: round(hiBar.high), low: round(loBar.low), highDate: hiBar.date, lowDate: loBar.date },
    levels: levels(bars, last.close),
  };
}
