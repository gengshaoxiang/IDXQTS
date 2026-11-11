import { useState } from 'react'

interface ToolboxModuleProps {
  onOpenFloatingTimer: () => void
}

type ToolId = 'calc' | 'speech' | 'timezone' | 'espresso' | 'json'

const TOOLS: { id: ToolId; code: string; title: string; desc: string }[] = [
  { id: 'calc', code: '算', title: '科学计算器', desc: '函数、财务与快速比例推演' },
  { id: 'speech', code: '讲', title: '逐页讲稿语速测算', desc: '字数统计与高管会议照读时长估算' },
  { id: 'timezone', code: '时', title: '跨国四地时区罗盘', desc: '雅加达 / 北京 / 东非 / 圣保罗排会校准' },
  { id: 'espresso', code: '咖', title: '意式浓缩萃豆实验台', desc: '粉液比、萃取秒数与风味修正建议' },
  { id: 'json', code: '{}', title: 'JSON 格式化校验', desc: 'Agent 配置与自动化任务字段检查' },
]

function safeEvaluateMath(expr: string): string {
  const cleaned = expr
    .replace(/\s+/g, '')
    .replace(/pi/gi, String(Math.PI))
    .replace(/sqrt\(/gi, 'Math.sqrt(')
    .replace(/sin\(/gi, 'Math.sin((Math.PI/180)*')
    .replace(/cos\(/gi, 'Math.cos((Math.PI/180)*')
    .replace(/\^/g, '**')

  if (!/^[0-9+\-*/().,MathsqrtincoPI*]+$/.test(cleaned)) {
    return '表达式格式有误'
  }
  try {
    // Only arithmetic tokens and Math helpers allowed by strict regex above
    const tokens = expr
      .replace(/pi/gi, '3.14159265')
      .replace(/sqrt\(([0-9.]+)\)/gi, (_, n) => String(Math.sqrt(Number(n))))
      .replace(/sin\(([0-9.]+)\)/gi, (_, n) =>
        String(Math.sin((Number(n) * Math.PI) / 180))
      )
      .replace(/cos\(([0-9.]+)\)/gi, (_, n) =>
        String(Math.cos((Number(n) * Math.PI) / 180))
      )
    if (!/^[0-9+\-*/().%\s]+$/.test(tokens)) return '请使用基础算术或单层函数'
    const num = computeSimpleExpression(tokens)
    return Number.isFinite(num) ? String(Number(num.toFixed(6))) : '无法计算'
  } catch {
    return '格式错误'
  }
}

function computeSimpleExpression(input: string): number {
  const s = input.replace(/\s+/g, '')
  let pos = 0

  const parseExpr = (): number => {
    let val = parseTerm()
    while (pos < s.length && (s[pos] === '+' || s[pos] === '-')) {
      const op = s[pos++]
      const right = parseTerm()
      val = op === '+' ? val + right : val - right
    }
    return val
  }

  const parseTerm = (): number => {
    let val = parseFactor()
    while (pos < s.length && (s[pos] === '*' || s[pos] === '/' || s[pos] === '%')) {
      const op = s[pos++]
      const right = parseFactor()
      if (op === '*') val *= right
      else if (op === '/') val /= right
      else val %= right
    }
    return val
  }

  const parseFactor = (): number => {
    if (s[pos] === '+') {
      pos++
      return parseFactor()
    }
    if (s[pos] === '-') {
      pos++
      return -parseFactor()
    }
    if (s[pos] === '(') {
      pos++
      const val = parseExpr()
      if (s[pos] === ')') pos++
      return val
    }
    const start = pos
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++
    return Number(s.slice(start, pos) || '0')
  }

  return parseExpr()
}

export function ToolboxModule({ onOpenFloatingTimer }: ToolboxModuleProps) {
  const [activeTool, setActiveTool] = useState<ToolId>('calc')

  // Calc state matching Image 12
  const [expr, setExpr] = useState('sin(30) + sqrt(16)')
  const [calcResult, setCalcResult] = useState('4.5')

  // Speech estimator state
  const [scriptText, setScriptText] = useState(
    '各位同仁，今天我们汇报的核心只有三件事：未来三年做到什么规模、数智化底座怎么建、产销协同按什么规矩跑。'
  )
  const [wpm, setWpm] = useState(215)

  // Timezone slider (UTC hour 0..23)
  const [utcHour, setUtcHour] = useState(7)

  // Espresso lab state
  const [dose, setDose] = useState(18.0)
  const [ratio, setRatio] = useState(2.0)
  const [brewSec, setBrewSec] = useState(28)

  // JSON formatter state
  const [jsonInput, setJsonInput] = useState(
    '{"id":"rizhi-sync","schedule":"07:05","timezone":"Asia/Jakarta","columns":14,"mode":"exact"}'
  )
  const [jsonError, setJsonError] = useState<string | null>(null)

  const calcKeys = [
    ['7', '8', '9', '/', 'sin('],
    ['4', '5', '6', '*', 'cos('],
    ['1', '2', '3', '-', 'sqrt('],
    ['0', '.', '(', ')', '+'],
  ]

  const charCount = scriptText.replace(/\s+/g, '').length
  const estMinutes = (charCount / Math.max(120, wpm)).toFixed(1)

  const formatTzHour = (offset: number) => {
    const h = (utcHour + offset + 24) % 24
    return `${String(h).padStart(2, '0')}:00`
  }

  const targetYield = (dose * ratio).toFixed(1)
  const espressoAdvice =
    brewSec < 23
      ? '流速偏快（偏酸水感）：建议磨豆机调细 0.5 格或微增粉量'
      : brewSec > 33
        ? '流速偏慢（易苦涩过萃）：建议磨豆机调粗 0.5 格'
        : '黄金萃取区间：甜感、醇厚度与坚果黑巧尾韵平衡极佳'

  return (
    <div className="grid min-h-[540px] grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left Tool Rail matching Image 12 */}
      <div className="glass-subcard flex flex-col justify-between rounded-3xl p-4 lg:col-span-4">
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <div className="text-[10.5px] text-[var(--text-muted)]">工具箱</div>
              <div className="text-[14.5px] font-bold text-[var(--text-primary)]">
                随取随用的本机实验台
              </div>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--accent-primary)]">
              6 项
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            {TOOLS.map((t) => {
              const active = activeTool === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTool(t.id)}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition ${
                    active
                      ? 'glass-card ring-2 ring-[var(--accent-primary)]/45'
                      : 'hover:bg-black/4 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="glass-subcard flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-[12px] font-bold text-[var(--accent-primary)]">
                    {t.code}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-bold text-[var(--text-primary)]">
                      {t.title}
                    </div>
                    <div className="truncate text-[11px] text-[var(--text-muted)]">{t.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenFloatingTimer}
          className="btn-teal mt-4 w-full cursor-pointer rounded-2xl py-2.5 text-[12.5px] font-semibold"
        >
          唤起会议悬浮倒计时窗
        </button>
      </div>

      {/* Right Active Utility */}
      <div className="glass-subcard rounded-3xl p-6 lg:col-span-8">
        {activeTool === 'calc' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
                LOCAL UTILITY / 本机安全求值
              </div>
              <h3 className="m-0 mt-0.5 text-[20px] font-bold text-[var(--text-primary)]">
                科学计算器
              </h3>
              <div className="text-[11.5px] text-[var(--text-muted)]">
                支持四则运算、括号、sin(角度)、cos(角度)、sqrt()、pi；纯语法树解析不执行任意脚本。
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-[#193b47] to-[#132c36] p-5 text-white shadow-inner">
              <input
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setCalcResult(safeEvaluateMath(expr))}
                className="w-full bg-transparent font-mono text-[14px] text-sky-200/90 outline-none"
              />
              <div className="tabular-nums mt-4 text-right text-[32px] font-bold tracking-tight">
                {calcResult}
              </div>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {calcKeys.flat().map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setExpr((prev) => prev + k)}
                  className="glass-card cursor-pointer rounded-xl py-3 font-mono text-[13.5px] font-semibold text-[var(--text-primary)] transition hover:bg-[var(--accent-soft)]"
                >
                  {k}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setExpr((prev) => prev + 'pi')}
                className="glass-card cursor-pointer rounded-xl py-3 font-mono text-[13px] font-semibold"
              >
                pi
              </button>
              <button
                type="button"
                onClick={() => setExpr((prev) => prev.slice(0, -1))}
                className="glass-card cursor-pointer rounded-xl py-3 text-[12.5px] font-semibold"
              >
                退格
              </button>
              <button
                type="button"
                onClick={() => {
                  setExpr('')
                  setCalcResult('等待计算')
                }}
                className="glass-card cursor-pointer rounded-xl py-3 text-[12.5px] font-semibold text-rose-500"
              >
                清空
              </button>
              <button
                type="button"
                onClick={() => setCalcResult(safeEvaluateMath(expr))}
                className="nav-pill-active col-span-2 cursor-pointer rounded-xl py-3 text-[15px] font-bold text-white"
              >
                = 计算结果
              </button>
            </div>
          </div>
        )}

        {activeTool === 'speech' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">SPEECH SCRIPT METER</div>
              <h3 className="m-0 mt-0.5 text-[20px] font-bold text-[var(--text-primary)]">
                战略汇报逐页讲稿 · 字数与照读时长测算
              </h3>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              rows={7}
              placeholder="粘贴逐页演讲稿正文..."
              className="glass-card w-full resize-none rounded-2xl p-4 text-[13px] leading-relaxed outline-none"
            />

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-[var(--text-secondary)]">
                汇报语速：{wpm} 字/分钟（沉稳高管语速建议 200–225）
              </span>
              <input
                type="range"
                min={160}
                max={280}
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
                className="flex-1 accent-[var(--accent-primary)]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4">
                <div className="text-[11px] text-[var(--text-muted)]">净字数</div>
                <div className="tabular-nums mt-1 text-[22px] font-bold">{charCount}</div>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <div className="text-[11px] text-[var(--text-muted)]">预计脱稿/照读时长</div>
                <div className="tabular-nums mt-1 text-[22px] font-bold text-[var(--accent-primary)]">
                  {estMinutes} 分钟
                </div>
              </div>
              <div className="glass-card rounded-2xl p-4">
                <div className="text-[11px] text-[var(--text-muted)]">A4 打印预估（12号1.5倍）</div>
                <div className="tabular-nums mt-1 text-[22px] font-bold">
                  {Math.max(1, Math.ceil(charCount / 650))} 页
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTool === 'timezone' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">GLOBAL CAPTAIN CLOCK</div>
              <h3 className="m-0 mt-0.5 text-[20px] font-bold text-[var(--text-primary)]">
                跨国四地时区对齐罗盘
              </h3>
              <div className="text-[12px] text-[var(--text-muted)]">
                拖动滑块挑选各方均处于清醒工作窗口的跨洲会议时间
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={23}
              value={utcHour}
              onChange={(e) => setUtcHour(Number(e.target.value))}
              className="my-2 w-full accent-[var(--accent-primary)]"
            />

            <div className="grid grid-cols-2 gap-3">
              {[
                { city: '雅加达 (WIB · UTC+7)', offset: 7 },
                { city: '北京 / 常州 (CST · UTC+8)', offset: 8 },
                { city: '达累斯萨拉姆 (EAT · UTC+3)', offset: 3 },
                { city: '圣保罗 (BRT · UTC-3)', offset: -3 },
              ].map((z) => {
                const localH = (utcHour + z.offset + 24) % 24
                const goodWindow = localH >= 8 && localH <= 21
                return (
                  <div key={z.city} className="glass-card rounded-2xl p-4">
                    <div className="text-[11.5px] text-[var(--text-muted)]">{z.city}</div>
                    <div className="tabular-nums mt-1 text-[26px] font-bold text-[var(--text-primary)]">
                      {formatTzHour(z.offset)}
                    </div>
                    <div
                      className={`mt-1 text-[11px] font-medium ${
                        goodWindow ? 'text-emerald-500' : 'text-amber-500'
                      }`}
                    >
                      {goodWindow ? '适宜沟通时段' : '休息/深夜时段'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTool === 'espresso' && (
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">ESPRESSO DIAL-IN LAB</div>
              <h3 className="m-0 mt-0.5 text-[20px] font-bold text-[var(--text-primary)]">
                交互式意式浓缩调豆实验台
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-4">
                <label className="text-[11px] text-[var(--text-muted)]">粉重 Dose (g)</label>
                <input
                  type="number"
                  step={0.5}
                  value={dose}
                  onChange={(e) => setDose(Number(e.target.value))}
                  className="tabular-nums mt-1 w-full bg-transparent text-[22px] font-bold outline-none"
                />
              </div>
              <div className="glass-card rounded-2xl p-4">
                <label className="text-[11px] text-[var(--text-muted)]">目标粉液比 1:X</label>
                <input
                  type="number"
                  step={0.1}
                  value={ratio}
                  onChange={(e) => setRatio(Number(e.target.value))}
                  className="tabular-nums mt-1 w-full bg-transparent text-[22px] font-bold outline-none"
                />
              </div>
              <div className="glass-card rounded-2xl p-4">
                <label className="text-[11px] text-[var(--text-muted)]">实测秒数 (s)</label>
                <input
                  type="number"
                  value={brewSec}
                  onChange={(e) => setBrewSec(Number(e.target.value))}
                  className="tabular-nums mt-1 w-full bg-transparent text-[22px] font-bold outline-none"
                />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4">
              <div className="text-[12px] text-[var(--text-muted)]">目标液重 Yield</div>
              <div className="tabular-nums mt-1 text-[28px] font-bold text-[var(--accent-primary)]">
                {targetYield} g
              </div>
              <div className="mt-2 text-[12.5px] font-medium text-[var(--text-secondary)]">
                调豆诊断：{espressoAdvice}
              </div>
            </div>
          </div>
        )}

        {activeTool === 'json' && (
          <div className="flex flex-col gap-3">
            <h3 className="m-0 text-[19px] font-bold text-[var(--text-primary)]">
              JSON 格式化与配置核验
            </h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={9}
              className="glass-card w-full resize-none rounded-2xl p-3.5 font-mono text-[12px] outline-none"
            />
            {jsonError && <div className="text-[12px] text-rose-500">{jsonError}</div>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput)
                    setJsonInput(JSON.stringify(parsed, null, 2))
                    setJsonError(null)
                  } catch (e) {
                    setJsonError(`JSON 解析失败：${(e as Error).message}`)
                  }
                }}
                className="btn-teal cursor-pointer rounded-xl px-4 py-2 text-[12.5px] font-medium"
              >
                美化缩进
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const parsed = JSON.parse(jsonInput)
                    setJsonInput(JSON.stringify(parsed))
                    setJsonError(null)
                  } catch (e) {
                    setJsonError(`JSON 解析失败：${(e as Error).message}`)
                  }
                }}
                className="glass-card cursor-pointer rounded-xl px-4 py-2 text-[12.5px] font-medium"
              >
                单行压缩
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
