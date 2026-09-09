# Backend Spec

## Scope

Thin. 4 route files. No queues, no microservices, no heavy ORM. DB: SQLite (fastest to stand up) or Supabase free tier (if you want hosted + easy from frontend).

## Data model

```
Place (from bundled JSON, not DB — read-only at runtime)
  id, name, category, lat, lng, rating, review_count, last_review_at

Save
  device_id TEXT, place_id TEXT, saved_at DATETIME
  PK(device_id, place_id)

ActivityEvent   -- simulated/seeded for demo
  id, device_id (anonymized), place_id, created_at

Group
  id, name, place_id (nullable if series), creator_device_id,
  description, starts_at, created_at

GroupMember
  group_id, device_id, joined_at
  PK(group_id, device_id)

GroupPost        -- shared thread, not DMs
  id, group_id, device_id, text, created_at

UserProfile       -- optional, contextual capture, not accounts
  device_id PK, display_name, interests TEXT[], area TEXT
```

## Endpoints

```
GET    /saves/:deviceId              → list saved places
POST   /saves                        → { deviceId, placeId }
DELETE /saves/:deviceId/:placeId

GET    /nearby-activity?lat&lng      → recent seeded ActivityEvents near location
POST   /activity                     → (demo/seed use, or real save-triggers-ping)

GET    /groups?lat&lng               → nearby groups
POST   /groups                       → create
POST   /groups/:id/join              → { deviceId }
GET    /groups/:id/posts
POST   /groups/:id/posts             → { deviceId, text }

POST   /profile                      → { deviceId, displayName, interests, area }
GET    /profile/:deviceId

POST   /chat                         → { deviceId, message, lat, lng }
                                        → server: radius-filter cached places,
                                          build prompt, call OpenRouter,
                                          return { reply, placeIds[] }
```

## Auth

None (no accounts). `deviceId` = client-generated UUID, sent as header or body field on every call. Treat as a weak identity — fine for hackathon scope, name this limitation in README.

## Chat endpoint detail

1. Receive message + deviceId + live lat/lng.
2. Load `UserProfile` if exists (else proceed generic).
3. Filter bundled `Place` dataset to radius around lat/lng (e.g. 3-5km) — keep prompt small.
4. Build prompt: system rule = "only recommend from this list, never invent a place, return place IDs"; inject filtered place list + user profile + message.
5. Call OpenRouter (pick a cheap/fast model — no need for a large model for this task).
6. Parse structured response (place IDs + short reasoning).
7. Return to frontend; frontend renders PlaceCard for each ID (never trust LLM prose alone for place data — always resolve ID → local Place object).

## Offline behavior

- `/saves`, group creation, chat — all require connectivity, by nature (write to shared backend / call LLM).
- Frontend queues writes (saves, group joins) locally when offline, syncs on reconnect (standard offline-first queue pattern).
- Chat has no offline fallback — disable with clear message, do not fake a broken chat experience.

## Explicitly not built

Real auth/JWT, rate limiting beyond basic sanity checks, moderation/abuse tooling for group posts, websocket real-time (polling is enough for demo), horizontal scaling concerns.
