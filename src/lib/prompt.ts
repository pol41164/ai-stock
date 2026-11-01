// 股票分析師的系統提示詞與使用者訊息組裝
import type { Snapshot } from "./indicators";
import type { StockHistory } from "./stock";

export const SYSTEM_PROMPT = `你是一位專業的股票技術分析教育者（Stock Analyst）。使用者會提供一檔股票的歷史交易數據與技術指標，並提出問題。請針對問題，視需要涵蓋以下面向：

1. 客觀描述股票價格的歷史走勢和技術指標狀態
2. 解讀歷史市場數據和交易量變化模式
3. 識別技術面的歷史支撐阻力位
4. 提供純教育性的技術分析知識

重要原則：
- 僅提供歷史數據分析和技術指標解讀，絕不提供任何投資建議或預測
- 不說「建議買進 / 賣出 / 持有」、不給目標價、不預測未來漲跌；若問題中包含這類要求（例如「該不該買」「會漲嗎」），請在回答開頭先明確說明無法提供投資建議或預測，再改為說明歷史數據呈現的狀態
- 保持完全客觀中立的分析態度
- 使用專業術語但保持易懂，第一次出現的術語請簡短解釋
- 所有分析僅供教育和研究目的
- 強調技術分析的局限性和不確定性
- 只根據提供的數據回答，不要編造數據中沒有的數字或新聞
- 使用繁體中文回答

格式：使用 Markdown，以小標題分段，引用具體日期與數值。結尾加上一段「技術分析的局限性」提醒，並註明本內容僅供教育與研究用途，不構成投資建議。`;

const fmt = (v: number | null | undefined) => (v == null ? "資料不足" : String(v));

export function buildUserPrompt(stock: StockHistory, s: Snapshot, question: string): string {
  const recent = stock.bars
    .slice(-60)
    .map((b) => `${b.date},${b.open},${b.high},${b.low},${b.close},${b.volume}`)
    .join("\n");

  return `股票：${stock.name}（${stock.symbol}），交易所：${stock.exchange}，幣別：${stock.currency}
資料期間：${stock.bars[0].date} ～ ${s.date}（共 ${stock.bars.length} 個交易日）

【最新收盤】${s.date} 收盤 ${s.close}，漲跌 ${s.change}（${s.changePct}%）
【區間漲跌幅】近 5 日 ${fmt(s.returns.d5)}%、近 20 日 ${fmt(s.returns.d20)}%、近 60 日 ${fmt(s.returns.d60)}%、近一年 ${fmt(s.returns.y1)}%
【一年區間】最高 ${s.range.high}（${s.range.highDate}）、最低 ${s.range.low}（${s.range.lowDate}）
【移動平均】MA5 ${fmt(s.ma.ma5)}、MA20 ${fmt(s.ma.ma20)}、MA60 ${fmt(s.ma.ma60)}
【RSI(14)】${fmt(s.rsi14)}
【MACD(12,26,9)】${s.macd ? `DIF ${s.macd.dif}、DEA ${s.macd.dea}、柱狀體 ${s.macd.hist}` : "資料不足"}
【KD(9,3,3)】${s.kd ? `K ${s.kd.k}、D ${s.kd.d}` : "資料不足"}
【布林通道(20,2)】${s.bollinger ? `上軌 ${s.bollinger.upper}、中軌 ${s.bollinger.middle}、下軌 ${s.bollinger.lower}` : "資料不足"}
【成交量】最新 ${s.volume.last}、20 日均量 ${fmt(s.volume.avg20)}、量比 ${fmt(s.volume.ratio)}
【近 120 日波段高低點】高於現價的歷史高點：${s.levels.resistance.join("、") || "無"}；低於現價的歷史低點：${s.levels.support.join("、") || "無"}

【近 60 個交易日明細】
date,open,high,low,close,volume
${recent}

使用者的問題：${question}`;
}
