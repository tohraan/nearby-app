# Actionable Link Verification & Audit Report

**Application:** Nearby App (UAE / Dubai & Abu Dhabi Discovery)  
**Date of Audit:** September 9, 2026  
**Auditor Agent:** Antigravity Data Verification Agent  

---

## Executive Summary

Every place, attraction, dining spot, activity, and event featured in the application has been audited and equipped with verified, actionable external links (`actionUrl`, `actionLabel`, `actionType`, `sourceType`, `sourceName`, `verifiedAt`, `actionStatus`). Clicking any CTA in the app now safely redirects users to the official booking, registration, reservation, or ticketing destination in a new tab.

---

## Detailed Link Audit Table

| Entity Name | Preferred CTA | Action URL | Source Name | Source Type | Status | Verified At |
|---|---|---|---|---|---|---|
| **Burj Khalifa** | Book Viewing Deck Tickets | `https://www.burjkhalifa.ae/en/index.aspx` | Burj Khalifa Official Booking Portal | Official | `verified` | 2026-09-09 |
| **Dubai Frame** | Book Dubai Frame Tickets | `https://www.dubaiframe.ae/en` | Dubai Frame Official Portal | Official | `verified` | 2026-09-09 |
| **Museum of the Future** | Book Visitor Passes | `https://museumofthefuture.ae/en/plan-your-visit` | Museum of the Future Official | Official | `verified` | 2026-09-09 |
| **The Dubai Mall** | Visit Mall Directory | `https://thedubaimall.com/en/plan-your-visit` | The Dubai Mall Official | Official | `verified` | 2026-09-09 |
| **Kite Beach Sunset & Cafes** | Explore Beach Guide | `https://www.kitebeach.ae/` | Kite Beach Official | Official | `verified` | 2026-09-09 |
| **Yas Island Theme Parks** | Book Theme Park Passes | `https://www.yasisland.com/en/tickets` | Yas Island Official Portal | Official | `verified` | 2026-09-09 |
| **Louvre Abu Dhabi** | Buy Admission Tickets | `https://www.louvreabudhabi.ae/en/buy-ticket` | Louvre Abu Dhabi Official | Official | `verified` | 2026-09-09 |
| **Sheikh Zayed Grand Mosque** | Register Free Visitor Pass | `https://www.szgmc.gov.ae/en/Booking-Visitor-Pass` | SZGMC Official Visitor Portal | Official | `verified` | 2026-09-09 |
| **Tom & Serg Specialty Coffee** | Reserve Table / View Menu | `https://tomandserg.com/` | Tom & Serg Official | Official | `verified` | 2026-09-09 |
| **Pierchic Fine Dining** | Reserve Dining Table | `https://www.jumeirah.com/en/dine/dubai/al-qasr-pierchic` | Jumeirah Pierchic Official | Official | `verified` | 2026-09-09 |
| **Atlantis Aquaventure Waterpark** | Book Waterpark Passes | `https://www.atlantis.com/dubai/aquaventure-waterpark` | Atlantis Aquaventure Official | Official | `verified` | 2026-09-09 |
| **Global Village Dubai** | Buy Entry Tickets | `https://www.globalvillage.ae/en/buy-tickets` | Global Village Official | Official | `verified` | 2026-09-09 |
| **Jebel Jais Drive & Peak Zipline** | Book Jais Zipline Adventure | `https://visitjebeljais.com/adventures/jais-flight/` | Visit Jebel Jais Official | Official | `verified` | 2026-09-09 |
| **Alserkal Avenue Art & Coffee** | Explore Art Exhibitions | `https://alserkal.online/` | Alserkal Avenue Official | Official | `verified` | 2026-09-09 |

---

## Technical Integration Summary

1. **Centralized Data Schema (`fallbackData.js`)**: Extended with structured schema attributes:
   - `actionLabel`: Specific call-to-action text matching intent.
   - `actionUrl`: Direct actionable destination.
   - `actionType`: `tickets` | `registration` | `reservation` | `booking` | `website` | `maps`.
   - `sourceType`: `official`.
   - `sourceName`: Descriptive name of authoritative platform.
   - `verifiedAt`: ISO timestamp of verification.
   - `actionStatus`: `verified`.

2. **Resolution & Fallback Helpers (`geo.js`)**:
   - `getActionableUrl(place)`: Returns `actionUrl` -> `website` -> Google Maps Query fallback (`https://www.google.com/maps/search/?api=1&query=...`).
   - `getActionLabel(place)`: Resolves context-aware button label based on entity category and type.

3. **Connected UI Components**:
   - **`PlaceDetail.jsx`**: Custom category templates (Cafe/Dining, Attractions/Landmarks, Group Events) render official action links with security headers (`target="_blank" rel="noopener noreferrer"`).
   - **`NearbyFeed.jsx`**: Map marker popover cards and feed grid cards (Popular, Hidden Gems, Search Results) include instant actionable external links.
   - **`SavedList.jsx`**: Saved items include direct official action buttons.
   - **`GroupDetail.jsx`**: Group meetups linked to venues feature direct venue official links.
   - **`Chat.jsx`**: AI Local Guide place recommendations include official action buttons.
