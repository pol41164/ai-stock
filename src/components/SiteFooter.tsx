import Link from "next/link";
import Logo from "./Logo";

const COLUMNS = [
  {
    title: "產品",
    links: [
      { href: "/analyst", label: "開始分析" },
      { href: "/#features", label: "功能" },
      { href: "/#how", label: "運作方式" },
    ],
  },
  {
    title: "了解更多",
    links: [
      { href: "/#principles", label: "分析原則" },
      { href: "/#faq", label: "常見問題" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-panel/40">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            用 AI 讀懂歷史股價與技術指標。專注客觀解讀與教育，不提供任何投資建議。
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="flex flex-col gap-3 text-sm">
            <p className="font-medium text-fg">{col.title}</p>
            {col.links.map((l) => (
              <Link key={l.href} href={l.href} className="text-muted transition hover:text-fg">
                {l.label}
              </Link>
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 text-xs leading-relaxed text-muted md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl">
            免責聲明：本服務僅提供歷史數據分析與技術指標的教育性解讀，不構成任何投資建議或未來走勢預測。技術分析有其局限性與不確定性，投資決策請自行判斷並承擔風險。股價資料來源：Yahoo Finance。
          </p>
          <p className="shrink-0">© 2026 Candle</p>
        </div>
      </div>
    </footer>
  );
}
