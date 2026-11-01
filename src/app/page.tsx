import Link from "next/link";

const FEATURES = [
  {
    no: "01",
    title: "價格走勢與指標狀態",
    body: "客觀描述近一年的價格走勢，並解讀 MA、RSI、KD、MACD、布林通道目前所處的位置。",
    tags: ["MA5 / 20 / 60", "RSI(14)", "KD(9,3,3)", "MACD", "布林通道"],
  },
  {
    no: "02",
    title: "成交量變化模式",
    body: "對照 20 日均量與量比，找出放量、縮量出現的時間點，以及當時價格的反應。",
    tags: ["量比", "20 日均量"],
  },
  {
    no: "03",
    title: "歷史支撐與阻力",
    body: "從近 120 個交易日的波段高低點中，整理出現價上下方的關鍵歷史價位。",
    tags: ["波段高低點", "一年區間"],
  },
  {
    no: "04",
    title: "技術分析教育",
    body: "每個術語第一次出現就解釋，讓你不只看到結論，也理解指標怎麼計算、該怎麼讀。",
    tags: ["白話解說"],
  },
];

const STEPS = [
  { title: "設定金鑰並輸入股票", body: "第一次使用先在「設定」貼上你的 OpenAI API Key。輸入代碼或公司名稱都可以，例如 2330、台積電、AAPL、Apple。" },
  { title: "提出你的問題", body: "想了解走勢、指標、量能或支撐阻力都可以，也能直接點選範例問題。" },
  { title: "閱讀即時分析", body: "系統抓取一年日線、計算指標，AI 分析師以繁體中文逐字回覆。" },
];

const PRINCIPLES = [
  ["只談歷史，不做預測", "不給目標價、不說會漲會跌，只說明數據已經呈現的狀態。"],
  ["絕不提供投資建議", "被問到「該不該買」時，會明確說明無法建議，並改為客觀解讀。"],
  ["完全客觀中立", "只根據實際數據回答，不編造數據中沒有的數字或新聞。"],
  ["提醒局限性", "每次回答都附上技術分析局限性與不確定性的說明。"],
];

const FAQ = [
  ["可以查哪些股票？", "台股上市、上櫃股票與 ETF，以及美股。可以輸入代碼，也可以輸入公司名稱：台股用中文名稱（台積電），美股用英文名稱（Apple）。分析結果會清楚標示辨識出的公司。"],
  ["資料從哪裡來？多新？", "股價來自 Yahoo Finance 的日線資料，涵蓋最近一年，以最近一個交易日的收盤為準。"],
  ["分析結果可以當作買賣依據嗎？", "不行。所有內容僅供教育與研究，不構成任何投資建議。技術分析本身有局限性，請自行判斷。"],
  ["需要註冊或付費嗎？", "不需要註冊。Candle 採用自備金鑰（BYOK）模式：在「設定」輸入你自己的 OpenAI API Key，分析費用由你的 OpenAI 帳戶支付。"],
  ["我的 API Key 安全嗎？", "金鑰只存在你自己瀏覽器的 localStorage，分析時隨請求轉送給 OpenAI，伺服器不會保存或記錄。在公用電腦上使用後，記得到「設定」清除金鑰。"],
];

// 首頁示意圖用的價格曲線（固定資料，非真實行情）
const DEMO = [42, 44, 43, 47, 46, 50, 49, 53, 52, 55, 58, 56, 60, 59, 63, 61, 64, 62, 58, 60, 57, 55, 57, 54, 56, 59, 58, 61, 60, 63];

