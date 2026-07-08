import { STATUS_UI, StatusDot, cn, relativeTime } from "@/lib/ui";

/* The overall verdict — the page's anchor. The situation leads (high
 * in the type hierarchy); a tone dot anchors it; the stacked bar gives
 * the distribution at a glance. */

const BAR_ORDER = ["down", "nodata", "unstable", "maintenance", "live"];

export default function StatusHero({ verdict, items, now, lastChecked }) {
  const total = items.length;
  const counts = BAR_ORDER.map((s) => ({
    status: s,
    n: items.filter((x) => x.status === s).length,
  })).filter((c) => c.n > 0);

  return (
    <section className="animate-rise mt-6 rounded-xl border border-border bg-card">
      <div className="px-6 py-5 sm:px-7">
        {/* Heading row */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[13px] font-semibold text-muted-foreground">Integration health</h2>
          {lastChecked != null && (
            <span className="hidden text-[12px] tabular-nums text-muted-foreground sm:inline">
              Updated {relativeTime(lastChecked, now)}
            </span>
          )}
        </div>

        {/* The situation — leads the hierarchy */}
        <div className="mt-3 flex items-center gap-2.5">
          <StatusDot status={verdict.tone} className="h-2.5 w-2.5" />
          <h3 className="text-[21px] font-bold leading-none tracking-tight text-foreground sm:text-[23px]">
            {verdict.headline}
          </h3>
        </div>
        {verdict.detail && (
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-muted-foreground">{verdict.detail}</p>
        )}

        {/* Distribution — labelled with the total so the breakdown reads as parts-of-whole */}
        <div className="mt-6 border-t border-border pt-4">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-medium text-muted-foreground">Status breakdown</span>
            <span className="text-[12.5px] tabular-nums text-muted-foreground">
              <span className="font-bold text-foreground">{total}</span> integrations
            </span>
          </div>

          {/* desktop — each count sits under its segment */}
          <div className="mt-3 hidden items-stretch gap-1.5 sm:flex">
            {counts.map((c) => (
              <div key={c.status} style={{ flexGrow: c.n }} className="min-w-0">
                <div className={cn("h-2 rounded-sm", STATUS_UI[c.status].dot)} />
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-[14px] font-bold tabular-nums text-foreground">{c.n}</span>
                  <span className="truncate text-[12.5px] text-muted-foreground">{STATUS_UI[c.status].label}</span>
                </div>
              </div>
            ))}
          </div>

          {/* mobile — continuous bar + wrapped legend */}
          <div className="mt-3 sm:hidden">
            <div className="flex h-2 gap-1 overflow-hidden rounded-full">
              {counts.map((c) => (
                <div key={c.status} style={{ flexGrow: c.n }} className={cn("h-full rounded-sm", STATUS_UI[c.status].dot)} />
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {counts.map((c) => (
                <li key={c.status} className="inline-flex items-center gap-1.5">
                  <StatusDot status={c.status} />
                  <span className="text-[13px] font-bold tabular-nums text-foreground">{c.n}</span>
                  <span className="text-[13px] text-muted-foreground">{STATUS_UI[c.status].label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
