import { useRef } from "react";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge, formatUpdatedAt, cn } from "@/lib/ui";

/* "Report a problem" destination — Google Form (opens in a new tab). */
const REPORT_URL = "https://docs.google.com/forms/d/e/1FAIpQLScr8ANFxo1eIeoK1wLnhiOfpobcn_UfvEuS7bBwkmCHCqva7w/viewform";

/* Header carries the status as a subtle wash — matches the card. */
const HEADER_TINT = {
  down: "border-st-down-bd bg-st-down-bg/45",
  live: "border-border bg-card",
};

export default function DetailDrawer({ open, item, onOpenChange }) {
  // Retain the last item so the slide-out animation keeps its content.
  const last = useRef(null);
  if (item) last.current = item;
  const data = item || last.current;

  const userActions = data ? data.actions.filter((a) => a.a === "user") : [];
  const timing = data ? `Last updated at ${formatUpdatedAt(data.lastChecked)}` : "";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="p-0">
        {data && (
          <>
            <SheetHeader className={cn("space-y-3 border-b px-6 py-5 pr-12", HEADER_TINT[data.status] || HEADER_TINT.live)}>
              <SheetTitle className="text-[22px] font-bold tracking-tight">{data.name}</SheetTitle>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <StatusBadge status={data.status} />
                <span className="text-[12px] font-medium tabular-nums text-muted-foreground">{timing}</span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <p className="text-[15.5px] font-medium leading-relaxed text-foreground">{data.impact}</p>
              {data.cascade && <p className="mt-2.5 text-[14px] font-semibold leading-relaxed text-st-down">{data.cascade}</p>}
              {data.note && <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{data.note}</p>}

              {userActions.length > 0 && (
                <section className="mt-6">
                  <p className="text-[12.5px] font-semibold text-muted-foreground">What you can do</p>
                  <ul className="mt-3 space-y-2.5">
                    {userActions.map((a, i) =>
                      a.escalation ? (
                        <li key={i} className="rounded-lg border border-st-down-bd bg-st-down-bg/60 px-3.5 py-2.5 text-[14px] font-semibold leading-relaxed text-st-down">
                          {a.t}
                        </li>
                      ) : (
                        <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          {a.t}
                        </li>
                      )
                    )}
                  </ul>
                </section>
              )}

              {/* Live probe detail straight from the backend health check. */}
              {data.diagnostic && (
                <section className="mt-6 border-t border-border pt-4">
                  <p className="text-[12.5px] font-semibold text-muted-foreground">Last check</p>
                  <p className="mt-1.5 font-mono text-[12.5px] leading-relaxed text-muted-foreground">
                    {data.diagnostic}
                    {typeof data.responseTimeMs === "number" && ` · ${data.responseTimeMs} ms`}
                  </p>
                </section>
              )}
            </div>

            <SheetFooter className="flex-row items-center gap-2 border-t px-6 py-4">
              <Button asChild className="flex-1">
                <a href={REPORT_URL} target="_blank" rel="noreferrer">
                  Report a problem <ExternalLink />
                </a>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
