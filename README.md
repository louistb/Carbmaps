# CarbMaps

> Eat carbs, ride hard.

CarbMaps analyses cycling GPX routes and generates personalised pacing, climb, nutrition, and weather plans — all in the browser. No login, no account, no data stored on the server. Everything lives in your browser's local storage.

**Live app:** [carbmaps.app](https://carbmaps.app)

> **100% AI-generated codebase** — every line of code in this repository was written by Claude (Anthropic). The science behind the pacing, nutrition, and climb logic is documented in the `.md` files alongside the engine modules — if you're digging into the logic, start there.
>
> **Sport scientists and coaches welcome.** The formulas and targets used in the engines (power zones, carb oxidation rates, sodium loss, climb difficulty scoring) are based on published research but may not reflect the latest evidence or edge cases. If you have a background in sport science or coaching and spot something worth improving, please open a pull request — those contributions are especially valued.

---

## Features

- **Pacing Strategy** — NP, IF, TSS, per-segment power targets, hold-back flags for the climbs
- **Climbs** — Detects all climbs ≥4% over ≥500m with suggested power and severity rating
- **Nutrition** — Hourly carb / fluid / sodium plan with food suggestions and a collapsible view for long rides
- **Weather** — Forecast at start, 25%, 50%, 75%, finish and each climb start (requires a planned start date)
- **Cue Sheet** — Printable 4×2 inch card with key climbs and condensed fueling plan, stick it on your stem
- **Carb Vendors** — On-demand OpenStreetMap search for restaurants, cafés, bakeries and fast food within 500m of your route, thinned to one per km so it stays readable
- **Saved Rides** — All results stored in localStorage, reload or tweak intensity without re-uploading
- **Re-analysis** — Adjust ride intensity from the header and all tabs update live

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| State | Zustand |
| Animation | Framer Motion |
| Charts | Recharts |
| Maps | Leaflet + CartoDB Voyager tiles |
| Backend | Node.js, Express, TypeScript |
| Weather | Open-Meteo (free, no key needed) |
| Vendor search | OpenStreetMap Overpass API (free, no key needed) |

---

## Local Development

You need **Node.js 18+**.

**Terminal 1 — Backend (port 3001)**
```bash
cd server
npm install
npm run dev
```

**Terminal 2 — Frontend (port 5173)**
```bash
cd client
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

The Vite dev server proxies `/api/*` to `localhost:3001` automatically — no extra config needed.

---

## Environment Variables

### Backend (`server/`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default: `3001`) |
| `ALLOWED_ORIGINS` | Production | Comma-separated list of allowed frontend URLs for CORS |

Example `.env` for production:
```
ALLOWED_ORIGINS=https://carbmaps.app,https://www.carbmaps.app
```

### Frontend (`client/`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Production | Full URL of the backend (e.g. `https://api.carbmaps.app`). Leave unset in dev — the Vite proxy handles it. |

---

## Architecture

The server is **fully stateless** — it never writes anything to disk or a database. Every request is self-contained:

1. `POST /api/analyze` — receives GPX + rider settings, runs all engines in memory, returns JSON
2. `POST /api/rides/:id/reanalyze` — client sends the GPX back from localStorage with new intensity settings, server re-runs engines
3. `DELETE /api/rides/:id` — no-op, always returns `{ success: true }`

All persistence is on the client via `localStorage`:
- Ride metadata and analysis results → `carbmaps_rides`
- GPX file content (for re-analysis) → `carbmaps_gpx_{id}`
- FTP and weight → `carbmaps_ftp`, `carbmaps_weight`

---

## Deployment

The app is deployed on **DigitalOcean App Platform**:

- **Frontend** — Static Site (free tier), built from `client/`, output `dist/`
- **Backend** — Web Service ($5/month), built from `server/`, runs `node dist/index.js`

Pushing to the `deploy` branch triggers an automatic deploy.

```bash
# Ship to production
git checkout deploy
git merge main
git push origin deploy
git checkout main
```

---

## Contributing

Contributions are welcome. Here's how to get started:

1. Fork the repo and create a branch from `main`
2. Make your changes with clear, focused commits
3. Open a pull request against `main` — describe what you changed and why
4. Don't target the `deploy` branch directly — that's reserved for production deploys

**Sport scientists and coaches** — PRs that improve the accuracy of the pacing, nutrition, or climb engines are especially welcome. The scientific rationale for each engine is documented in the `.md` files in `server/src/engines/`. Please include references to the research or guidelines your changes are based on.

### Project Structure

```
carbmaps/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # UI components
│       │   ├── layout/      # Header, TabBar
│       │   ├── tabs/        # PacingTab, ClimbsTab, NutritionTab, WeatherTab, CueSheetTab
│       │   └── upload/      # UploadForm, SavedRidesList
│       ├── hooks/           # useAnalysis
│       ├── lib/             # localRides (localStorage helpers)
│       ├── store/           # Zustand store
│       ├── styles/          # globals.css (design tokens)
│       └── types/           # Shared TypeScript types
└── server/                  # Express backend
    └── src/
        ├── engines/         # pacing, climbs, nutrition, weather
        ├── ingestion/       # GPX parser
        ├── routes/          # /api/analyze, /api/rides
        └── types/           # Shared TypeScript types
```

### Design System

The UI uses a warm editorial palette defined as CSS custom properties in `client/src/styles/globals.css`:

```
--bg-base:        #F4EDE3   warm cream background
--accent-gold:    #C9A96E   primary accent
--text-primary:   #1A1A18   near-black
--text-muted:     #A8998C   secondary text
--border-subtle:  #E0D6C8   dividers
```

Fonts: **MedievalSharp** (logo only) + **Raleway** (all UI).

---

## No API Keys Required

Both external data sources are free and require no registration:
- [Open-Meteo](https://open-meteo.com/) — weather forecasts
- [OpenStreetMap Overpass API](https://overpass-api.de/) — restaurant/café data
