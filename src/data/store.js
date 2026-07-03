/* ==================================================================
 * OnCourts Integration Status — shared mock status store (front-end only).
 * All data is "Demo data — not live." Sanitized: issue category /
 * diagnostic signal only — never credentials, IPs, hostnames, contacts.
 *
 * Taxonomy: Live · Unstable · Down · No data · Maintenance.
 * Roles: advocate (public) · staff (court-internal) · internal (ops).
 *
 * NOTE: The backend polling service (issue #5807) is not finalised yet,
 * so every status, timestamp and copy string below is illustrative dummy
 * data. When the real health API lands, replace makeScenario() / the
 * COPY table with fetched records — the component tree stays unchanged.
 * ================================================================== */

export const STATUS = {
  live: { id: "live", label: "Live", rank: 0 },
  maintenance: { id: "maintenance", label: "Maintenance", rank: 1 },
  unstable: { id: "unstable", label: "Unstable", rank: 2 },
  nodata: { id: "nodata", label: "No data", rank: 3 },
  down: { id: "down", label: "Down", rank: 4 },
};

// v1 scope exposes only Down / Operational in the demo flip control.
export const STATUS_ORDER = ["down", "live"];
const AVAILABLE = new Set(["live", "unstable"]); // counts as a usable login channel

/* ---- Roles ------------------------------------------------------- */
export const ROLES = [
  {
    id: "all",
    label: "All",
    blurb: "Unfiltered — every integration.",
    depth: "full",
  },
  {
    id: "advocate",
    label: "Advocate",
    blurb: "Public view — what's working and what to do.",
    depth: "public",
  },
  {
    id: "staff",
    label: "Court staff",
    blurb: "Court-facing systems and workarounds.",
    depth: "public",
  },
  {
    id: "internal",
    label: "Internal",
    blurb: "Internal ops view.",
    depth: "full",
  },
];

const ALL = ["all", "advocate", "staff", "internal"];
const COURT = ["all", "staff", "internal"];

