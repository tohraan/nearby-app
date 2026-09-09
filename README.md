# NearbyApp 🗺️

> See what's good nearby, right now — including what friends just found — without signing up or losing signal.

A nearby-discovery PWA for UAE (Dubai, Abu Dhabi, Sharjah) with offline-first architecture, AI-powered chat recommendations, and social hangout groups. Built with a bold Neo-Brutalist design system.

## 🚧 Status: In Development

---

## Features

| Feature | Status |
|---|---|
| Nearby feed — food/events/whatever's fun | 🔄 Building |
| Full offline functionality | 🔄 Building |
| Live social activity pings | 🔄 Building |
| Save spots, revisit later | 🔄 Building |
| Category filters | 🔄 Building |
| Map + list view | 🔄 Building |
| AI Chat — natural language recommendations | 🔄 Building |
| Hangout Groups — meet like-minded people | 🔄 Building |
| Combo Search — "coffee then movies" | 🔄 Building |

## Tech Stack

- **Frontend**: React (Vite), Vanilla CSS (Neo-Brutalist), Leaflet, IndexedDB
- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Data**: OpenStreetMap (Overpass API) — pre-fetched, bundled
- **AI**: OpenRouter API (grounded, single-agent chat)
- **Auth**: Anonymous device UUID — no accounts required

## Setup

```bash
# Clone
git clone https://github.com/tohraan/nearby-app.git
cd nearby-app

# Backend
cd backend && npm install && cp ../.env.example .env
# Edit .env with your OpenRouter API key
npm run seed    # Seed demo data
npm start       # Runs on :3001

# Frontend
cd ../frontend && npm install
npm run dev     # Runs on :5173
```

## Data Attribution

Place data sourced from [OpenStreetMap](https://www.openstreetmap.org/) via the Overpass API.
© OpenStreetMap contributors. Data available under the [ODbL](https://opendatacommons.org/licenses/odbl/).

## Explicitly Deferred

These features are acknowledged but intentionally not built for this weekend scope:

- Real-time presence at scale / real friend graph
- Real user-submitted reviews + moderation
- Real accounts / cross-device login
- Private 1:1 messaging (DMs)
- Group approval flow, capacity limits, privacy settings
- Push notifications
- Multi-agent AI architecture
- Booking/availability/pricing integrations

---

Built for hackathon submission — Sep 2026
