# CarbMap 🗺️

A local web app that analyses cycling GPX routes and generates personalised pacing, climb, nutrition, and weather plans.

## Quick Start

You need Node.js 18+ installed.

### Terminal 1 — Backend (port 3001)

```bash
cd server
npm install
npm run dev
```

### Terminal 2 — Frontend (port 5173)

```bash
cd client
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Usage

1. Upload a `.gpx` file (any real cycling route)
2. Enter your FTP (watts), body weight (kg), ride intensity, and planned start date/time
3. Click **Analyse My Ride**
4. Explore the 4 result tabs:
   - **🚴 Pacing Strategy** — NP, IF, TSS, per-segment power targets with flags
   - **⛰️ Climbs** — All climbs ≥4% over ≥500m with power suggestions
   - **🍌 Nutrition** — Hourly carb/fluid/sodium plan with food suggestions
   - **🌤️ Weather** — Forecast at start, 25%, 50%, 75%, finish + climb starts

## Tech Stack

- **Backend:** Node.js + Express + TypeScript (`ts-node-dev`)
- **Frontend:** React + Vite + TypeScript + Framer Motion + Zustand
- **Weather:** Open-Meteo (free, no API key required)

## No API Keys Required

Weather data comes from [Open-Meteo](https://open-meteo.com/) which is free and requires no registration.
