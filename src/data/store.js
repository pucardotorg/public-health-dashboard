/* ==================================================================
 * OnCourts Integration Status — domain model + selectors.
 *
 * LIVE DATA: statuses come from the backend health API (see src/lib/api.js).
 * This file maps the API response onto display metadata + authored guidance
 * copy, and derives the role-aware view + overall verdict.
 *
 * What comes from the API (per service): status, last-checked time, a short
 * probe message, response time, and the probed URL.
 * What is authored here (not in the API): the human-friendly name, the
 * capability/consequence line, the plain-language impact + "what you can do"
 * guidance, and the audience (which perspective sees the service).
 * ================================================================== */

export const STATUS = {
  live: { id: "live", label: "Live", rank: 0 },
  maintenance: { id: "maintenance", label: "Maintenance", rank: 1 },
  unstable: { id: "unstable", label: "Unstable", rank: 2 },
  nodata: { id: "nodata", label: "No data", rank: 3 },
  down: { id: "down", label: "Down", rank: 4 },
};

const AVAILABLE = new Set(["live", "unstable"]); // counts as a usable login channel

/* ---- Roles / perspectives ---------------------------------------- */
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

/* ---- Catalogue — display metadata for each known integration ------ *
 * Keyed by our internal id. `audience` = which perspectives see it. */
export const SERVICES = [
  {
    id: "epayment",
    name: "e-Payment",
    vendor: "e-Treasury",
    capability: "Online payments",
    needsAuth: true,
    audience: ALL,
  },
  {
    id: "sms",
    name: "SMS",
    vendor: "CDAC",
    capability: "Login OTP & mobile alerts",
    needsAuth: false,
    audience: ALL,
  },
  {
    id: "email",
    name: "Email",
    vendor: "NIC",
    capability: "Login OTP & notifications",
    needsAuth: false,
    audience: ALL,
  },
  {
    id: "esign",
    name: "e-Sign",
    vendor: "CDAC / CCA",
    capability: "Digital signing of documents",
    needsAuth: true,
    audience: ALL,
  },
  {
    id: "aadhaar",
    name: "Aadhaar Auth",
    vendor: "UIDAI",
    capability: "e-KYC & ID verification",
    needsAuth: false,
    audience: ALL,
  },
  {
    id: "icops",
    name: "iCoPS",
    vendor: "State Police",
    capability: "Digital warrants and summons",
    needsAuth: false,
    audience: COURT,
  },
];

export const SERVICE_BY_ID = Object.fromEntries(SERVICES.map((s) => [s.id, s]));

/* Map the API's serviceName → our internal id. Case-insensitive lookup. */
export const SERVICE_ID_BY_API = {
  TREASURY: "epayment",
  ETREASURY: "epayment",
  EPAYMENT: "epayment",
  SMS: "sms",
  EMAIL: "email",
  ESIGN: "esign",
  AADHAAR: "aadhaar",
  AADHAAR_AUTH: "aadhaar",
  ICOPS: "icops",
};

/* Fallback metadata for a service the API returns but the catalogue doesn't know. */
function fallbackMeta(id, apiServiceName) {
  const name = apiServiceName
    ? apiServiceName.charAt(0) + apiServiceName.slice(1).toLowerCase()
    : id;
  return {
    id,
    name,
    vendor: null,
    capability: "External integration",
    needsAuth: false,
    audience: ALL,
  };
}

export function getMeta(id, apiServiceName) {
  return SERVICE_BY_ID[id] || fallbackMeta(id, apiServiceName);
}

export function visibleServices(role) {
  return SERVICES.filter((s) => s.audience.includes(role));
}

/* ---- Authored copy ----------------------------------------------- *
 * impact: plain user consequence. actions: { a: 'user' | 'team', t }.
 * Only used to enrich a non-operational service; the API supplies status. */
