import type { Metadata } from "next";
import StockAnalyst from "@/components/StockAnalyst";

export const metadata: Metadata = {
  title: "開始分析 · Candle",
};

export default function AnalystPage() {
  return (
    <main className="relative flex-1">
      <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="bg-glow pointer-events-none absolute inset-x-0 top-0 h-[480px]" />
      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-14">
        <header>
          <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">Analyst</p>
          <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">AI 股票分析師</h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            輸入股票代碼並提出問題，分析師會根據近一年的歷史交易數據與技術指標，提供客觀的技術面解讀。
          </p>
        </header>
        <StockAnalyst />
      </div>
    </main>
  );
}
