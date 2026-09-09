# Project Structure

Stack assumption: React PWA frontend (offline via IndexedDB/service worker), tiny Node/Express (or equivalent) backend, SQLite/Supabase free tier for shared state (saves sync, activity events, groups).

```
/nearby-app
├── /data
│   ├── fetch-overpass.js        # one-time script: pull UAE places from Overpass API
│   ├── normalize.js             # OSM raw tags → Place schema (adapter layer)
│   └── uae-places.json          # bundled static dataset, ships with app
│
├── /frontend
│   ├── /src
│   │   ├── /components
│   │   │   ├── PlaceCard.jsx
│   │   │   ├── GroupCard.jsx
│   │   │   ├── ActivityPing.jsx
│   │   │   ├── CategoryChips.jsx
│   │   │   ├── SyncStatusBadge.jsx
│   │   │   └── ChatMessage.jsx
│   │   ├── /screens
│   │   │   ├── NearbyFeed.jsx
│   │   │   ├── SavedList.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── GroupDetail.jsx
│   │   ├── /lib
│   │   │   ├── deviceId.js      # generate/read persistent anon UUID
│   │   │   ├── db.js            # IndexedDB wrapper (saves, cached places, profile)
│   │   │   ├── comboSearch.js   # geo-pairing logic
│   │   │   └── offlineSync.js   # queue + reconcile on reconnect
│   │   ├── /hooks
│   │   │   └── useGeolocation.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── /public
│   │   └── service-worker.js
│   └── package.json
│
├── /backend
│   ├── /routes
│   │   ├── saves.js             # GET/POST /saves/:deviceId
│   │   ├── activity.js          # GET /nearby-activity, POST /activity (seeded/simulated)
│   │   ├── groups.js            # CRUD + join for Hangout Groups
│   │   └── chat.js              # POST /chat → OpenRouter call, grounded on cached places
│   ├── /lib
│   │   ├── openrouter.js        # LLM client wrapper
│   │   └── placeContext.js      # radius-filter cached places before prompt
│   ├── db.sqlite (or Supabase config)
│   └── server.js
│
├── /docs
│   ├── PROJECT_CONTEXT.md
│   ├── FEATURE_LIST.md
│   ├── PROJECT_STRUCTURE.md     # this file
│   ├── DESIGN.md                # already have
│   └── BACKEND.md
│
├── README.md
└── .env.example
```

## Directory purpose notes

- `/data`: build-time only. Run once before demo, commit the output `uae-places.json`. App never depends on live Overpass at runtime.
- `/frontend/lib/db.js`: single source of truth for local persistence — saves, cached places, user profile all live here. IndexedDB, not localStorage (handles larger place dataset better).
- `/backend`: intentionally thin. 4 route files, no queues, no microservices, no ORM required (raw SQLite driver or Supabase client is enough).
- Chat and Groups are the only features touching the backend live; Nearby/Saved work fully from local `/data` bundle + IndexedDB.
