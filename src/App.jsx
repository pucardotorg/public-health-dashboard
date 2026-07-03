import { useEffect, useMemo, useRef, useState } from "react";
import { Sun, Moon, Search, X, Scale, Globe } from "lucide-react";
import {
  makeScenario,
  resolveItem,
  resolveVisible,
  overallVerdict,
  visibleServices,
  ROLES,
  SCENARIOS,
  SERVICES,
  STATUS,
  STATUS_ORDER,
  PLANNED,
} from "@/data/store";
import { STATUS_UI, cn, headerStamp } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import SystemCard from "@/components/SystemCard";
import DetailDrawer from "@/components/DetailDrawer";
import StatusHero from "@/components/StatusHero";

const RECHECK_THROTTLE_MS = 5000;
const CHECKING_MS = 800;

/* The mobile demo preview loads the app inside a phone-sized iframe with
 * ?embed=1; scenario/role pass through so the preview mirrors the controls. */
const PARAMS = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
const EMBED = PARAMS.get("embed") === "1";
const INITIAL_SCENARIO = SCENARIOS.some((s) => s.id === PARAMS.get("scenario")) ? PARAMS.get("scenario") : "incident";
const INITIAL_ROLE = ROLES.some((r) => r.id === PARAMS.get("role")) ? PARAMS.get("role") : "all";

export default function App() {
  const [store, setStore] = useState(() => makeScenario(INITIAL_SCENARIO));
  const [now, setNow] = useState(Date.now());
  const [roleId, setRoleId] = useState(INITIAL_ROLE);
  const [filter, setFilter] = useState("all");
  const [openId, setOpenId] = useState(() => {
    const o = PARAMS.get("open");
    return SERVICES.some((s) => s.id === o) ? o : null;
  });
  const [checking, setChecking] = useState({});
  const [throttled, setThrottled] = useState(false);
  const [dark, setDark] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState("desktop"); // demo: desktop | mobile (phone-frame preview)
  const throttleTimer = useRef(null);

  const role = ROLES.find((r) => r.id === roleId);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);
  useEffect(() => () => clearTimeout(throttleTimer.current), []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  useEffect(() => {
    if (openId && !visibleServices(roleId).some((s) => s.id === openId)) setOpenId(null);
  }, [roleId, openId]);

  const startThrottle = () => {
    setThrottled(true);
    clearTimeout(throttleTimer.current);
    throttleTimer.current = setTimeout(() => setThrottled(false), RECHECK_THROTTLE_MS);
  };

  const recheck = (id) => {
    if (throttled || checking[id]) return;
    startThrottle();
    setChecking((c) => ({ ...c, [id]: true }));
    setTimeout(() => {
      setStore((s) => ({ ...s, items: { ...s.items, [id]: { ...s.items[id], lastChecked: Date.now() } } }));
      setNow(Date.now());
      setChecking((c) => {
        const n = { ...c };
        delete n[id];
        return n;
      });
    }, CHECKING_MS);
  };

  const recheckAll = () => {
    if (refreshing || throttled) return;
    startThrottle();
    setRefreshing(true);
    setTimeout(() => {
      const ts = Date.now();
      setStore((s) => {
        const items = {};
        for (const id in s.items) items[id] = { ...s.items[id], lastChecked: ts };
        return { ...s, items };
      });
      setNow(ts);
      setRefreshing(false);
    }, CHECKING_MS);
  };

  const flipStatus = (id, status) => {
    const ts = Date.now();
    setStore((s) => ({ ...s, items: { ...s.items, [id]: { ...s.items[id], status, since: ts, lastChecked: ts, categoryOverride: undefined } } }));
    setNow(ts);
  };

  const loadScenario = (name) => {
    setStore(makeScenario(name));
    setNow(Date.now());
    setChecking({});
    setOpenId(null);
  };

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

  // Phone-preview iframe mirrors the current scenario + perspective.
  const mobileSrc = `${window.location.pathname}?embed=1&scenario=${store.name}&role=${roleId}`;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-full bg-background font-sans text-foreground">
        {view === "mobile" ? (
          <MobilePreview src={mobileSrc} />
        ) : (
        <>
        {/* Government app bar */}
        <header className="border-b border-border-strong bg-card">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Scale className="h-5 w-5" />
              </span>
              <div className="leading-tight">
                <p className="text-[15px] font-bold tracking-tight">OnCourts</p>
                <p className="text-[11px] font-medium text-muted-foreground">Kerala Courts Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <button className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Globe className="h-4 w-4" /> EN
              </button>
              <button className="hidden rounded-md px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">
                Support
              </button>
              <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle dark mode">
                {dark ? <Sun /> : <Moon />}
              </Button>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-[13px] font-semibold text-primary-foreground" aria-label="Account">
                A
              </span>
            </div>
          </div>
        </header>

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
            onRefresh={recheckAll}
            refreshing={refreshing}
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
                onRecheck={recheck}
                checking={!!checking[item.id]}
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
          recheck={recheck}
          checking={openId ? !!checking[openId] : false}
          throttled={throttled}
        />
        </>
        )}

        {/* Demo bar */}
        {!EMBED && (
        <div className="sticky bottom-0 z-30 border-t bg-card/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col px-5 sm:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <span className="text-[12px] font-medium text-muted-foreground">Demo scenario</span>
              <ToggleGroup type="single" value={store.name} onValueChange={(v) => v && loadScenario(v)}>
                {SCENARIOS.map((sc) => (
                  <Tooltip key={sc.id}>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value={sc.id}
                        size="sm"
                        className={cn(store.name === sc.id && "bg-secondary font-semibold text-foreground")}
                      >
                        {sc.label}
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>{sc.hint}</TooltipContent>
                  </Tooltip>
                ))}
              </ToggleGroup>
              <span className="hidden text-[12px] font-medium text-muted-foreground sm:inline">View</span>
              <div className="inline-flex rounded-md border border-border p-0.5">
                {["desktop", "mobile"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded px-2.5 py-1 text-[12px] capitalize transition-colors",
                      view === v ? "bg-secondary font-semibold text-foreground" : "font-medium text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <button onClick={() => setDemoOpen((o) => !o)} className="ml-auto text-[12px] font-medium text-muted-foreground hover:text-foreground">
                {demoOpen ? "Hide controls" : "Flip systems"}
              </button>
            </div>
            {demoOpen && (
              <div className="grid gap-2 border-t py-3 sm:grid-cols-2 lg:grid-cols-3">
                {SERVICES.map((svc) => (
                  <div key={svc.id} className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">{svc.name}</span>
                    <div className="flex gap-0.5">
                      {STATUS_ORDER.map((s) => (
                        <button
                          key={s}
                          onClick={() => flipStatus(svc.id, s)}
                          title={STATUS_UI[s].label}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors",
                            store.items[svc.id].status === s
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground/70 hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {STATUS_UI[s].label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </TooltipProvider>
  );
}

/* Phone-frame preview for the demo: the real app, rendered at handset
 * width inside an iframe so genuine media queries (and the full-screen
 * drawer) apply — the same responsive CSS that serves real devices. */
function MobilePreview({ src }) {
  return (
    <div className="flex justify-center bg-secondary/50 px-4 py-10">
      <div className="h-[760px] w-[380px] shrink-0 overflow-hidden rounded-[2.25rem] border-[10px] border-foreground bg-card shadow-2xl">
        <iframe key={src} src={src} title="Mobile preview" className="h-full w-full border-0" />
      </div>
    </div>
  );
}