/* ---- Catalogue (6 monitored systems) ----------------------------- */
export const SERVICES = [
  { id: "epayment", name: "e-Payment", vendor: "e-Treasury", capability: "Court-fee payment & refunds", affects: "Blocks court-fee payment & refunds", authCritical: false, needsAuth: true, audience: ALL },
  { id: "sms", name: "SMS", vendor: "CDAC", capability: "Login OTP & mobile alerts", affects: "Blocks sign-in (SMS OTP) & alerts", authCritical: true, needsAuth: false, audience: ALL },
  { id: "email", name: "Email", vendor: "NIC", capability: "Login OTP & notifications", affects: "Blocks sign-in (Email OTP) & notices", authCritical: true, needsAuth: false, audience: ALL },
  { id: "esign", name: "e-Sign", vendor: "CDAC / CCA", capability: "Digital signing of documents", affects: "Blocks document signing & submission", authCritical: false, needsAuth: true, audience: ALL },
  { id: "aadhaar", name: "Aadhaar Auth", vendor: "UIDAI", capability: "e-KYC & ID verification", affects: "Blocks e-KYC & ID verification", authCritical: false, needsAuth: false, audience: ALL },
  { id: "icops", name: "iCOPS", vendor: "State Police", capability: "Summons / warrant delivery", affects: "Delays summons & warrant dispatch", authCritical: false, needsAuth: false, audience: COURT },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

export function visibleServices(role) {
  return SERVICES.filter((s) => s.audience.includes(role));
}

/* ---- Planned (scales to ~14) ------------------------------------- */
export const PLANNED = ["CCTNS", "NJDG", "CKYC", "Digilocker", "e-post", "NSTEP", "NALSA", "Bar Council"];

/* ---- Authored copy ----------------------------------------------- *
 * diagnostic: sanitized technical signal (staff+).
 * impact: plain user consequence.
 * actions: { a: 'user' | 'team', t }. */
const COPY = {
  epayment: {
    down: {
      category: "Gateway timeout",
      diagnostic: "504 Gateway Timeout",
      impact: "Online court-fee payment and refunds are unavailable. The e-Treasury gateway is timing out for all incoming requests.",
      actions: [
        { a: "user", t: "Please retry later; strictly avoid repeat attempts to prevent a double charge." },
        { a: "team", t: "Check if the 14-day e-Treasury IP whitelisting has lapsed." },
      ],
      placeholder: "⚠ Offline payment channel — pending confirmation",
    },
    unstable: {
      category: "Intermittent gateway errors",
      diagnostic: "Intermittent 502 from gateway",
      impact: "Some payments are timing out and need a retry.",
      actions: [
        { a: "user", t: "Retry once; don't re-submit repeatedly." },
        { a: "team", t: "Watch the e-Treasury gateway; confirm the whitelisting window." },
      ],
      placeholder: "⚠ Offline payment channel — pending confirmation",
    },
    nodata: { category: "No status from monitor", diagnostic: "No response from monitor", impact: "We can't confirm e-Payment health right now.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach e-Treasury." }] },
  },
  sms: {
    down: {
      category: "Daily limit reached",
      diagnostic: "Daily quota exhausted (1L limit)",
      impact: "SMS OTPs and alerts aren't going out. Anyone signing in by SMS can't receive a code.",
      actions: [
        { a: "user", t: "Sign in using Email OTP instead." },
        { a: "team", t: "Ask the High Court to raise today's SMS limit." },
        { a: "team", t: "Verify the DLT template and IP whitelisting with CDAC." },
      ],
      note: "Daily-limit outages usually clear the next day.",
    },
    unstable: {
      category: "Approaching daily limit",
      diagnostic: "Daily quota at 92%",
      impact: "SMS OTPs are slow or intermittently dropping. Sign-in may need a retry or Email OTP.",
      actions: [
        { a: "user", t: "If no SMS arrives, use Email OTP." },
        { a: "team", t: "Pre-empt the limit — request a raise with CDAC." },
      ],
    },
    nodata: { category: "No status from monitor", diagnostic: "No response from monitor", impact: "We can't confirm SMS health right now. Treat SMS sign-in as uncertain.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach CDAC." }] },
  },
  email: {
    down: {
      category: "Authentication failure",
      diagnostic: "SMTP auth failure (post-migration)",
      impact: "Email OTPs and notifications aren't being delivered.",
      actions: [
        { a: "user", t: "Sign in using SMS OTP instead." },
        { a: "team", t: "Verify NIC mail credentials after the migration." },
        { a: "team", t: "Confirm server whitelisting with NIC." },
      ],
    },
    unstable: {
      category: "Intermittent delivery",
      diagnostic: "Delivery queue backlog",
      impact: "Email OTPs and notices are delayed for some recipients.",
      actions: [
        { a: "user", t: "If the email is slow, use SMS OTP." },
        { a: "team", t: "Watch the NIC delivery queue post-migration." },
      ],
    },
    nodata: { category: "No status from monitor", diagnostic: "No response from monitor", impact: "We can't confirm Email health right now. Treat Email sign-in as uncertain.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach NIC." }] },
  },
  esign: {
    down: {
      category: "Audit certificate expired",
      diagnostic: "Audit certificate expired",
      impact: "Documents that need e-Sign can't be signed or submitted right now.",
      actions: [
        { a: "user", t: "Save your draft — complete signing once it's restored." },
        { a: "team", t: "Renew the e-Sign audit certificate (CDAC / CCA)." },
      ],
      placeholder: "⚠ Manual / wet-signature fallback — pending court SOP",
    },
    unstable: {
      category: "Intermittent key mismatch",
      diagnostic: "Intermittent key mismatch",
      impact: "Some signing attempts are failing and need a retry.",
      actions: [
        { a: "user", t: "Retry signing; save your draft if it fails." },
        { a: "team", t: "Check key / ASP-ID provisioning with CDAC." },
      ],
      placeholder: "⚠ Manual / wet-signature fallback — pending court SOP",
    },
    nodata: { category: "No status from monitor", diagnostic: "No response from monitor", impact: "We can't confirm e-Sign health right now.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach CDAC / CCA." }] },
  },
  aadhaar: {
    down: {
      category: "Auth API error",
      diagnostic: "UIDAI Auth API 500",
      impact: "Aadhaar e-KYC and ID verification are unavailable.",
      actions: [
        { a: "user", t: "Use an alternate accepted ID where the court permits." },
        { a: "team", t: "Check UIDAI ASA/KUA access and credentials." },
      ],
      placeholder: "⚠ Offline KYC fallback — pending court SOP",
    },
    unstable: {
      category: "Intermittent timeouts",
      diagnostic: "Intermittent UIDAI timeouts",
      impact: "Aadhaar e-KYC is slow or intermittently failing; a retry usually works.",
      actions: [
        { a: "user", t: "Retry the verification." },
        { a: "team", t: "Watch UIDAI latency." },
      ],
    },
    nodata: { category: "No status from monitor", diagnostic: "No response from monitor", impact: "We can't confirm Aadhaar health right now.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach UIDAI." }] },
  },
  icops: {
    down: {
      category: "Validation errors",
      diagnostic: "Validation errors on dispatch",
      impact: "Summons and warrants to police are delayed. This mostly affects case processing, not sign-in.",
      actions: [
        { a: "team", t: "Re-queue the failed dispatches." },
        { a: "team", t: "Review validation errors with State Police IT." },
      ],
      placeholder: "⚠ Confirm fallback dispatch channel",
    },
    unstable: {
      category: "Partial validation errors",
      diagnostic: "Validation errors (partial)",
      impact: "Some summons dispatches are failing validation and need re-sending.",
      actions: [{ a: "team", t: "Re-queue failed dispatches; review with State Police IT." }],
      placeholder: "⚠ Confirm fallback dispatch channel",
    },
    nodata: { category: "Endpoint unreachable", diagnostic: "Endpoint unreachable (timeout)", impact: "We can't confirm iCOPS health right now; dispatch status is unknown.", actions: [{ a: "team", t: "Re-check; verify the monitor can reach the endpoint." }] },
  },
};

