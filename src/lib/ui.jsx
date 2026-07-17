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
const IST_CLOCK = new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true });
const IST_DATE_DMY = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric" }); // DD/MM/YYYY
const IST_TIME_12 = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit", hour12: true }); // h:mm AM/PM
const IST_DAYKEY = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }); // YYYY-MM-DD (for same-day check)

export const absoluteIST = (ts) => `${IST_FMT.format(new Date(ts))} IST`;
export const clockIST = (ts) => IST_CLOCK.format(new Date(ts)); // e.g. "9:08 am"

/* Absolute IST timestamp for "last updated". If the timestamp is from today,
 * show the time only ("10:47 AM"); otherwise prefix the date ("29/06/2026 10:47 AM"). */
export function formatUpdatedAt(ts, nowTs = Date.now()) {
  if (ts == null) return "";
  const d = new Date(ts);
  const time = IST_TIME_12.format(d);
  const sameDay = IST_DAYKEY.format(d) === IST_DAYKEY.format(new Date(nowTs));
  return sameDay ? time : `${IST_DATE_DMY.format(d)} ${time}`;
}
