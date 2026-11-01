"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { API_KEY_HEADER, getApiKey, openSettings, useApiKey } from "@/lib/apiKey";
import type { Snapshot } from "@/lib/indicators";

type Meta = {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  model: string;
  snapshot: Snapshot;
  closes: number[];
};

const EXAMPLE_QUESTIONS = [
  "近三個月的價格走勢與均線排列如何？",
  "RSI、KD、MACD 目前呈現什麼狀態？",
  "近期成交量有什麼變化模式？",
  "歷史上有哪些支撐與阻力價位？",
];

const POPULAR = ["2330", "0050", "2454", "AAPL", "NVDA", "TSLA"];

export default function StockAnalyst() {
  const [symbol, setSymbol] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const apiKey = useApiKey();
  const missingKey = apiKey === "";

  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const key = getApiKey();
    if (!key) {
      openSettings();
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setAnswer("");
    setMeta(null);

    try {
      const res = await fetch("/api/stock-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json", [API_KEY_HEADER]: key },
        body: JSON.stringify({ symbol, question }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 401) openSettings(); // 金鑰缺少或無效，直接打開設定讓使用者修正
        throw new Error(data.error ?? `發生錯誤（HTTP ${res.status}）`);
      }
      const rawMeta = res.headers.get("X-Stock-Meta");
      if (rawMeta) setMeta(JSON.parse(decodeURIComponent(rawMeta)) as Meta);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setAnswer((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof TypeError ? "無法連線到伺服器，請確認伺服器是否啟動。" : (err as Error).message);
      }
    } finally {
      if (abortRef.current === controller) setLoading(false);
    }
  }

  const canSubmit = symbol.trim() !== "" && question.trim() !== "" && !loading;

  return (
    <div className="flex flex-col gap-6">
      {missingKey && (
        <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent/[0.06] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm text-accent">🔑</span>
            <div>
              <p className="font-medium">先設定你的 OpenAI API Key</p>
              <p className="mt-0.5 text-sm text-muted">金鑰只會存在你的瀏覽器，分析費用由你的 OpenAI 帳戶支付。</p>
            </div>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="shrink-0 rounded-full bg-accent px-5 py-2 text-sm font-medium text-ink transition hover:bg-white"
          >
            前往設定
          </button>
        </div>
      )}

      <form onSubmit={analyze} className="rounded-2xl border border-line-strong bg-panel/90 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="grid gap-5 p-6 sm:grid-cols-[200px_1fr]">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted">股票代碼</span>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="2330 / AAPL"
              autoComplete="off"
              className="rounded-xl border border-line bg-ink px-4 py-3 font-mono text-lg uppercase outline-none placeholder:text-white/25 placeholder:normal-case focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
            />
            <div className="flex flex-wrap gap-1.5">
              {POPULAR.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSymbol(p)}
                  className={`rounded-md px-2 py-0.5 font-mono text-[11px] transition ${
                    symbol.toUpperCase() === p ? "bg-accent text-ink" : "bg-white/5 text-muted hover:text-fg"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium tracking-wide text-muted">你的問題</span>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit) e.currentTarget.form?.requestSubmit();
              }}
              rows={3}
              maxLength={1000}
              placeholder="想了解這檔股票的哪個面向？"
              className="resize-y rounded-xl border border-line bg-ink px-4 py-3 leading-relaxed outline-none placeholder:text-white/25 focus:border-accent/60 focus:ring-4 focus:ring-accent/10"
            />
          </label>
        </div>

        <div className="flex flex-col gap-4 border-t border-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-accent/50 hover:text-fg"
              >
                {q}
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 font-medium text-ink transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
          >
            {loading ? (
              <>
                <span className="size-3.5 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
                分析中
              </>
            ) : (
              <>
                開始分析 <span className="text-xs opacity-60">Ctrl ↵</span>
              </>
            )}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-up/30 bg-up/10 px-5 py-4 text-sm text-up">
          {error}
        </p>
      )}

      {loading && !meta && <SkeletonCard />}

      {meta && <SnapshotCard meta={meta} />}

      {(answer || (loading && meta)) && (
        <article className="rounded-2xl border border-line bg-panel">
          <div className="flex items-center justify-between border-b border-line px-6 py-3.5">
            <div className="flex items-center gap-2.5 text-sm">
              <span className="flex size-6 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-ink">AI</span>
              分析師回覆
            </div>
            {meta && (
              <span className="flex items-center gap-2 font-mono text-[11px] text-muted">
                {loading && <span className="size-1.5 animate-pulse rounded-full bg-accent" />}
                {loading ? "撰寫中" : meta.model}
              </span>
            )}
          </div>
          <div className="prose prose-invert max-w-none px-6 py-6 prose-headings:font-serif prose-headings:text-fg prose-h2:mt-8 prose-h2:mb-3 prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-p:text-fg/85 prose-strong:text-accent prose-li:text-fg/85 prose-li:marker:text-accent/70 prose-table:text-sm prose-th:text-muted prose-hr:border-line">
            {answer ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
            ) : (
              <p className="animate-pulse text-muted">分析師正在整理數據…</p>
            )}
          </div>
        </article>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-line bg-panel p-6">
      <div className="h-5 w-40 rounded bg-white/8" />
      <div className="mt-3 h-3 w-56 rounded bg-white/5" />
      <div className="mt-6 h-24 rounded-lg bg-white/5" />
      <p className="mt-4 text-sm text-muted">正在取得歷史數據並計算技術指標…</p>
    </div>
  );
}

function Sparkline({ values, up }: { values: number[]; up: boolean }) {
  if (values.length < 2) return null;
  const w = 600;
  const h = 120;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${((i / (values.length - 1)) * w).toFixed(1)},${(h - 6 - ((v - min) / span) * (h - 12)).toFixed(1)}`)
    .join(" ");
  const color = up ? "#ff6b6b" : "#34d399";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-28 w-full" aria-label="近 120 個交易日收盤價走勢">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function SnapshotCard({ meta }: { meta: Meta }) {
  const s = meta.snapshot;
  const up = s.change > 0;
  const down = s.change < 0;
  // 台股習慣紅漲綠跌
  const color = up ? "text-up" : down ? "text-down" : "text-muted";
  const n = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString());
  const closes = meta.closes ?? [];
  const periodUp = closes.length > 1 && closes[closes.length - 1] >= closes[0];

  const items: [string, string][] = [
    ["MA5 / 20 / 60", `${n(s.ma.ma5)} / ${n(s.ma.ma20)} / ${n(s.ma.ma60)}`],
    ["RSI(14)", n(s.rsi14)],
    ["K / D", s.kd ? `${s.kd.k} / ${s.kd.d}` : "—"],
    ["MACD 柱狀體", s.macd ? String(s.macd.hist) : "—"],
    ["一年高 / 低", `${n(s.range.high)} / ${n(s.range.low)}`],
    ["量比", n(s.volume.ratio)],
  ];

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-panel">
      <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6">
        <div>
          <p className="font-mono text-xs text-muted">
            {meta.symbol} · {meta.exchange}
          </p>
          <h2 className="mt-1.5 text-xl font-bold">{meta.name}</h2>
        </div>
        <div className="text-right">
          <p className="font-mono text-3xl font-medium tabular-nums">
            {s.close.toLocaleString()} <span className="text-sm text-muted">{meta.currency}</span>
          </p>
          <p className={`font-mono text-sm tabular-nums ${color}`}>
            {up ? "▲" : down ? "▼" : "—"} {Math.abs(s.change)}（{s.changePct}%）
          </p>
        </div>
      </div>
      <div className="mt-4 px-2">
        <Sparkline values={closes} up={periodUp} />
      </div>
      <div className="flex justify-between px-6 pb-4 font-mono text-[11px] text-muted">
        <span>近 {closes.length} 個交易日</span>
        <span>{s.date} 收盤</span>
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3">
        {items.map(([label, value]) => (
          <div key={label} className="bg-panel px-6 py-4">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-sm tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