const COPY = {
  epayment: {
    down: {
      impact: "You will not be able to make payments online",
      actions: [
        {
          a: "user",
          t: "Please retry later; strictly avoid repeat attempts to prevent a double charge.",
        },
        {
          a: "team",
          t: "Check if the 14-day e-Treasury IP whitelisting has lapsed.",
        },
      ],
    },
    unstable: {
      impact: "Some payments are timing out and need a retry.",
      actions: [
        { a: "user", t: "Retry once; don't re-submit repeatedly." },
        {
          a: "team",
          t: "Watch the e-Treasury gateway; confirm the whitelisting window.",
        },
      ],
    },
    nodata: {
      impact: "We can't confirm e-Payment health right now.",
      actions: [{ a: "team", t: "Verify the monitor can reach e-Treasury." }],
    },
  },
  sms: {
    down: {
      impact: "You will not receive SMS alerts and OTPs.",
      actions: [
        { a: "user", t: "Sign in using Email OTP instead." },
        { a: "team", t: "Ask the High Court to raise today's SMS limit." },
        {
          a: "team",
          t: "Verify the DLT template and IP whitelisting with CDAC.",
        },
      ],
      note: "Daily-limit outages usually clear the next day.",
    },
    unstable: {
      impact:
        "SMS OTPs are slow or intermittently dropping. Sign-in may need a retry or Email OTP.",
      actions: [
        { a: "user", t: "If no SMS arrives, use Email OTP." },
        { a: "team", t: "Pre-empt the limit — request a raise with CDAC." },
      ],
    },
    nodata: {
      impact:
        "We can't confirm SMS health right now. Treat SMS sign-in as uncertain.",
      actions: [{ a: "team", t: "Verify the monitor can reach CDAC." }],
    },
  },
  email: {
    down: {
      impact: "You will not receive email alerts and OTPs.",
      actions: [
        { a: "user", t: "Sign in using SMS OTP instead." },
        { a: "team", t: "Verify NIC mail credentials after the migration." },
        { a: "team", t: "Confirm server whitelisting with NIC." },
      ],
    },
    unstable: {
      impact: "Email OTPs and notices are delayed for some recipients.",
      actions: [
        { a: "user", t: "If the email is slow, use SMS OTP." },
        { a: "team", t: "Watch the NIC delivery queue post-migration." },
      ],
    },
    nodata: {
      impact:
        "We can't confirm Email health right now. Treat Email sign-in as uncertain.",
      actions: [{ a: "team", t: "Verify the monitor can reach NIC." }],
    },
  },
  esign: {
    down: {
      impact: "You will not be able to e-sign your documents.",
      actions: [
        {
          a: "user",
          t: "Save your draft — complete signing once it's restored.",
        },
        { a: "team", t: "Renew the e-Sign audit certificate (CDAC / CCA)." },
      ],
    },
    unstable: {
      impact: "Some signing attempts are failing and need a retry.",
      actions: [
        { a: "user", t: "Retry signing; save your draft if it fails." },
        { a: "team", t: "Check key / ASP-ID provisioning with CDAC." },
      ],
    },
    nodata: {
      impact: "We can't confirm e-Sign health right now.",
      actions: [{ a: "team", t: "Verify the monitor can reach CDAC / CCA." }],
    },
  },
  aadhaar: {
    down: {
      impact: "Aadhaar e-KYC and ID verification are unavailable.",
      actions: [
        {
          a: "user",
          t: "Use an alternate accepted ID where the court permits.",
        },
        { a: "team", t: "Check UIDAI ASA/KUA access and credentials." },
      ],
    },
    unstable: {
      impact:
        "Aadhaar e-KYC is slow or intermittently failing; a retry usually works.",
      actions: [
        { a: "user", t: "Retry the verification." },
        { a: "team", t: "Watch UIDAI latency." },
      ],
    },
    nodata: {
      impact: "We can't confirm Aadhaar health right now.",
      actions: [{ a: "team", t: "Verify the monitor can reach UIDAI." }],
    },
  },
  icops: {
    down: {
      impact: "You will not be able to send warrants to the police digitally.",
      actions: [
        { a: "team", t: "Re-queue the failed dispatches." },
        { a: "team", t: "Review validation errors with State Police IT." },
      ],
    },
    unstable: {
      impact:
        "Some summons dispatches are failing validation and need re-sending.",
      actions: [
        {
          a: "team",
          t: "Re-queue failed dispatches; review with State Police IT.",
        },
      ],
    },
    nodata: {
      impact:
        "We can't confirm iCoPS health right now; dispatch status is unknown.",
      actions: [{ a: "team", t: "Verify the monitor can reach the endpoint." }],
    },
  },
};

const MAINTENANCE_COPY = {
  impact: "Planned maintenance window — a short interruption is expected.",
  actions: [],
};

/* ==================================================================
 * API → store mapping
 * ================================================================== */

/* Normalise the API's lastStatus string onto our status ids. */
const STATUS_MAP = {
  UP: "live",
  LIVE: "live",
  OK: "live",
  DOWN: "down",
  DEGRADED: "unstable",
  UNSTABLE: "unstable",
  MAINTENANCE: "maintenance",
  UNKNOWN: "nodata",
};

export function normalizeStatus(apiStatus) {
  return (
    STATUS_MAP[
      String(apiStatus || "")
        .toUpperCase()
        .trim()
    ] || "nodata"
  );
}

