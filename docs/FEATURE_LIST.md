# Feature List

## From brief (explicit/implied)

| # | Feature | Priority |
|---|---|---|
| 1 | Nearby feed — food/events/whatever's fun, right now | P0 |
| 2 | Full offline functionality (core discovery) | P0 |
| 3 | Live updates — nearby friends found something | P0 (simulated) |
| 4 | Save spots, revisit later | P0 |
| 5 | Reliable local persistence, no data loss | P0 |
| 6 | Saved list follows device, no real accounts | P0 |

## Added this project

| # | Feature | Priority | Notes |
|---|---|---|---|
| 7 | Category filters (food/events/outdoor/etc.) | P1 | |
| 8 | Rank by review recency, not just star avg | P1 | Differentiator vs Google Maps-style |
| 9 | Static ratings/reviews from bundled dataset | P1 | No live review pipeline |
| 10 | Online/offline sync status indicator | P1 | Honest state UX |
| 11 | Map view w/ pins (list = P1 fallback) | P1 | |
| 12 | Places render as real UI cards, not text | P0 | Feed + live pings + chat results |
| 13 | Normalized data adapter: OSM raw → clean `Place` schema | P0 (arch) | Decouples UI from data source |
| 14 | **Combo Search** — "coffee then movies" → paired, geo-close results | P1 | LLM intent-extraction call; offline fallback = local keyword match |
| 15 | **Hangout Groups** — create group anchored to place(s), open join, in feed | P1 | Reuses live-activity infra |
| 16 | Group shared activity thread (posts, not DMs) | P1 | Fakes "connect" w/o real messaging infra |
| 17 | Display name (typed once, local) | P1 | Powers groups + chat personalization |
| 18 | **AI Chat tab** — natural language → grounded place recommendations | P1 | OpenRouter, single-agent, cached-places-only, offline-disabled |
| 19 | Contextual personalization (name/interests/area) — not onboarding, asked on first Chat/Group use | P1 | Skippable, degrades to generic recs |

## Explicitly deferred (name in README, do not build)

- Real-time presence at scale / real friend graph
- Real user-submitted reviews + moderation
- Real accounts / cross-device login
- Private 1:1 messaging (DMs)
- Group approval flow, capacity limits, privacy settings
- Push notifications
- Multi-agent AI architecture
- Booking/availability/pricing integrations

## Screens (final)

- **Nearby** (feed: list/map toggle, category filters, combo search bar, live activity strip, group cards)
- **Saved** (offline-capable list)
- **Chat** (dedicated tab, AI-grounded recommendations)
- **Group detail** (join, activity thread) — reached via card tap, not a tab
