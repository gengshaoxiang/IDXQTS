import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="relative min-h-[72vh] overflow-hidden rounded-2xl border border-[var(--line)] bg-gradient-to-br from-[#12202c] via-[#0f4a4c] to-[#0f6b6d] px-8 py-16 text-white shadow-[0_30px_80px_-40px_rgba(18,32,44,0.8)] sm:px-14">
        <div className="anim-rise max-w-2xl">
          <p className="font-display text-6xl tracking-tight sm:text-7xl">EES</p>
          <h1 className="mt-4 font-display text-3xl leading-snug sm:text-4xl">
            集团高管在线评价系统
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80">
            四维能力与业绩评估，叠加一票否决风控底线——用数据校准主观，用机制保护真话。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/tasks"
              className="rounded-md bg-white px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-paper"
            >
              进入评价待办
            </Link>
            <Link
              href="/calibration"
              className="rounded-md border border-white/35 px-5 py-2.5 text-sm text-white transition hover:bg-white/10"
            >
              打开校准看板
            </Link>
          </div>
        </div>
        <div className="anim-rise-delay pointer-events-none absolute -right-8 bottom-0 hidden h-64 w-64 rounded-full border border-white/15 sm:block" />
        <div className="anim-rise-delay-2 pointer-events-none absolute right-16 top-16 hidden h-40 w-40 rounded-full border border-white/10 sm:block" />
      </section>

      <section className="anim-rise-delay grid gap-8 md:grid-cols-3">
        {[
          {
            title: "防失真引擎",
            body: "极端分 STAR 强制举证、Z-Score 宽严度校准、下属 <3 人动态池化。",
          },
          {
            title: "数据直连",
            body: "经营业绩维度对接 BI/财务指标快照，减少纯主观评判水分。",
          },
          {
            title: "独立熔断",
            body: "审计法务独立提报通道，重大红线违规直接封顶评级。",
          },
        ].map((item) => (
          <div key={item.title} className="border-l-2 border-sea pl-4">
            <h2 className="font-display text-2xl text-ink">{item.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