function slug(name) {
  return String(name || "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/* Build the store's `items` map from the raw API rows.
 * items[internalId] = { status, since, lastChecked, apiMessage, responseTimeMs, serviceUrl, apiServiceName, apiId } */
export function buildStore(apiRows, now = Date.now()) {
  const items = {};
  for (const row of apiRows || []) {
    const apiName = row.serviceName || "";
    const id = SERVICE_ID_BY_API[apiName.toUpperCase().trim()] || slug(apiName);
    items[id] = {
      status: normalizeStatus(row.lastStatus),
      // The API reports the last poll time, not "since this state began".
      // Keep `since` null until the backend provides an outage-start timestamp.
      since: null,
      lastChecked: row.lastUpdatedTime || now,
      apiMessage: row.message || null,
      responseTimeMs:
        typeof row.responseTimeMs === "number" ? row.responseTimeMs : null,
      serviceUrl: row.serviceUrl || null,
      apiServiceName: apiName || null,
      apiId: row.id ?? null,
    };
  }
  return { items };
}

/* ==================================================================
 * Selectors
 * ================================================================== */
export function loginState(items) {
  const smsPresent = !!items.sms;
  const emailPresent = !!items.email;
  const smsAvail = smsPresent ? AVAILABLE.has(items.sms.status) : false;
  const emailAvail = emailPresent ? AVAILABLE.has(items.email.status) : false;
  // Sign-in is only truly blocked when BOTH OTP channels are monitored and down.
  const loginBlocked = smsPresent && emailPresent && !smsAvail && !emailAvail;
  return { smsPresent, emailPresent, smsAvail, emailAvail, loginBlocked };
}

export function resolveItem(id, items, now) {
  const rec = items[id];
  if (!rec) return null;
  const meta = getMeta(id, rec.apiServiceName);
  const status = rec.status;
  const login = loginState(items);

  let impact = "Working normally.";
  let actions = [];
  let note = null;

  if (status === "maintenance") {
    impact = MAINTENANCE_COPY.impact;
  } else if (status !== "live") {
    const c = (COPY[id] && COPY[id][status]) || {};
    impact = c.impact || "This service is currently unavailable.";
    actions = (c.actions || []).map((a) => ({ ...a }));
    note = c.note || null;
  }

  // Cross-channel safety: if both OTP channels are down, don't suggest the other.
  if (
    (id === "sms" || id === "email") &&
    login.loginBlocked &&
    status !== "live"
  ) {
    actions = actions.filter((a) => a.a !== "user");
    actions.unshift({
      a: "user",
      t: "Sign-in is unavailable — both OTP channels are down. Try again shortly or contact support.",
      escalation: true,
    });
  }

  let cascade = null;
  if (
    meta.needsAuth &&
    login.loginBlocked &&
    (status === "live" || status === "unstable")
  ) {
    cascade =
      "Sign-in is down, so OTP authentication for this service will also fail.";
  }

  return {
    ...meta,
    status,
    since: rec.since,
    lastChecked: rec.lastChecked,
    durationMs: rec.since ? Math.max(0, now - rec.since) : 0,
    impact,
    actions,
    note,
    cascade,
    // Live diagnostic signal straight from the probe.
    diagnostic: rec.apiMessage,
    responseTimeMs: rec.responseTimeMs,
    serviceUrl: rec.serviceUrl,
  };
}

/* Role-aware, present-in-API list. Iterates the fetched items (not the full
 * catalogue) so only monitored services show; unknown services get fallbacks. */
export function resolveVisible(items, now, role) {
  return Object.keys(items)
    .map((id) => resolveItem(id, items, now))
    .filter((it) => it && it.audience.includes(role));
}

/* ---- Role-aware overall verdict ---------------------------------- */
export function overallVerdict(items, now, role) {
  const all = resolveVisible(items, now, role);
  const login = loginState(items);
  const down = all.filter((x) => x.status === "down");

  if (all.length === 0) {
    return {
      tone: "nodata",
      headline: "No integrations to show",
      detail: "There are no monitored services for this view yet.",
    };
  }
  if (login.loginBlocked) {
    return {
      tone: "down",
      headline: "Sign-in unavailable",
      detail: "Both SMS and Email OTP are down, so users cannot sign in.",
    };
  }
  if (down.length) {
    const s = down.length > 1 ? "s" : "";
    return {
      tone: "down",
      headline: `${down.length} system${s} down`,
      detail: `${down.map((d) => d.name).join(", ")} unavailable and need immediate attention.`,
    };
  }
  return {
    tone: "live",
    headline: "All systems operational",
    detail: "No incidents in the last few minutes.",
  };
}