const MAINTENANCE = (id) => ({
  category: "Scheduled maintenance",
  diagnostic: `Scheduled ${SERVICE_BY_ID[id].vendor} maintenance window`,
  impact: "Planned maintenance window — a short interruption is expected.",
  actions: [],
});

/* ==================================================================
 * Scenarios
 * ================================================================== */
export const SCENARIOS = [
  { id: "incident", label: "Incident", hint: "One system down" },
  { id: "default", label: "All operational", hint: "Healthy" },
  { id: "bothdown", label: "Sign-in down", hint: "Both OTP channels down" },
];

const m = (mins) => mins * 60000;

function scenarioRecords(id, now) {
  const base = {};
  for (const s of SERVICES) base[s.id] = { status: "live", since: now - m(180), lastChecked: now - m(2) };

  if (id === "default") return base;

  if (id === "incident") {
    base.epayment = { status: "down", since: now - m(18), lastChecked: now - m(18), categoryOverride: "Gateway timeout" };
    return base;
  }
  if (id === "bothdown") {
    base.sms = { status: "down", since: now - m(22), lastChecked: now - m(1) };
    base.email = { status: "down", since: now - m(15), lastChecked: now - m(1) };
    return base;
  }
  return base;
}

export function makeScenario(id, now = Date.now()) {
  const recs = scenarioRecords(id, now);
  const items = {};
  for (const s of SERVICES) items[s.id] = { ...recs[s.id], ops: { state: "none", owner: null } };
  return { name: id, items };
}

/* ==================================================================
 * Selectors
 * ================================================================== */
export function loginState(items) {
  const smsAvail = AVAILABLE.has(items.sms.status);
  const emailAvail = AVAILABLE.has(items.email.status);
  return { smsAvail, emailAvail, channelsUp: (smsAvail ? 1 : 0) + (emailAvail ? 1 : 0), loginBlocked: !smsAvail && !emailAvail };
}

export function resolveItem(id, items, now) {
  const svc = SERVICE_BY_ID[id];
  const rec = items[id];
  const status = rec.status;
  const login = loginState(items);

  let category = null, diagnostic = null, impact = "Working normally.", actions = [], placeholder = null, note = null;

  if (status === "maintenance") {
    const c = MAINTENANCE(id);
    category = c.category; diagnostic = c.diagnostic; impact = c.impact; actions = [];
  } else if (status !== "live") {
    const c = COPY[id][status] || {};
    category = rec.categoryOverride || c.category || null;
    diagnostic = c.diagnostic || null;
    impact = c.impact || impact;
    actions = (c.actions || []).map((a) => ({ ...a }));
    placeholder = c.placeholder || null;
    note = c.note || null;
  }

  // Cross-channel safety: never cross-suggest a login channel that's also down.
  if ((id === "sms" || id === "email") && login.loginBlocked && status !== "live") {
    actions = actions.filter((a) => a.a !== "user");
    actions.unshift({ a: "user", t: "Sign-in is unavailable — both OTP channels are down. Try again shortly or contact support.", escalation: true });
  }

  let cascade = null;
  if (svc.needsAuth && login.loginBlocked && (status === "live" || status === "unstable")) {
    cascade = "Sign-in is down, so OTP authentication for this service will also fail.";
  }

  return { ...svc, status, since: rec.since, lastChecked: rec.lastChecked, durationMs: Math.max(0, now - rec.since), category, diagnostic, impact, actions, placeholder, note, cascade, ops: rec.ops };
}

export function resolveVisible(items, now, role) {
  return visibleServices(role).map((s) => resolveItem(s.id, items, now));
}

/* ---- Role-aware overall verdict ---------------------------------- */
export function overallVerdict(items, now, role) {
  const all = resolveVisible(items, now, role);
  const login = loginState(items);
  const down = all.filter((x) => x.status === "down");

  // Login escalation only matters where SMS/Email are visible (they are for all roles).
  if (login.loginBlocked) {
    return { tone: "down", headline: "Sign-in unavailable", detail: "Both SMS and Email OTP are down, so users cannot sign in." };
  }
  if (down.length) {
    const s = down.length > 1 ? "s" : "";
    return {
      tone: "down",
      headline: `${down.length} system${s} down`,
      detail: `${down.map((d) => d.name).join(", ")} unavailable and need immediate attention.`,
    };
  }
  return { tone: "live", headline: "All systems operational", detail: "No incidents in the last few minutes." };
}
