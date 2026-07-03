import { cn } from "@/lib/utils";

export { cn };

/* ---- Status visual metadata (label + colour + position) ---------- *
 * Status reads via a coloured label (and a left rail on cards), so it
 * never relies on colour alone — no decorative glyphs. */
export const STATUS_UI = {
  live: {
    label: "Operational",
    text: "text-st-live",
    badge: "border-st-live-bd bg-st-live-bg text-st-live",
    dot: "bg-st-live",
  },
  unstable: {
    label: "Degraded",
    text: "text-st-unstable",
    badge: "border-st-unstable-bd bg-st-unstable-bg text-st-unstable",
    dot: "bg-st-unstable",
  },
  down: {
    label: "Down",
    text: "text-st-down",
    badge: "border-st-down-bd bg-st-down-bg text-st-down",
    dot: "bg-st-down",
  },
  nodata: {
    label: "No data",
    text: "text-st-nodata",
    badge: "border-st-nodata-bd bg-st-nodata-bg text-st-nodata",
    dot: "bg-st-nodata",
  },
  maintenance: {
    label: "Maintenance",
    text: "text-st-maint",
    badge: "border-st-maint-bd bg-st-maint-bg text-st-maint",
    dot: "bg-st-maint",
  },
};

/* A small solid status dot — minimal, Linear-style. The adjacent
 * label carries meaning, so status never relies on colour alone. */
export function StatusDot({ status, className }) {
  const ui = STATUS_UI[status];
  return <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", ui.dot, className)} aria-hidden />;
}

export function StatusBadge({ status, className }) {
  const ui = STATUS_UI[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-semibold",
        ui.badge,
        className
      )}
    >
      <StatusDot status={status} />
      {ui.label}
    </span>
  );
}

/* ---- Time helpers ------------------------------------------------ */
const IST_FMT = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
const IST_DATE = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric" });
const IST_TIME = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false });
const IST_CLOCK = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });

export const absoluteIST = (ts) => `${IST_FMT.format(new Date(ts))} IST`;
export const headerStamp = (ts) => `${IST_DATE.format(new Date(ts))} · ${IST_TIME.format(new Date(ts))} IST`;
export const clockIST = (ts) => IST_CLOCK.format(new Date(ts)); // e.g. "9:08 am"

export function relativeTime(ts, now) {
  const mins = Math.floor(Math.max(0, now - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function fmtDuration(ms) {
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}
