import { STATUS_UI, cn, relativeTime, clockIST } from "@/lib/ui";

/* A monitored-system tile. Status leads the read — coloured label +
 * left rail, immediately legible (and red) when broken, without
 * opening. Two clearly-distinct times: "since" (when this state began)
 * on the status line, and last-checked beside Re-check. No icons. */

const RAIL = {
  live: "before:bg-st-live",
  unstable: "before:bg-st-unstable",
  down: "before:bg-st-down",
  maintenance: "before:bg-st-maint",
  nodata: "before:bg-st-nodata",
};

export default function SystemCard({ item, now, onOpen, onRecheck, checking, index = 0 }) {
  const ui = STATUS_UI[item.status];
  const down = item.status === "down";
  const timed = item.status === "down" || item.status === "unstable";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onOpen(item.id))}
      style={{ animationDelay: `${80 + index * 30}ms` }}
      className={cn(
        "group animate-rise relative cursor-pointer overflow-hidden rounded-lg border bg-card outline-none transition-colors duration-150",
        "before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:content-['']",
        RAIL[item.status],
        down ? "border-st-down-bd bg-st-down-bg/25" : "border-border hover:border-border-strong",
        "focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <div className="p-4 pl-5">
        <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-foreground">{item.name}</h3>

        {/* Status — the lead. "since" makes the duration unambiguous. */}
        <p className="mt-3 flex items-baseline gap-1.5">
          <span className={cn("text-[15px] font-bold tracking-tight", ui.text)}>{ui.label}</span>
          {timed && <span className="text-[13px] tabular-nums text-muted-foreground">· since {clockIST(item.since)}</span>}
        </p>

        {/* Consequence (broken) or capability (healthy). */}
        <p className={cn("mt-1 text-[13px] leading-snug", down ? "font-medium text-foreground" : "text-muted-foreground")}>
          {down ? item.affects : item.capability}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
        <span className="text-[12px] tabular-nums text-muted-foreground">Checked {relativeTime(item.lastChecked, now)}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRecheck(item.id);
          }}
          disabled={checking}
          className="rounded px-1.5 py-0.5 text-[12px] font-semibold text-primary transition-colors hover:bg-accent disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {checking ? "Checking…" : "Re-check"}
        </button>
      </div>
    </div>
  );
}
