# TransitOps — Demo Video Readiness Checklist

> Use this file to walk through every screen before recording.
> Each section = one screen in the demo flow.
> Status: OK = working, FIX = needs code change, CHECK = verify manually.

---

## 0. Pre-Recording Setup

| # | Task | Status |
|---|------|--------|
| 0.1 | Run `npx prisma db seed` to reset to clean rich data (24 vehicles, 16 drivers, ~90 trips, 43 fuel logs, 22 expenses, 12 maintenance records) | CHECK |
| 0.2 | Start backend: `npm run dev:backend` (port 4000) | CHECK |
| 0.3 | Start frontend: `npm run dev:frontend` (port 5173) | CHECK |
| 0.4 | Open `http://localhost:5173` in browser | CHECK |
| 0.5 | Clear localStorage (`localStorage.clear()` in console) to start fresh from login | CHECK |

---

## 1. Login Screen (`/login`)

**Demo credentials (all use password `Passw0rd!`):**

| Role | Email | Sees (nav items) |
|------|-------|-------------------|
| Fleet Manager | manager@transitops.in | Dashboard, Fleet, Drivers, Maintenance, Analytics, Settings |
| Dispatcher | dispatcher@transitops.in | Dashboard, Trips |
| Safety Officer | safety@transitops.in | Dashboard, Drivers |
| Financial Analyst | finance@transitops.in | Dashboard, Fuel & Expenses, Analytics |

**What to show:**
- [ ] Left panel with TransitOps branding + 4 roles listed
- [ ] Role dropdown on the right (RBAC selector)
- [ ] Login with `manager@transitops.in` / `Passw0rd!` / Fleet Manager
- [ ] Successful redirect to Dashboard
- [ ] (Optional) Show wrong password → "Invalid credentials. X attempt(s) left" error
- [ ] (Optional) Show lockout after 5 failed attempts

**Known issues:** NONE — login works cleanly.

---

## 2. Dashboard (`/`)

**What to show:**
- [ ] 3 KPI cards: Fleet Health (utilization %), Trip Operations (active count), Workforce (drivers on duty)
- [ ] Filter pills: Vehicle type, Status, Region — show filtering by region (e.g., "Ahmedabad") and KPIs update
- [ ] Reset button clears filters
- [ ] Activity Trend area chart (7-day trip creation trend)
- [ ] Recent Trips table with trip codes, vehicle/driver names, status badges, timestamps
- [ ] Responsive — cards stack on narrow viewport

**Known issues:** NONE — fully functional with rich seed data.

---

## 3. Fleet / Vehicle Registry (`/fleet`)

**What to show:**
- [ ] Table of 24 vehicles with Registration, Name, Type, Capacity, Odometer, Region, Status badges
- [ ] Filter by Type (VAN/TRUCK/MINI), Status, Search by name/registration
- [ ] Click **+ Add Vehicle** → form slides in with green background
- [ ] Fill in: Registration No, Name, Type dropdown, Capacity, Odometer, Acquisition Cost, Region
- [ ] Submit → vehicle appears in table
- [ ] Click **Edit** on existing vehicle → form pre-fills
- [ ] Show **Retire/Reactivate** status toggle
- [ ] Show validation: try submitting with duplicate registration → field error appears

**Known issues:** NONE — CRUD + validation + filters all work.

---

## 4. Maintenance (`/maintenance`)

**What to show:**
- [ ] Left panel: "Log Service Record" form (Vehicle dropdown shows only AVAILABLE vehicles)
- [ ] Right panel: service log cards with vehicle info, cost, date, status badge
- [ ] Create a maintenance record: select vehicle, enter service type (e.g., "Oil Change"), cost, date
- [ ] Submit → vehicle status changes to IN_SHOP, card appears with IN_SHOP badge
- [ ] Click **Close Service** on an IN_SHOP record → status changes to COMPLETED, vehicle returns to AVAILABLE

**Known issues:** NONE — maintenance lifecycle works.

---

## 5. Drivers & Safety (`/drivers`)

**Access:** Fleet Manager (full) or Safety Officer (full)