function demoPath(width: number, height: number) {
  const min = Math.min(...DEMO) - 2;
  const max = Math.max(...DEMO) + 2;
  return DEMO.map((v, i) => {
    const x = (i / (DEMO.length - 1)) * width;
    const y = height - ((v - min) / (max - min)) * height;
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function Home() {
  const line = demoPath(560, 180);

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid pointer-events-none absolute inset-0" />
        <div className="bg-glow pointer-events-none absolute inset-0" />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-5 pt-20 pb-16 text-center md:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-panel/60 px-3.5 py-1 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-accent" />
            AI 技術分析 · 僅供教育用途
          </span>
          <h1 className="mt-7 max-w-4xl font-serif text-4xl leading-[1.15] font-bold tracking-tight sm:text-6xl">
            讀懂 K 線背後的
            <br />
            <span className="text-accent">每一個數字</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            輸入股票代碼，用自己的話提問。AI 分析師會根據一年的歷史數據與技術指標，用你看得懂的方式，客觀說明市場已經發生了什麼。
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/analyst"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 font-medium text-ink transition hover:bg-white"
            >
              開始分析
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center justify-center rounded-full border border-line-strong px-7 py-3.5 font-medium text-fg transition hover:bg-white/5"
            >
              看看怎麼運作
            </Link>
          </div>

          {/* 產品示意 */}
          <div className="relative mt-16 w-full max-w-4xl">
            <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[40px] bg-accent/10 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-line-strong bg-panel text-left shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="size-2.5 rounded-full bg-white/15" />
                <span className="ml-3 font-mono text-xs text-muted">candle.app/analyst</span>
              </div>
              <div className="grid md:grid-cols-[1.35fr_1fr]">
                <div className="border-b border-line p-6 md:border-r md:border-b-0">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="text-sm text-muted">示意股票 · DEMO</p>
                      <p className="mt-1 font-mono text-3xl font-medium">
                        63.00 <span className="text-sm text-up">▲ 2.10%</span>
                      </p>
                    </div>
                    <div className="flex gap-1.5 font-mono text-[11px]">
                      {["1M", "3M", "1Y"].map((r, i) => (
                        <span key={r} className={`rounded-md px-2 py-1 ${i === 2 ? "bg-white/10 text-fg" : "text-muted"}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                  <svg viewBox="0 0 560 200" className="mt-6 h-44 w-full" preserveAspectRatio="none" aria-hidden>
                    <defs>
                      <linearGradient id="demo-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4f25c" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#d4f25c" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {[40, 90, 140].map((y) => (
                      <line key={y} x1="0" x2="560" y1={y} y2={y} stroke="rgb(255 255 255 / 0.06)" strokeDasharray="4 6" />
                    ))}
                    <line x1="0" x2="560" y1="62" y2="62" stroke="#ff6b6b" strokeOpacity="0.5" strokeDasharray="2 4" />
                    <line x1="0" x2="560" y1="128" y2="128" stroke="#34d399" strokeOpacity="0.5" strokeDasharray="2 4" />
                    <path d={`${line} L560,200 L0,200 Z`} fill="url(#demo-fill)" />
                    <path d={line} fill="none" stroke="#d4f25c" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />
                  </svg>
                  <div className="mt-4 flex flex-wrap gap-2 font-mono text-[11px]">
                    {[
                      ["RSI", "58.4"],
                      ["K/D", "64 / 59"],
                      ["MACD", "+0.42"],
                      ["量比", "1.32"],
                    ].map(([k, v]) => (
                      <span key={k} className="rounded-md border border-line bg-panel-2 px-2 py-1">
                        <span className="text-muted">{k}</span> {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-4 p-6 text-sm">
                  <div className="self-end rounded-2xl rounded-br-sm bg-white/8 px-4 py-2.5 text-fg">近期的 KD 和量能代表什麼？</div>
                  <div className="flex gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-ink">
                      AI
                    </span>
                    <div className="space-y-2 leading-relaxed text-muted">
                      <p>
                        <span className="text-fg">KD 指標</span>（隨機指標）目前 K 值 64、D 值 59，K 位於 D 之上，處於中性偏高的區間……
                      </p>
                      <p>
                        最新成交量為 20 日均量的 <span className="text-fg">1.32 倍</span>，屬於溫和放量……
                      </p>
                      <p className="flex items-center gap-1.5 text-xs">
                        <span className="inline-block h-3 w-1.5 animate-pulse bg-accent" />
                        正在分析
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-muted">畫面為示意，數據非真實行情</p>
          </div>
        </div>
      </section>

      {/* 數字 */}
      <section className="border-y border-line bg-panel/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4">
          {[
            ["6", "種技術指標"],
            ["1 年", "日線歷史資料"],
            ["台股 + 美股", "上市櫃自動判斷"],
            ["0", "則投資建議"],
          ].map(([n, l], i) => (
            <div key={l} className={`px-5 py-8 text-center ${i > 0 ? "md:border-l" : ""} ${i % 2 ? "border-l" : ""} ${i > 1 ? "border-t md:border-t-0" : ""} border-line`}>
              <p className="font-serif text-3xl font-bold text-fg">{n}</p>
              <p className="mt-1 text-sm text-muted">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 功能 */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <SectionTitle eyebrow="功能" title="一位隨時待命的技術分析老師" desc="針對你的問題，從四個面向拆解一檔股票的歷史表現。" />
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.no} className="group relative overflow-hidden rounded-2xl border border-line bg-panel p-7 transition hover:border-line-strong">
              <div className="pointer-events-none absolute -top-24 -right-24 size-48 rounded-full bg-accent/0 blur-3xl transition group-hover:bg-accent/15" />
              <p className="font-mono text-sm text-accent">{f.no}</p>
              <h3 className="mt-4 text-xl font-bold">{f.title}</h3>
              <p className="mt-3 leading-relaxed text-muted">{f.body}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {f.tags.map((t) => (
                  <span key={t} className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 運作方式 */}
      <section id="how" className="scroll-mt-20 border-y border-line bg-panel/40">
        <div className="mx-auto max-w-6xl px-5 py-24">
          <SectionTitle eyebrow="運作方式" title="三個步驟，三十秒得到解讀" />
          <ol className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex flex-col gap-4 bg-ink p-8">
                <span className="flex size-10 items-center justify-center rounded-full border border-accent/40 font-mono text-accent">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p className="leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 分析原則 */}
      <section id="principles" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24">
        <div className="grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-16">
          <div>
            <SectionTitle align="left" eyebrow="分析原則" title="我們刻意不告訴你該買什麼" />
            <p className="mt-6 leading-relaxed text-muted">
              市場上不缺明牌。Candle 選擇把力氣放在「看懂」：幫你把數據翻譯成清楚的描述，判斷則留給你自己。
            </p>
          </div>
          <ul className="flex flex-col divide-y divide-line border-y border-line">
            {PRINCIPLES.map(([t, d]) => (
              <li key={t} className="flex gap-5 py-6">
                <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs text-accent">✓</span>
                <div>
                  <p className="font-bold">{t}</p>
                  <p className="mt-1.5 leading-relaxed text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t border-line bg-panel/40">
        <div className="mx-auto max-w-3xl px-5 py-24">
          <SectionTitle eyebrow="常見問題" title="你可能想知道" />
          <div className="mt-12 flex flex-col gap-3">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group rounded-xl border border-line bg-ink px-6 py-5 open:border-line-strong">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-6xl px-5 py-24">
        <div className="relative overflow-hidden rounded-3xl border border-line-strong bg-panel px-8 py-16 text-center">
          <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative">
            <h2 className="font-serif text-3xl font-bold sm:text-4xl">挑一檔你關心的股票，現在就問</h2>
            <p className="mx-auto mt-4 max-w-md text-muted">不用註冊，帶上你的 OpenAI API Key，輸入代碼就開始。</p>
            <Link
              href="/analyst"
              className="group mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 font-medium text-ink transition hover:bg-white"
            >
              開始分析
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionTitle({
  eyebrow,
  title,
  desc,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  desc?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-3xl leading-tight font-bold sm:text-4xl">{title}</h2>
      {desc && <p className="mt-4 leading-relaxed text-muted">{desc}</p>}
    </div>
  );
}
