# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CarbMaps is a cycling route analysis web app that processes GPX/FIT/TCX files and generates pacing, climb, nutrition, and weather plans. It is privacy-first and stateless: the backend never writes to disk or a database. All ride persistence is client-side via localStorage.

## Session Setup

At the start of every Claude Code session, automatically start both servers in background shells:

```bash
# Backend (port 3001)
cd server && npm run dev   # run in background

# Frontend (port 5173)
cd client && npm run dev   # run in background
```

When the session ends, stop both background server processes.

## Commands

### Development (run both concurrently in separate terminals)

```bash
# Backend (port 3001)
cd server && npm run dev

# Frontend (port 5173, proxies /api/* to localhost:3001)
cd client && npm run dev
```

### Build

```bash
cd server && npm run build   # tsc → dist/
cd client && npm run build   # tsc + vite build
```

### Start production

```bash
cd server && npm start   # node dist/index.js
```

```bash
cd server && npm test   # Jest — runs climb detection unit tests
```

### Deploy to production

```bash
git checkout deploy
git merge main
git push origin deploy
git checkout main
```

Pushing to the `deploy` branch triggers an automatic deploy on DigitalOcean App Platform (frontend = static site, backend = web service). Never push feature work directly to `deploy`.

## Architecture

### Monorepo structure

```
client/   React 18 + Vite + TypeScript (frontend)
server/   Express + TypeScript (backend)
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:3001`. In production, `VITE_API_URL` sets the backend URL.

### Backend: stateless compute server

**Entry point:** `server/src/index.ts` — sets up Express, rate limiting (express-rate-limit + Bottleneck for Strava), CORS, Helmet, Multer file uploads.

**Request flow for analysis:**
1. `POST /api/analyze` (`routes/analyze.ts`) receives a multipart form with a GPX/FIT/TCX file + rider settings (FTP, weight, intensity 50–110, optional startDateTime)
2. `ingestion/index.ts` dispatches to the right parser; GPX uses regex as primary with gpxparser library as fallback
3. All four engines run in-memory and return their results:
   - `pacing.engine.ts` — 1km segments, power zones, NP/IF/TSS using 4th-power mean and cubic Newton's method for speed
   - `climbs.engine.ts` — detects climbs ≥4% grade, ≥500m
   - `nutrition.engine.ts` — hourly carb/fluid/sodium plan (60–90 g/hr carbs)
   - `weather.engine.ts` — calls Open-Meteo at up to 6 route points (requires startDateTime)
4. Server responds with the combined `AnalysisResult` — nothing is stored

**Other routes:**
- `POST /api/rides/:id/reanalyze` — same flow but reads GPX from the multipart body (client re-sends the stored GPX)
- `POST /api/rides/:id/weather` — weather-only refresh
- `GET /api/strava/auth`, `POST /api/strava/callback`, `POST /api/strava/analyze-route/:routeId` — Strava OAuth + route fetch

**Rate limiting:** `/api/analyze` is limited to 60 req/60s. Strava endpoints use Bottleneck: global 90 req/15 min + per-user 15 req/15 min keyed by `hash(ip + access_token)`.

### Frontend: state machine + localStorage

**State machine** (`store/analysisStore.ts` — Zustand): `idle → loading → results`. `App.tsx` orchestrates URL syncing (`?ride=<id>` loads a saved ride; `?code=<code>&state=carbmaps` handles Strava OAuth callback).

**API calls + localStorage** live in `hooks/useAnalysis.ts`:
- On successful analysis, stores the full result in `carbmaps_rides` (JSON array) and the raw GPX in `carbmaps_gpx_${id}`
- Reanalysis reads the GPX from localStorage, re-POSTs to the server, then updates state

**Rider settings** (`carbmaps_ftp`, `carbmaps_weight`) are optionally persisted to localStorage by `UploadForm`.

**Results view** has five tabs: PacingTab, ClimbsTab, NutritionTab, WeatherTab, CueSheetTab — all in `client/src/components/tabs/`.

**Strava OAuth** is managed by `hooks/useStrava.ts` + `lib/stravaAuth.ts` (token storage/refresh in localStorage).

### Carb Vendors feature

On-demand OpenStreetMap Overpass search for restaurants, cafés, bakeries, and fast food within 500m of the route. Results are thinned to one per km to keep the map readable. No API key required.

### External APIs (no keys required except Strava)

- **Open-Meteo** — weather forecasts
- **OpenStreetMap Overpass** — carb vendor search
- **Strava** — requires `STRAVA_CLIENT_ID` + `STRAVA_CLIENT_SECRET` env vars

### Design system

CSS custom properties in `client/src/styles/globals.css`. Warm editorial palette:
- Background: `--bg-base: #F4EDE3` (cream), `--bg-surface: #FFFFFF`
- Accent: `--accent-gold: #C9A96E`, `--accent-primary: #1A1A18` (near-black)
- Fonts: Raleway (UI), MedievalSharp (logo only) — both from Google Fonts
- Border-radius tokens: `--radius-sm: 2px` through `--radius-xl: 8px`
- Animations via Framer Motion (`AnimatePresence` + `motion.div`)

### TypeScript

Both packages use strict mode. Shared type concepts are defined separately in `client/src/types/analysis.ts` and `server/src/types/`. The engines return typed results; keep the client and server type definitions in sync when changing the analysis output shape.

### Engine research files

Before modifying any engine formula or threshold, read the relevant research file at the repo root:
- `pacing-research.md` — power zone model, NP/IF/TSS derivation, physics assumptions
- `nutrition-research.md` — carb oxidation rates, fluid/sodium targets, food suggestion logic

These document the published research behind the numbers.

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | server | Express port (default 3001) |
| `ALLOWED_ORIGINS` | server | Comma-separated CORS origins for production |
| `STRAVA_CLIENT_ID` | server | Strava OAuth app ID (required for Strava features) |
| `STRAVA_CLIENT_SECRET` | server | Strava OAuth app secret (required for Strava features) |
| `VITE_API_URL` | client | Backend base URL (omit in dev; proxy handles it) |
