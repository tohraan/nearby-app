# Project Context

## Origin

Hackathon brief (deliberately vague/contradictory). No clarifications allowed post-start. Submission: repo + README, due Sep 10 2026 10:00 AM.

## Brief, raw

Nearby-discovery app. Show cool stuff (food/events/whatever) near user, right now. Two must-haves: (1) works offline, (2) live updates when nearby friends find stuff — "the whole magic." Save spots, persists. "Logged in" but no accounts system. Weekend build, scrappy, effortless.

## Contradictions identified + our resolution

| Tension | Resolution |
|---|---|
| Offline vs. live social updates | Two-layer: core discovery = bundled offline dataset, zero dependency. Social layer = opportunistic sync, simulated for demo. |
| "Logged in" vs. no accounts | Anonymous device ID (client UUID, local storage). No email/password/OAuth. |
| Weekend vs. real-time infra | Fake the hard infra (live presence) with seeded data. Build offline+save for real. |
| Personalization (chat/groups) vs. zero-friction onboarding | No blocking onboarding screen. Name/interests/area asked contextually, only when Chat or Hangout Groups first opened. Skippable. Location via native OS permission prompt, not custom form. |

## Product vision

See what's good nearby, right now — incl. what friends just found — without signing up or losing signal. Chat naturally to get paired recommendations. Join hangouts to meet people with shared interests.

## ICP

UAE city resident/visitor (Dubai/Abu Dhabi/Sharjah), mobile-first, frequent signal dead-zones (malls/metro/parking), socially plugged-in, wants spontaneous low-effort discovery. Dislikes exhaustive/impersonal tools (Google Maps/TripAdvisor) and non-persistent group-chat recs.

## Aha moment

Live "🟢 someone nearby just found X" ping appears while browsing.

## Data source

OpenStreetMap via Overpass API. Free, no key, community-maintained, ODbL licensed (attribution required). Pre-fetch UAE dataset (Dubai/Abu Dhabi/Sharjah, food/cafe/cinema/event tags) at build time → static bundle. This bundle IS the offline story — no live Overpass dependency during demo/runtime.

## AI layer

OpenRouter API (small/cheap model). Single-agent, tool-free, retrieval-grounded chat — NOT multi-agent, NOT booking/itinerary planning. Rules:
- Only recommend places present in cached dataset — never invent.
- Prompt context = user profile (if given) + live lat/lng + pre-filtered nearby subset of cached places (radius-filtered before sending, keeps prompt small + hallucination risk low).
- Response = structured place IDs + short reasoning → frontend renders real PlaceCard components. LLM prose is narration around cards, not the source of truth.
- Chat requires connectivity. Offline → chat disables with honest message, rest of app unaffected.

## Explicitly deferred (do not build this weekend)

Real-time presence at scale, real user reviews + moderation, real accounts/cross-device login, private DMs, group approval/capacity/privacy settings, push notifications, multi-agent AI, booking/pricing/availability integrations.

## Full feature list

See FEATURE_LIST.md.
