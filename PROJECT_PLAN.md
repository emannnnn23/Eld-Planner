# ELD Trip Planner — Project Plan & Workflow

## 1. What we're building

A hosted full-stack app where a dispatcher enters:
- Current location
- Pickup location
- Dropoff location
- Current Cycle Used (Hrs)

...and gets back:
- A route map with pickup/dropoff/fuel/rest stops plotted
- Auto-filled daily ELD log sheets (one grid per day, drawn like the paper FMCSA log)

Grading criteria to keep in view the whole build: **hosted accuracy** (the HOS math and route have to hold up) and **UI/UX polish** (good design can offset small output inaccuracies, so this isn't just a backend exercise).

---

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Django + Django REST Framework | Required by the brief; DRF gives a clean API layer |
| Frontend | React (Vite) | Required by the brief; Vite keeps builds fast |
| Map/routing | **OSRM** (routing) + **Nominatim** (geocoding) — both OpenStreetMap-based, free, no API key | Satisfies "find and use a free map API"; alternative is OpenRouteService if OSRM's public demo server rate-limits you |
| Map rendering | React-Leaflet + OpenStreetMap tiles | Free, no key, pairs naturally with OSRM |
| ELD log drawing | HTML5 Canvas or inline SVG, hand-built to the FMCSA grid layout | No library draws this format; build a reusable `<LogSheet>` component |
| Hosting | Backend: Render (free web service) · Frontend: Vercel or Netlify · DB: Render Postgres free tier (or SQLite if we skip persistence) | Free, reliable enough for grading, simple CI-less deploys |

No paid keys anywhere — safe for a take-home you might not want to keep paying for after submission.

---

## 3. Architecture

```
[React frontend]  --POST trip details-->  [Django API]
                                             |
                                             |-- Nominatim: geocode 3 addresses -> lat/lng
                                             |-- OSRM: route current->pickup->dropoff
                                             |-- HOS engine: simulate the drive, insert
                                             |     breaks/resets/fuel stops, split by day
                                             |
[React frontend]  <--route + stops + logs--  [Django API]
   |
   |-- Leaflet map: draws route line + stop markers
   |-- LogSheet components: one per day, canvas-drawn grid + duty line
```

Single API call per trip (`POST /api/plan-trip/`) keeps the frontend simple: one request, one response object with everything needed to render both the map and the logs. No need for the frontend to know any HOS rules — that logic lives entirely server-side, which is also easier to get "accurate" and easier to unit-test.

---

## 4. The HOS rule engine (the core of "accuracy")

This is the part graders will actually check, so it's worth planning before writing any code.

**Assumptions locked in by the brief** (state these in the UI or README so graders see we made deliberate choices):
- Property-carrying driver, 70 hrs / 8-day cycle
- No adverse driving conditions
- Fuel stop at least every 1,000 miles (modeled as a 30-min on-duty-not-driving stop)
- 1 hour on-duty (not driving) at pickup, 1 hour at dropoff

**FMCSA rules to encode:**
- 11-hour driving limit per shift
- 14-hour on-duty window per shift (drive time + on-duty time combined, from start of shift)
- 30-minute break required after 8 cumulative hours of driving
- 10 consecutive hours off-duty to reset a shift
- 70-hour/8-day cycle cap → 34-hour restart when hit
- Current Cycle Used (Hrs) input reduces the remaining 70-hour budget from minute one

**Simulation approach** (event-driven, not minute-by-minute, for performance):
1. Geocode current, pickup, dropoff.
2. Get route legs (current→pickup, pickup→dropoff) from OSRM: distance, duration, geometry.
3. Walk through the trip as a sequence of segments — drive, on-duty (pickup/dropoff/fuel), off-duty (break/reset) — advancing a clock and three counters (drive-time-today, on-duty-window, cycle-hours-used).
4. Before each drive segment, check limits in order: cycle hours → 14-hr window → 11-hr driving → 8-hr break trigger → 1,000-mile fuel trigger. Insert the required rest/fuel/reset event whenever a limit would be exceeded, then continue.
5. Stamp every event with a start/end timestamp (assume trip start = "now," configurable in the form).
6. Slice the full event timeline at midnight boundaries into calendar days → each day becomes one log sheet's worth of duty-status segments.

**Output shape from `/api/plan-trip/`:**
```json
{
  "route": { "geometry": [...], "distance_miles": 812, "duration_hr": 13.5 },
  "stops": [
    {"type": "pickup", "location": "...", "arrive": "...", "depart": "...", "lat": .., "lng": ..},
    {"type": "fuel", "location": "...", "arrive": "...", "depart": "..."},
    {"type": "rest_10hr", "location": "...", "arrive": "...", "depart": "..."},
    {"type": "dropoff", "location": "...", "arrive": "...", "depart": "..."}
  ],
  "daily_logs": [
    {
      "date": "2026-09-08",
      "segments": [{"status": "off_duty", "start": "00:00", "end": "06:00"}, ...],
      "totals": {"off_duty": 6, "sleeper": 0, "driving": 9.5, "on_duty_not_driving": 2},
      "cycle_hours_used_end_of_day": 34.5
    }
  ],
  "assumptions": { "cycle": "70/8", "fuel_interval_miles": 1000 }
}
```

Unit-testable in isolation from the API/UI — plan to write the HOS engine as pure functions first, with a handful of hand-checked scenarios (short local trip, trip needing one 10-hr reset, trip long enough to need a 34-hr restart) before wiring it to Django views.

---

## 5. Frontend plan

- **Trip form**: 4 inputs from the brief + a start-time picker (defaults to now). Autocomplete on location fields is a nice touch but optional — plain text + geocode-on-submit is fine.
- **Results view**, once the API responds:
  - Map panel (Leaflet): route polyline, distinct markers for pickup/dropoff/fuel/rest stops, popup with arrive/depart times.
  - Log sheets panel: one `<LogSheet>` per day, tabbed or stacked, each drawn as the classic 4-row FMCSA grid (Off Duty / Sleeper / Driving / On-Duty) with the duty line stepped across 24 hours and totals below.
- **States to design for, not just the happy path**: loading, geocoding failure (bad address), a trip too long for the 70-hr cycle without restarts (should still render something sensible, not crash).

Per the frontend-design skill: before writing UI code, do a short design pass — pick a palette/type/layout that actually fits "trucking logistics tool," not a generic SaaS dashboard. Worth 10 minutes of thought since the brief explicitly says design can offset output inaccuracies.

---

## 6. Build order (workflow)

1. **Django project skeleton** — `trips` app, DRF installed, CORS configured for the frontend origin.
2. **HOS engine as pure Python**, tested standalone with 3–4 hand-worked scenarios before touching views.
3. **Geocoding + routing integration** (Nominatim, OSRM) wrapped in a small service module with error handling (bad address, no route found).
4. **`POST /api/plan-trip/` view** wiring engine + routing together, returning the JSON shape above.
5. **React app scaffold** (Vite) — form, API client, basic layout.
6. **Map integration** — Leaflet + route polyline + stop markers.
7. **LogSheet component** — get one day rendering correctly against a hand-checked example before generalizing to N days.
8. **Design pass** — palette/type/layout pass per frontend-design principles; polish spacing, empty/error/loading states.
9. **Deploy** — backend to Render, frontend to Vercel/Netlify, wire the production API URL into the frontend env var, confirm CORS/HTTPS works end-to-end.
10. **Accuracy pass** — run 3–5 real-world trip examples (short/medium/long, one crossing a 70-hr limit) and manually verify the logs against FMCSA rules.
11. **README** — document assumptions, the free APIs used, and how to run locally, since graders will likely read it alongside the hosted app.

---

## 7. Risks to plan around

- **OSRM's public demo server** has no SLA and can rate-limit — if it flakes during grading, fall back to OpenRouteService (also free, needs a no-cost API key) as a documented backup.
- **Multi-day trips** are the actual hard part — get the 34-hr restart and 70-hr rolling cycle right, since a single-day trip is nearly trivial and won't show grading differentiation.
- **Free hosting cold-starts** (Render free tier sleeps) — mention in the README so a slow first load isn't mistaken for a bug.
