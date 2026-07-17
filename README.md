# OnCourts — Public-Facing Integration Status Dashboard

Front-end for the OnCourts (Kerala Courts Platform) **Integration Status** page
tracked in [dristi#5807](https://github.com/pucardotorg/dristi/issues/5807).

> **Live data.** Statuses come from the backend health API
> (`GET {host}/health-dashboard/v1/services/status`). The API client is
> [`src/lib/api.js`](src/lib/api.js) and the response→UI mapping lives in
> [`src/data/store.js`](src/data/store.js). Display copy (impact text, guidance,
> which perspective sees a service) is authored in `store.js`; live status,
> timestamps and probe messages come from the API.

## Stack

- **React 19** + **Vite 6** (latest), run on **Node 22 LTS**
- **Tailwind CSS 3.4** with HSL design tokens (light + dark)
- **Radix UI** primitives (dialog/sheet, toggle-group, tooltip) + **lucide-react** icons

## Run

```bash
nvm use 22          # requires Node 18+, tested on 22.22
npm install
npm run dev         # http://localhost:5173 (proxies the API to dev backend)
npm run build       # production build → dist/  (mode: production)
npm run build:dev   # build for the dev environment
npm run build:uat   # build for UAT
npm run build:prod  # build for prod (same as `npm run build`)
npm run preview     # serve the build locally
```

## Deployment — base path

In production the app is served from a **sub-path** on the landing-page host:

```
https://oncourts.kerala.gov.in/health/
```

So the build prefixes every asset URL with `/health/`. This is
set once in [`vite.config.js`](vite.config.js) via Vite's `base` option:

- **`npm run dev`** → served at `/` (root) for local convenience.
- **Any build (`build` / `build:dev` / `build:uat` / `build:prod`) + `npm run preview`**
  → served at `/health/` (matches prod). Built `index.html`
  references e.g. `src="/health/assets/index-*.js"`.

> The API request stays origin-relative (`/health-dashboard/...`) — it is **not**
> affected by this base path, since the API lives at the host root, not under the
> dashboard's sub-path.

DevOps just needs to serve the contents of `dist/` under that sub-path (and add
an SPA fallback so deep links rewrite to `index.html`). To change the sub-path,
edit the `BASE_PATH` constant in `vite.config.js`.

## Live data & environments

The dashboard calls `GET {VITE_API_BASE_URL}{VITE_HEALTH_STATUS_PATH}` on page
load and then **polls every `VITE_REFRESH_INTERVAL_MS`** (default **3 minutes**)
while the page stays open. There is **no manual refresh button** (a public one
could be spammed); the poll is automatic and users can also reload the page. Each
card shows **"Last updated at"** the service's `lastUpdatedTime` as an absolute
IST time (time-only if today, else `DD/MM/YYYY h:mm AM/PM`). Config is per
environment via `.env` files (see [`.env.example`](.env.example)):

| File               | Mode / branch                                       | Purpose                                                    |
| ------------------ | --------------------------------------------------- | ---------------------------------------------------------- |
| `.env`             | all                                                 | shared defaults (endpoint path, API origin, poll interval) |
| `.env.development` | `npm run dev`, `build:dev` · `develop` branch → dev | dev API base + local proxy target                          |
| `.env.uat`         | `build:uat` · `main` branch → UAT                   | UAT API base                                               |
| `.env.production`  | `build`/`build:prod` · `main` branch → prod         | prod API base                                              |
| `.env.local`       | any (git-ignored)                                   | personal overrides                                         |

**Same-origin by default.** `VITE_API_BASE_URL` is empty in every env, so the
browser requests the API _relative to whatever host the dashboard is served
from_ — no CORS, and nothing to change per environment. This assumes the
dashboard is served on the **same host** as the API in each environment.

- **Local dev:** `npm run dev` runs a Vite proxy (see [`vite.config.js`](vite.config.js))
  that forwards `/health-dashboard/*` to `VITE_DEV_API_TARGET`
  (default `https://dristi-kerala-dev.pucar.org`), so the browser stays
  same-origin and there's no CORS while developing.
- **Cross-origin hosting** (only if the dashboard is on a _different_ domain than
  the API): set an absolute `VITE_API_BASE_URL` in that env's file and have the
  backend send CORS headers for the dashboard's origin.

### Branch → environment flow

```
develop ──build:dev──▶ DEV
   main ──build:uat──▶ UAT ──(sign-off)──▶ build:prod ──▶ PROD
```

## What's implemented

- **Integration health hero** — adaptive verdict ("All systems operational" /
  "N systems down" / "Sign-in unavailable") + a parts-of-whole status-breakdown bar.
- **Current integrations** — searchable, filterable (All / Needs attention /
  Operational) grid of system cards. Down cards carry a red rail + tint. Each card
  shows **"Last updated at &lt;time&gt;"** for that service (absolute IST — time
  only if today, else `DD/MM/YYYY h:mm AM/PM`).
- **Detail drawer** — opens on card click: status badge, "Last updated at",
  plain-language impact, "What you can do", the live probe **"Last check"** message
  (+ response time), and **Report a problem**.
- **Responsive** — three-column desktop grid collapses to a single-column mobile list.
- **Accessibility** — status conveyed by label + colour + position (never colour
  alone), visible borders, keyboard-operable cards, focus rings.
- **Auto-refresh** — fetched on page load and re-polled every 5 min
  (`VITE_REFRESH_INTERVAL_MS`); **no manual refresh button** (see _Live data &
  environments_ above).

> **Temporarily disabled:** the **"Viewing as"** perspective switch (All / Advocate
> / Court staff / Internal) is commented out in `App.jsx` until there's more than
> one role to show — every service is currently shown under the default _All_
> view. The role metadata (`audience`) and filtering logic remain in `store.js`,
> so re-enabling is just uncommenting the block.

## Structure

```
src/
  App.jsx                 page shell: fetch-once, filter/search state, layout
  data/store.js           catalogue + API→UI mapping + authored copy + selectors
  lib/api.js              health-API client (endpoint URL from env)
  lib/ui.jsx              status tokens (label/colour/dot), IST time formatters
  lib/utils.js            cn() class merge
  components/
    StatusHero.jsx        "Integration health" verdict + breakdown chart
    SystemCard.jsx        one integration card
    DetailDrawer.jsx      the detail side panel
    ui/                   Radix-based primitives (button, sheet, toggle-group, tooltip)
```
