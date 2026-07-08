# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Front-end for the **OnCourts Integration Status** page (Kerala Courts platform), tracked in [dristi#5807](https://github.com/pucardotorg/dristi/issues/5807). It shows the health of external integrations (e-Payment, SMS, e-Sign, Aadhaar, Email, iCOPS) in plain language.

**Front-end only, mock data.** The backend polling/health API is not finalised. Every status, timestamp, and copy string is illustrative dummy data. The architecture's central design decision: **when the real API lands, replace the data layer (`src/data/store.js`) and the component tree stays unchanged.** Keep this contract intact — components consume `store` records and the resolve/verdict functions; they do not fetch or hardcode status.

## Commands

Requires Node 18+ (tested on Node 22 LTS).

```bash
npm install
npm run dev       # Vite dev server → http://localhost:5173
npm run build     # production build → dist/
npm run preview   # serve the build
```

There is no test runner, linter, or type checker configured — do not assume `npm test`/`npm run lint` exist.

## Architecture

Single-page React 19 app (Vite 6, Tailwind 3.4, Radix UI primitives, lucide-react icons). Entry: `index.html` → `src/main.jsx` → `src/App.jsx`. Import alias `@` → `src/` (configured in `vite.config.js`).

**Two-layer split:**

- **`src/data/store.js`** — the entire mock domain model and the *only* place status logic lives. Key exports:
  - `SERVICES` — the 6 monitored systems with `audience` (which roles see them), `authCritical`, `needsAuth`.
  - `SCENARIOS` / `makeScenario(id)` — builds a `store` of per-system status records (`incident`, `operational`, `signin-down`).
  - `resolveItem`, `resolveVisible`, `overallVerdict`, `loginState` — derive display state and the hero verdict from records. `overallVerdict` is role-aware and treats sign-in (SMS/Email OTP) specially.
  - `STATUS` taxonomy is Live/Unstable/Down/No-data/Maintenance, but **v1 only surfaces Down + Operational** (`STATUS_ORDER = ["down","live"]`); the others exist in the model for the future.
  - `ROLES` — All · Advocate · Court staff · Internal. Advocate/Staff see a filtered subset (`visibleServices(role)`).

- **`src/App.jsx`** — page shell holding all UI state (role/perspective, filter, search, dark mode, open drawer, demo scenario/view, re-check throttling). Renders `StatusHero` (summary + breakdown), a grid of `SystemCard`, and `DetailDrawer`. Also drives the bottom **demo bar** (scenario switch, desktop/mobile toggle, manual system flip).

- **`src/lib/ui.jsx`** — `STATUS_UI` maps each status to Tailwind token classes plus `StatusDot`/`StatusBadge`. Status is always conveyed by **label + colour + position, never colour alone** (accessibility requirement — preserve this when touching status rendering). Also holds IST/`headerStamp` time helpers.
- **`src/lib/utils.js`** — `cn()` (clsx + tailwind-merge).
- **`src/components/ui/`** — Radix-based primitives (button via CVA, sheet, toggle-group, tooltip).

**Mobile preview:** the demo "Mobile" view loads the app inside a phone-frame iframe with `?embed=1`; URL params (`scenario`, `role`, `open`, `embed`) are read on load in `App.jsx` so the preview mirrors the live controls.

## Styling conventions

Tailwind with **HSL design tokens** defined in `tailwind.config.js` / `src/index.css`, supporting light + dark themes (dark toggled via `.dark` class on `<html>`). Status colours use `st-*` token families (e.g. `text-st-down`, `bg-st-live-bg`). Prefer these tokens over raw colours so themes stay consistent.

## Data-safety rule (from store.js)

Mock diagnostic copy is deliberately sanitized: issue category / diagnostic signal only — **never credentials, IPs, hostnames, or contacts.** Keep any new mock or real-API-mapped copy to this standard.

## Further reading

`PROJECT_GUIDE.md` is a detailed developer walkthrough (background, scope decisions locked in the ticket, and how to extend when the backend arrives). `README.md` summarizes implemented features and demo controls.
