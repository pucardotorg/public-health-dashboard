# OnCourts — Public-Facing Integration Status Dashboard

Front-end for the OnCourts (Kerala Courts Platform) **Integration Status** page
tracked in [dristi#5807](https://github.com/pucardotorg/dristi/issues/5807).

> **Front-end only · mock data, not live.** The backend polling service is not
> finalised yet, so every status, timestamp and message is illustrative dummy
> data defined in [`src/data/store.js`](src/data/store.js). When the real health
> API lands, swap the data layer — the component tree stays the same.

## Stack

- **React 19** + **Vite 6** (latest), run on **Node 22 LTS**
- **Tailwind CSS 3.4** with HSL design tokens (light + dark)
- **Radix UI** primitives (dialog/sheet, toggle-group, tooltip) + **lucide-react** icons

## Run

```bash
nvm use 22          # requires Node 18+, tested on 22.22
npm install
npm run dev         # http://localhost:5173
npm run build       # production build → dist/
npm run preview     # serve the build (uses the prod base path, see below)
```

## Deployment — base path

In production the app is served from a **sub-path** on the landing-page host:

```
https://oncourts.kerala.gov.in/public-health-dashboard/
```

So the build prefixes every asset URL with `/public-health-dashboard/`. This is
set once in [`vite.config.js`](vite.config.js) via Vite's `base` option:

- **`npm run dev`** → served at `/` (root) for local convenience.
- **`npm run build` / `npm run preview`** → served at `/public-health-dashboard/`
  (matches prod). Built `index.html` references e.g.
  `src="/public-health-dashboard/assets/index-*.js"`.

DevOps just needs to serve the contents of `dist/` under that sub-path (and add
an SPA fallback so deep links rewrite to `index.html`). To change the sub-path,
edit the `BASE_PATH` constant in `vite.config.js`.

## What's implemented (matches the Figma handover)

- **App bar** — OnCourts brand, EN / Support, dark-mode toggle, account avatar.
- **Viewing as** perspective switch — All · Advocate · Court staff · Internal
  (Advocate/Court-staff see fewer integrations; a footnote states how many are hidden).
- **Integration health hero** — adaptive verdict ("All systems operational" /
  "N systems down" / "Sign-in unavailable"), "Refresh all", and a parts-of-whole
  status-breakdown bar.
- **Current integrations** — searchable, filterable (All / Needs attention /
  Operational) grid of system cards. Down cards carry a red rail + tint and show
  "since HH:MM". Each card has a **Re-check** action.
- **Detail drawer** — opens on card click: status badge, "since / checked",
  plain-language impact, "What you can do", **Re-check** + **Report a problem**.
- **Responsive** — three-column desktop grid collapses to a single-column mobile
  list; the demo bar offers a phone-frame preview.
- **Accessibility** — status conveyed by label + colour + position (never colour
  alone), visible borders, keyboard-operable cards, focus rings.

## Demo controls (bottom bar)

- **Demo scenario** — Incident · All operational · Sign-in down
- **View** — Desktop / Mobile (phone-frame preview via `?embed=1` iframe)
- **Flip systems** — manually toggle any integration Down / Operational

## Structure

```
src/
  App.jsx                 page shell, perspective + filter state, layout, demo bar
  data/store.js           integrations, statuses, scenarios, verdict logic (mock)
  lib/ui.jsx              status tokens (label/colour/dot), IST time helpers
  lib/utils.js            cn() class merge
  components/
    StatusHero.jsx        "Integration health" summary + breakdown chart
    SystemCard.jsx        one integration card
    DetailDrawer.jsx      the detail side panel
    ui/                   Radix-based primitives (button, sheet, toggle-group, tooltip)
```
