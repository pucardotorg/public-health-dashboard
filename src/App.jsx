import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import {
  makeScenario,
  resolveItem,
  resolveVisible,
  overallVerdict,
  visibleServices,
  ROLES,
  SERVICES,
  STATUS,
  PLANNED,
} from "@/data/store";
import { cn, headerStamp } from "@/lib/ui";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import SystemCard from "@/components/SystemCard";
import DetailDrawer from "@/components/DetailDrawer";
import StatusHero from "@/components/StatusHero";

/* Perspective and open-card can be deep-linked via URL params. */
const PARAMS = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const INITIAL_ROLE = ROLES.some((r) => r.id === PARAMS.get("role")) ? PARAMS.get("role") : "all";

export default function App() {
  const [store] = useState(() => makeScenario("incident"));
  const [now, setNow] = useState(Date.now());
  const [roleId, setRoleId] = useState(INITIAL_ROLE);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(() => {
    const o = PARAMS.get("open");
    return SERVICES.some((s) => s.id === o) ? o : null;
  });
  const [query, setQuery] = useState("");

  const role = ROLES.find((r) => r.id === roleId);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => {
    if (openId && !visibleServices(roleId).some((s) => s.id === openId)) setOpenId(null);
  }, [roleId, openId]);

  const items = useMemo(() => {
    const list = resolveVisible(store.items, now, roleId);
    return list.sort((a, b) => STATUS[b.status].rank - STATUS[a.status].rank || a.name.localeCompare(b.name));
  }, [store.items, now, roleId]);

  const verdict = overallVerdict(store.items, now, roleId);

  const counts = {
    all: items.length,
    attention: items.filter((x) => x.status === "down").length,
    live: items.filter((x) => x.status === "live").length,
  };
  const q = query.trim().toLowerCase();
  const shown = items.filter((x) => {
    if (filter === "attention" && x.status !== "down") return false;
    if (filter === "live" && x.status !== "live") return false;
    if (q && !`${x.name} ${x.capability}`.toLowerCase().includes(q)) return false;
    return true;
  });

  const lastChecked = items.length ? Math.max(...items.map((x) => x.lastChecked)) : now;

  const openItem = openId ? resolveItem(openId, store.items, now) : null;
  const hiddenCount = SERVICES.length - visibleServices(roleId).length;

  const FILTERS = [
    { id: "all", label: "All", n: counts.all },
    { id: "attention", label: "Needs attention", n: counts.attention },
    { id: "live", label: "Operational", n: counts.live },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full bg-background font-sans text-foreground">
        <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8 sm:py-8">
          {/* Page title */}
          <h1 className="text-[26px] font-bold leading-none tracking-tight sm:text-[28px]">Integration Status</h1>

          {/* Role switcher */}
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
            <div className="flex w-full min-w-0 items-center gap-3 sm:w-auto">
              <span className="hidden shrink-0 whitespace-nowrap text-[13px] font-medium text-muted-foreground sm:inline">Viewing as</span>
              <ToggleGroup
                type="single"
                value={roleId}
                onValueChange={(v) => v && setRoleId(v)}
                className="w-full rounded-lg border border-border bg-card p-1 shadow-sm sm:w-auto"
              >
                {ROLES.map((r) => (
                  <Tooltip key={r.id}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={r.id}
                        size="sm"
                        className={cn(
                          "h-9 flex-1 whitespace-nowrap px-3 sm:flex-none",
                          roleId === r.id && "bg-foreground text-card hover:bg-foreground hover:text-card"
                        )}
                      >
                        {r.label}
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{r.blurb}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
            </div>
            <span className="hidden text-[12.5px] tabular-nums text-muted-foreground sm:inline">{headerStamp(now)}</span>
          </div>

          {/* Overall verdict — adaptive across ideal / breaking / login-down */}
          <StatusHero
            verdict={verdict}
            items={items}
            now={now}
            lastChecked={lastChecked}
          />

          {/* Toolbar — label · search · status filter */}
          <div className="mt-9 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border pt-7">
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Current integrations</h2>
            <div className="relative ml-auto w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search systems…"
                aria-label="Search systems"
                className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-8 text-[13px] font-medium outline-none placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <ToggleGroup type="single" value={filter} onValueChange={(v) => v && setFilter(v)}>
              {FILTERS.map((f) => (
                <ToggleGroupItem
                  key={f.id}
                  value={f.id}
                  size="sm"
                  variant="outline"
                  className="group gap-1.5 font-medium data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:font-semibold data-[state=on]:text-card data-[state=on]:hover:bg-foreground data-[state=on]:hover:text-card"
                >
                  {f.label}
                  <span className="text-[11px] font-semibold tabular-nums text-muted-foreground group-data-[state=on]:text-card/70">{f.n}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Systems grid */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((item, i) => (
              <SystemCard
                key={item.id}
                item={item}
                now={now}
                onOpen={setOpenId}
                index={i}
              />
            ))}
          </div>
          {shown.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center text-[13px] text-muted-foreground">
              {query ? (
                <>No systems match “{query}”. <button onClick={() => setQuery("")} className="font-medium text-foreground underline-offset-2 hover:underline">Clear search</button></>
              ) : (
                "No systems match this filter."
              )}
            </div>
          )}

          {/* Footnotes */}
          <div className="mt-7 space-y-1 border-t border-border pt-5 text-[12px] font-medium text-muted-foreground">
            {hiddenCount > 0 && (
              <p>
                {hiddenCount} system{hiddenCount > 1 ? "s" : ""} hidden — not relevant to the {role.label.toLowerCase()} role.
              </p>
            )}
            <p>{PLANNED.length} more integrations planned · demo data, not live · times in IST</p>
          </div>
        </div>

        {/* Detail drawer */}
        <DetailDrawer
          open={!!openId}
          item={openItem}
          now={now}
          onOpenChange={(o) => !o && setOpenId(null)}
        />
      </div>
    </TooltipProvider>
  );
}