**What to show:**
- [ ] Table with 16 drivers: name, license no/category, expiry date, contact, completion %, safety status, status badge
- [ ] Expired licenses show red with EXPIRED label + alert icon
- [ ] Safety column: "Clear" (green) or "Blocked" (red) — blocked = expired license or suspended
- [ ] Click **Add Driver** → form with name, license no, category (LMV/HMV), expiry, contact, completion rate
- [ ] Click **Edit** on existing driver → pre-filled form
- [ ] Status dropdown: Available / Off Duty / Suspended (ON_TRIP drivers can't be changed)
- [ ] Show: suspended driver → safety column shows "Blocked"

**Known issues:** NONE — all features work.

---

## 6. Trip Dispatcher (`/trips`)

**Access:** Dispatcher only (full access)

**What to show:**
- [ ] Left panel: Trip Lifecycle diagram (Draft → Dispatched → Completed/Cancelled)
- [ ] Left panel: "Create a Trip Draft" form with source, destination, cargo weight, distance, vehicle dropdown (available only), driver dropdown (eligible only)
- [ ] Capacity Check box: shows "within limit" (green) or "exceeded by X kg" (red) live as you type
- [ ] Submit → trip appears in Live Board as DRAFT
- [ ] Right panel: Live Board with all trips as cards (trip code, route, cargo, vehicle, driver, status badge)
- [ ] Click **Dispatch** on DRAFT trip → status changes to DISPATCHED
- [ ] Click **Complete** on DISPATCHED trip → completion form appears with:
  - End odometer (required)
  - Revenue (optional)
  - Fuel litres + fuel cost (optional → auto-creates fuel log)
  - Toll + Other expenses (optional → auto-creates expense record)
- [ ] Click **Cancel** → cancellation form with reason field → trip moves to CANCELLED with reason shown
- [ ] Footer note: "On complete: odometer → fuel log → expenses → vehicle and driver available"

**Known issues:** NONE — full trip lifecycle works including fuel/expense hand-off.

---

## 7. Fuel & Expenses (`/fuel`)

**Access:** Financial Analyst only (full access)

**What to show:**
- [ ] Top: Total Operational Cost badge (Fuel + Maintenance combined)
- [ ] 4 KPI tiles: Fuel Cost, Maintenance Cost, Toll, Other
- [ ] Left panel: Fuel Logs list with "Log Fuel" inline form
  - Vehicle dropdown, Date, Litres, Cost, Odometer (optional)
  - Submit → new fuel log card appears
- [ ] Right panel: Expenses list with "Add Expense" inline form
  - Vehicle dropdown, Category (TOLL/MISC/FUEL/MAINTENANCE), Toll amount, Other amount, Note
  - Submit → expense card appears
- [ ] Expense cards show: Toll, Other, **Maint (Linked)** — linked maintenance cost for that vehicle
- [ ] Trip-linked expenses show green "Trip: TRXXXX" badge

**Known issues:** NONE — forms + linked maintenance display works.

---

## 8. Analytics (`/analytics`)

**Access:** Fleet Manager or Financial Analyst

**What to show:**
- [ ] 4 KPI tiles: Fuel Efficiency (km/l), Fleet Utilization %, Operational Cost, Vehicle ROI %
- [ ] ROI formula shown: `ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost`
- [ ] Monthly Revenue bar chart (grouped by month from completed trips)
- [ ] Top Costliest Vehicles horizontal bar chart (5 bars with gradient colors)
- [ ] Per-Vehicle ROI table: Vehicle name, Revenue, Fuel cost, Maintenance cost, ROI % (green positive / red negative)

**Known issues:** NONE — all charts and tables populated with seed data.

---

## 9. Settings & RBAC (`/settings`)

**Access:** Fleet Manager only (full access)

**What to show:**
- [ ] Left panel: General settings form — Depot Name, Currency (INR/USD/EUR/GBP), Distance Unit (Km/Miles)
- [ ] Edit depot name → click "Save changes" → success toast appears
- [ ] Right panel: RBAC Matrix table (read-only) showing all 4 roles × 5 modules
  - WRITE (green), READ (black), — (gray) for each cell
  - Note: "Read-only — mirrors the server's permission matrix"

**Known issues:** NONE — settings CRUD + RBAC display works.

---

## 10. Global Search (Topbar)

**What to show:**
- [ ] Click search bar in topbar → type at least 2 characters
- [ ] Results grouped by: Vehicles, Drivers, Trips
- [ ] Each result shows name/code + status badge
- [ ] Click a result → navigates to the relevant page
- [ ] Outside click → dropdown closes
- [ ] Search is RBAC-scoped: only shows results from modules the logged-in role can read

**Known issues:** NONE — debounced search with RBAC scoping works.

---

## 11. RBAC Demo (Role Switching)

**What to show:**
- [ ] Log out (click logout button in topbar)
- [ ] Log in as **Dispatcher** (dispatcher@transitops.in) → only Dashboard + Trips in sidebar
- [ ] Try navigating to `/fleet` via URL → redirects to Dashboard (route guard works)
- [ ] Log out → Log in as **Safety Officer** → only Dashboard + Drivers
- [ ] Log out → Log in as **Financial Analyst** → only Dashboard + Fuel & Expenses + Analytics
- [ ] Fleet page is accessible but READ-ONLY (no add/edit buttons) — wait, Financial Analyst has fleet=view, but since we gate on canWrite, Fleet won't show in nav. Correct behavior.

**Known issues:** NONE — RBAC nav + route guards work correctly.

---

## 12. Cross-Cutting Features

| Feature | Where to Show | Status |
|---------|---------------|--------|
| Zod validation with field-level errors | Add vehicle with empty fields, or duplicate registration | OK |
| Capacity check blocks dispatch | Create trip with cargo > vehicle capacity → Dispatch button disabled | OK |
| Expired license blocks assignment | Driver with expired license → not in trip driver dropdown | OK |
| Suspended driver blocks assignment | Suspended driver → not in trip driver dropdown | OK |
| Trip-complete creates fuel log + expense | Complete a dispatched trip with fuel/toll data → check Fuel page | OK |
| Vehicle status lifecycle | Available ↔ On Trip (via dispatch/complete), Available ↔ In Shop (via maintenance), Available ↔ Retired (via toggle) | OK |
| 5-attempt lockout | Enter wrong password 5 times → "Account locked for X minutes" | OK |
| Poppins font | Visible across all pages | OK |
| Consistent theme | Green (#1B5E47) + white cards + rounded-[32px] + shadow-sm | OK |

---

## Demo Script Flow (Recommended Recording Order)

1. **Login** → Manager credentials → show branding + role selector
2. **Dashboard** → KPIs, filter by region, activity chart, recent trips
3. **Fleet** → browse vehicles, add a new vehicle, edit one, retire/reactivate
4. **Maintenance** → log a service record, see vehicle go to IN_SHOP, close service
5. **Drivers** → browse drivers, show expired license warning, add a driver, change status
6. **Logout → Login as Dispatcher** → only Dashboard + Trips visible
7. **Trips** → create draft, dispatch, complete with fuel/expenses, cancel with reason
8. **Logout → Login as Financial Analyst** → Dashboard + Fuel + Analytics visible
9. **Fuel & Expenses** → see auto-created fuel log from trip completion, add manual expense, show Maint (Linked)
10. **Analytics** → KPIs, monthly revenue chart, costliest vehicles, per-vehicle ROI table
11. **Logout → Login as Manager** → Settings → edit depot name, show RBAC matrix
12. **Global Search** → search "VAN" → see grouped results
13. **RBAC guard** → try URL `/trips` as Manager → redirects to Dashboard

---

## Technical Highlights for Presentation

- **Database**: Neon PostgreSQL (remote, no BaaS auth — pure DB only)
- **ORM**: Prisma with 8 models, 8 enums, relations, cascading deletes
- **Auth**: Custom JWT + bcrypt, 5-attempt lockout, role-based tokens
- **RBAC**: Single-source permission matrix (backend `permissions.ts`), frontend mirrors for nav/route gating
- **Validation**: Zod schemas on every endpoint, field-level error details surfaced in UI
- **Business rules**: Capacity check, license expiry, status lifecycle, trip→fuel/expense hand-off (Prisma transaction)
- **Frontend**: React + Vite + TypeScript + Tailwind + Recharts, Poppins font, Hugeicons
- **API**: RESTful, 10 route modules, consistent error format `{error, details}`
- **Search**: RBAC-scoped global search across vehicles, drivers, trips
