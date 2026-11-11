import { ArrowLeftRight, Plus } from 'lucide-react'
import { useState } from 'react'
import type { HangyuState, QuantWatchItem } from '../types'

interface FinanceQuantModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

export function FinanceQuantModule({ state, updateState }: FinanceQuantModuleProps) {
  const [tab, setTab] = useState<'资产与汇率潮汐' | 'IDX量化观察池' | '收支流水'>('资产与汇率潮汐')
  const [cnyAmount, setCnyAmount] = useState(10000)

  // Ledger form
  const [entryTitle, setEntryTitle] = useState('')
  const [entryType, setEntryType] = useState<'收入' | '支出'>('支出')
  const [entryAmount, setEntryAmount] = useState(500)
  const [entryCat, setEntryCat] = useState('日常经营与生活')

  // Quant form
  const [ticker, setTicker] = useState('')
  const [costPrice, setCostPrice] = useState(5000)
  const [currentPrice, setCurrentPrice] = useState(5350)
  const [shares, setShares] = useState(2000)

  const totalIncome = state.ledger
    .filter((l) => l.type === '收入')
    .reduce((acc, l) => acc + l.amountCny, 0)
  const totalExpense = state.ledger
    .filter((l) => l.type === '支出')
    .reduce((acc, l) => acc + l.amountCny, 0)
  const netBalance = totalIncome - totalExpense

  const idrConverted = Math.round(cnyAmount * state.settings.fxRates.cnyToIdr)
  const usdConverted = (cnyAmount / state.settings.fxRates.usdToCny).toFixed(2)

  const addLedgerEntry = () => {
    if (!entryTitle.trim() || entryAmount <= 0) return
    updateState((prev) => ({
      ...prev,
      ledger: [
        {
          id: `l-${Date.now()}`,
          title: entryTitle.trim(),
          type: entryType,
          amountCny: entryAmount,
          category: entryCat,
          account: '主账本',
          date: '2026-11-11',
        },
        ...prev.ledger,
      ],
    }))
    setEntryTitle('')
  }

  const addQuantTicker = () => {
    if (!ticker.trim()) return
    const item: QuantWatchItem = {
      id: `q-${Date.now()}`,
      ticker: ticker.trim().toUpperCase(),
      market: 'IDX · LQ45',
      name: '自选观察标的',
      fastSma: 10,
      slowSma: 30,
      costPrice,
      currentPrice,
      shares,
      currency: 'IDR',
      signal: currentPrice >= costPrice ? '多头金叉' : '震荡持有',
    }
    updateState((prev) => ({ ...prev, quantWatch: [item, ...prev.quantWatch] }))
    setTicker('')
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            PRIVATE LEDGER & QUANT RADAR / 本地私密账本
          </div>
          <h3 className="m-0 mt-0.5 text-[22px] font-bold text-[var(--text-primary)]">
            财务与汇率潮汐
          </h3>
        </div>

        <div className="inline-flex rounded-2xl bg-black/5 p-1 dark:bg-white/5">
          {(['资产与汇率潮汐', 'IDX量化观察池', '收支流水'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-xl px-4 py-1.5 text-[12px] font-semibold transition ${
                tab === t
                  ? 'bg-white text-[var(--text-primary)] shadow-xs dark:bg-slate-800'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === '资产与汇率潮汐' && (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Dark Teal Hero Card matching Image 8 */}
            <div className="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#163d4a] via-[#1d4f5f] to-[#13323d] p-6 text-white shadow-lg lg:col-span-7">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11.5px] text-white/70">本月净结余（人民币口径）</div>
                  <div className="tabular-nums mt-1 text-[32px] font-bold">
                    ¥{netBalance.toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-white/70">折合印尼盾参考</div>
                  <div className="tabular-nums mt-1 text-[16px] font-semibold text-sky-200">
                    Rp {Math.round(netBalance * state.settings.fxRates.cnyToIdr).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="my-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/15 bg-white/8 p-3.5">
                  <div className="text-[11px] text-white/70">本月总流入</div>
                  <div className="tabular-nums mt-1 text-[18px] font-bold text-emerald-300">
                    +¥{totalIncome.toLocaleString()}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/8 p-3.5">
                  <div className="text-[11px] text-white/70">本月总流出</div>
                  <div className="tabular-nums mt-1 text-[18px] font-bold text-amber-200">
                    -¥{totalExpense.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-white/65">
                只记录真实发生金额，全部财务与证券持仓模拟数据仅保存在本设备。
              </div>
            </div>

            {/* BOC IDR Cross-border Converter */}
            <div className="glass-subcard flex flex-col justify-between rounded-3xl p-5 lg:col-span-5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">
                    跨境汇率即时换算舱
                  </span>
                  <ArrowLeftRight className="h-4 w-4 text-[var(--accent-primary)]" />
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                  早间 06:15 外币对 IDR 牌价参考锚点（支持手动微调）
                </div>
              </div>

              <div className="my-3 flex flex-col gap-2.5">
                <div>
                  <label className="text-[11px] text-[var(--text-muted)]">输入人民币 (CNY)</label>
                  <input
                    type="number"
                    value={cnyAmount}
                    onChange={(e) => setCnyAmount(Number(e.target.value))}
                    className="glass-card tabular-nums mt-1 w-full rounded-xl px-3.5 py-2 text-[15px] font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-[10.5px] text-[var(--text-muted)]">折合印尼盾 (IDR)</div>
                    <div className="tabular-nums mt-1 text-[14px] font-bold text-[var(--accent-primary)]">
                      Rp {idrConverted.toLocaleString()}
                    </div>
                  </div>
                  <div className="glass-card rounded-xl p-3">
                    <div className="text-[10.5px] text-[var(--text-muted)]">折合美元 (USD)</div>
                    <div className="tabular-nums mt-1 text-[14px] font-bold text-[var(--text-primary)]">
                      ${usdConverted}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--glass-inner-border)] pt-2.5 text-[11px] text-[var(--text-muted)]">
                <span>1 CNY = {state.settings.fxRates.cnyToIdr} IDR</span>
                <span>1 USD = {state.settings.fxRates.usdToIdr} IDR</span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'IDX量化观察池' && (
        <div className="flex flex-col gap-4">
          <div className="glass-subcard rounded-3xl p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="m-0 text-[15px] font-bold text-[var(--text-primary)]">
                  IDX · LQ45 均线策略与持仓成本核算板
                </h4>
                <div className="text-[11.5px] text-[var(--text-muted)]">
                  联动 IDXQTS 双均线思维，含千分之 2 双边佣金滑点安全垫估算
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {state.quantWatch.map((q) => {
                const grossPnl = (q.currentPrice - q.costPrice) * q.shares
                const feeCost = (q.currentPrice + q.costPrice) * q.shares * 0.002
                const netPnl = Math.round(grossPnl - feeCost)
                const pnlPct = (((q.currentPrice - q.costPrice) / Math.max(1, q.costPrice)) * 100).toFixed(2)
                const positive = netPnl >= 0

                return (
                  <div key={q.id} className="glass-card rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[15px] font-bold text-[var(--text-primary)]">
                        {q.ticker}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10.5px] font-semibold ${
                          q.signal === '多头金叉'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : q.signal === '震荡持有'
                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                              : 'bg-rose-500/15 text-rose-500'
                        }`}
                      >
                        {q.signal}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {q.name} · SMA({q.fastSma}/{q.slowSma})
                    </div>

                    <div className="my-3 grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">买入成本</div>
                        <div className="tabular-nums font-semibold">{q.costPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10.5px] text-[var(--text-muted)]">最新现价</div>
                        <div className="tabular-nums font-semibold">
                          {q.currentPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[var(--glass-inner-border)] pt-2.5 text-[12px]">
                      <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">扣费净浮动盈亏</span>
                        <span
                          className={`tabular-nums font-bold ${
                            positive ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {positive ? '+' : ''}
                          {netPnl.toLocaleString()} {q.currency} ({positive ? '+' : ''}
                          {pnlPct}%)
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="glass-subcard rounded-3xl p-5">
            <div className="mb-2.5 text-[14px] font-bold text-[var(--text-primary)]">
              新增持仓成本与盈亏测算标的
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value)}
                placeholder="代码 如 ASII.JK"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
              />
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                placeholder="买入均价"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
              />
              <input
                type="number"
                value={currentPrice}
                onChange={(e) => setCurrentPrice(Number(e.target.value))}
                placeholder="当前价格"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
              />
              <input
                type="number"
                value={shares}
                onChange={(e) => setShares(Number(e.target.value))}
                placeholder="持股数量"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
              />
              <button
                type="button"
                onClick={addQuantTicker}
                className="btn-teal flex cursor-pointer items-center justify-center gap-1 rounded-xl py-2 text-[12.5px] font-medium"
              >
                <Plus className="h-4 w-4" />
                <span>加入测算</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === '收支流水' && (
        <div className="flex flex-col gap-4">
          <div className="glass-subcard rounded-3xl p-5">
            <div className="mb-3 text-[14px] font-bold text-[var(--text-primary)]">记一笔流水</div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <input
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="款项说明..."
                className="glass-card rounded-xl px-3.5 py-2 text-[12.5px] outline-none sm:col-span-5"
              />
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as '收入' | '支出')}
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
              >
                <option value="支出">支出</option>
                <option value="收入">收入</option>
              </select>
              <input
                type="number"
                value={entryAmount}
                onChange={(e) => setEntryAmount(Number(e.target.value))}
                placeholder="金额 (CNY)"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
              />
              <input
                value={entryCat}
                onChange={(e) => setEntryCat(e.target.value)}
                placeholder="分类"
                className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-3"
              />
              <button
                type="button"
                onClick={addLedgerEntry}
                className="btn-teal cursor-pointer rounded-xl py-2 text-[12.5px] font-medium sm:col-span-12"
              >
                保存账目记录
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {state.ledger.map((item) => (
              <div
                key={item.id}
                className="glass-subcard flex items-center justify-between rounded-2xl px-4 py-3"
              >
                <div>
                  <div className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {item.date} · {item.category} · {item.account}
                  </div>
                </div>
                <div
                  className={`tabular-nums text-[15px] font-bold ${
                    item.type === '收入' ? 'text-emerald-500' : 'text-[var(--text-primary)]'
                  }`}
                >
                  {item.type === '收入' ? '+' : '-'}¥{item.amountCny.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
