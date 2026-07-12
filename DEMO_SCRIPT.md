# TransitOps — Demo Video Recording Script

> Single-person narration. ~8–10 minutes total.
> Every step tells you: what to click, what to type, and what to say.
> Password for all logins: `Passw0rd!`

---

## Before You Hit Record

```bash
npx prisma db seed          # reset to clean data
npm run dev:backend          # terminal 1
npm run dev:frontend         # terminal 2
```

- Open Chrome → `http://localhost:5173`
- Console → `localStorage.clear()` → refresh → you should see the Login page
- Maximize browser, hide bookmarks bar, close other tabs
- Start screen recording

---

## SCENE 1 — Login & Branding (0:00–0:45)

**On screen:** Login page

**Say:**
> "This is TransitOps — a smart transport operations platform built with React, Express, PostgreSQL, and Prisma. The system uses role-based access control with four distinct roles, each seeing only the modules they're authorized to edit."

**Do:**
1. Point cursor at the left green panel — pause on the role list
2. Point at the right form — highlight the Role (RBAC) dropdown
3. Click the dropdown → show all 4 roles → select **Fleet Manager**
4. Type email: `manager@transitops.in`
5. Type password: `Passw0rd!`
6. Click **Sign In**

**Say:**
> "We're logging in as Fleet Manager — they have full access to Fleet, Drivers, Maintenance, Analytics, and Settings."

**On screen:** Dashboard loads

---

## SCENE 2 — Dashboard Overview (0:45–1:45)

**On screen:** Dashboard

**Say:**
> "The dashboard gives a real-time operational snapshot. Three categorized KPI cards — Fleet Health showing utilization rate, Trip Operations showing active dispatches, and Workforce showing drivers currently on duty."

**Do:**
1. Hover over the green Fleet Health card — point at utilization %, Active/Available/In Shop counts
2. Point at Trip Operations card — active trips + pending
3. Point at Workforce card — drivers clocked in

**Say:**
> "The dashboard supports live filtering. Let me filter by region."

**Do:**
4. Click **Region** dropdown → select **Ahmedabad**
5. Watch KPI numbers update
6. Click **Reset** to clear

**Say:**
> "Below we have a 7-day activity trend chart and the recent trips table with status tracking."

**Do:**
7. Hover over the area chart — show tooltip with trip count
8. Scroll to Recent Trips table — point at status badges (COMPLETED, DISPATCHED, DRAFT)

---

## SCENE 3 — Vehicle Registry (1:45–3:00)

**Do:** Click **Fleet** in sidebar

**Say:**
> "The Vehicle Registry manages our fleet of 24 vehicles — vans, trucks, and minis. We can filter by type, status, or search by name."

**Do:**
1. Click **Vehicle** type filter → select **TRUCK** → table filters to 8 trucks
2. Click **Reset** (or clear filter)
3. Point at the table — highlight Registration, Type, Capacity, Region, Status columns

**Say:**
> "Let me add a new vehicle to the fleet."

**Do:**
4. Click **+ Add Vehicle**
5. Fill in:
   - Registration No: `GJ05XY9999`
   - Name: `DEMO-VAN-01`
   - Type: `VAN`
   - Capacity: `800`
   - Odometer: `5000`
   - Acquisition Cost: `550000`
   - Region: `Ahmedabad`
6. Click **Add Vehicle**

**Say:**
> "The vehicle is added immediately. All fields are validated with Zod on the backend — duplicate registrations, missing fields, and invalid values are caught with field-level error messages."

**Do:**
7. Scroll down to find the new vehicle in the table
8. Click **Edit** on any existing vehicle → show pre-filled form → click **Cancel**
9. Click **Retire** on an AVAILABLE vehicle → status changes to RETIRED
10. Click **Reactivate** on the same vehicle → status returns to AVAILABLE

---

## SCENE 4 — Maintenance (3:00–3:50)

**Do:** Click **Maintenance** in sidebar

**Say:**
> "Maintenance tracks service records. When a vehicle enters service, its status automatically changes to In Shop, blocking it from trip assignment."

**Do:**
1. In the left form, select a vehicle from dropdown (e.g., `GJ01AH1000 — VAN-01`)
2. Service Type: `Brake Service`
3. Cost: `4500`
4. Date: today
5. Click **Log Service**

**Say:**
> "The vehicle is now In Shop. When service is complete, closing the record returns it to Available."

**Do:**
6. Find the new IN_SHOP record on the right
7. Click **Close Service** → status changes to COMPLETED

---

## SCENE 5 — Drivers & Safety (3:50–4:40)

**Do:** Click **Drivers** in sidebar

**Say:**
> "The Drivers module tracks 16 drivers with license details, completion rates, and safety status. Expired licenses and suspended drivers are automatically blocked from trip assignment."

**Do:**
1. Point at the table — highlight an expired license row (red date + EXPIRED label + alert icon)
2. Point at the Safety column — "Clear" vs "Blocked"
3. Click **Add Driver** → show the form briefly → click **Cancel**
4. On an AVAILABLE driver, use the status dropdown → change to **Suspended**
5. Point at Safety column changing to "Blocked"

**Say:**
> "Blocked drivers won't appear in the trip dispatcher's driver dropdown — the system enforces this automatically."

---

## SCENE 6 — RBAC Switch to Dispatcher (4:40–5:00)

**Do:**
1. Click the **logout** button (top right)
2. On login page, select role **Dispatcher**
3. Email: `dispatcher@transitops.in`
4. Password: `Passw0rd!`
5. Click **Sign In**

**Say:**
> "Now logging in as a Dispatcher. Notice the sidebar — only Dashboard and Trips are visible. The dispatcher can't access Fleet, Drivers, or any other module."

**Do:**
6. Point at the sidebar — only Dashboard and Trips shown

---

## SCENE 7 — Trip Dispatcher (5:00–6:30)

**Do:** Click **Trips** in sidebar

**Say:**
> "The Trip Dispatcher manages the full trip lifecycle — Draft, Dispatch, Complete, or Cancel. Let me create a new trip."

**Do:**
1. Point at the Trip Lifecycle diagram on the left
2. In the form, fill:
   - Source: `Gandhinagar Depot`
   - Destination: `Vadodara Center`
   - Cargo weight: `500`
   - Distance: `120`
   - Select a vehicle from dropdown
3. **Before selecting driver**, point at the Capacity Check box → "500 kg / 800 kg — within limit"
4. Select a driver from dropdown
5. Click **Create Draft**

**Say:**
> "The draft is created. The capacity check validates live — if cargo exceeds vehicle capacity, the dispatch button is disabled. Now let me dispatch it."

**Do:**
6. Find the new DRAFT trip in Live Board → click **Dispatch**
7. Trip status changes to DISPATCHED

**Say:**
> "When a trip is dispatched, the vehicle and driver are held. Now completing the trip with fuel and expense data."

**Do:**
8. Click **Complete** on the dispatched trip
9. Fill in:
   - End odometer: `125000` (or any number > start)
   - Revenue: `8500`
   - Fuel litres: `18`
   - Fuel cost: `1800`
   - Toll: `250`
   - Other: `100`
10. Click **Confirm Completion**

**Say:**
> "On completion, the system records the odometer, automatically creates a fuel log and expense record linked to this trip, and releases the vehicle and driver back to available status — all in a single database transaction."

**Do:**
11. Scroll to show a DRAFT or DISPATCHED trip → click **Cancel**
12. Type reason: `Route blocked due to construction`
13. Click **Cancel Trip**
14. Show the cancelled trip with reason displayed

---

## SCENE 8 — RBAC Switch to Financial Analyst (6:30–6:45)

**Do:**
1. Logout
2. Login as **Financial Analyst**: `finance@transitops.in` / `Passw0rd!`
3. Point at sidebar — Dashboard, Fuel & Expenses, Analytics visible

**Say:**
> "The Financial Analyst sees only financial modules — Fuel & Expenses and Analytics."

---

## SCENE 9 — Fuel & Expenses (6:45–7:30)

**Do:** Click **Fuel & Expenses** in sidebar

**Say:**
> "The Fuel & Expenses module tracks all operational costs. The total operational cost combines fuel and maintenance expenses."

**Do:**
1. Point at the top-right badge — Total Operational Cost
2. Point at 4 KPI tiles — Fuel Cost, Maintenance Cost, Toll, Other
3. Scroll to Fuel Logs section — point at a few log cards
4. Scroll to Expenses section — point at an expense card

**Say:**
> "Each expense card shows toll, other costs, and linked maintenance cost for that vehicle. Trip-linked expenses are tagged with the trip code."

**Do:**
5. Point at a card with green "Trip: TRXXXX" badge
6. Point at the "Maint (Linked)" value in a card

**Say (optional, if time):**
> "We can also manually log fuel or add expenses through the inline forms."

---

## SCENE 10 — Analytics (7:30–8:15)

**Do:** Click **Analytics** in sidebar

**Say:**
> "Analytics provides fleet-wide financial intelligence. Four KPIs at the top — fuel efficiency, fleet utilization, total operational cost, and vehicle ROI calculated as revenue minus costs over acquisition cost."

**Do:**
1. Point at the ROI formula text
2. Scroll to Monthly Revenue bar chart → hover a bar to show tooltip
3. Scroll to Top Costliest Vehicles chart → hover a bar

**Say:**
> "The per-vehicle ROI table breaks down each vehicle's revenue, fuel, and maintenance costs with a final ROI percentage — positive in green, negative in red."

**Do:**
4. Scroll to Per-Vehicle ROI table
5. Point at a positive ROI (green) and a negative ROI (red) row

---

## SCENE 11 — Settings & RBAC Matrix (8:15–8:50)

**Do:**
1. Logout → Login as **Fleet Manager** again (`manager@transitops.in`)
2. Click **Settings** in sidebar

**Say:**
> "Settings allows the Fleet Manager to configure depot details — name, currency, and distance unit."

**Do:**
3. Change Depot Name to `Gandhinagar Central Depot`
4. Click **Save changes** → green success message appears
5. Scroll to RBAC Matrix table

**Say:**
> "The RBAC matrix is displayed read-only — it mirrors the server's permission configuration. Each role has specific read or write access to each module, enforced on both frontend and backend."

**Do:**
6. Point at the matrix — highlight WRITE/READ/— cells for each role

---

## SCENE 12 — Global Search (8:50–9:10)

**Say:**
> "Finally, the global search in the topbar searches across vehicles, drivers, and trips — scoped to what the current role can access."

**Do:**
1. Click the search bar in the topbar
2. Type `VAN` → results dropdown shows matching vehicles
3. Type `TR00` → results show matching trips
4. Click a result → navigates to the page
5. Click outside → dropdown closes

---

## SCENE 13 — Route Guard Demo (9:10–9:30)

**Say:**
> "Route guards enforce access control even if someone types a URL directly."

**Do:**
1. Logout → Login as **Dispatcher**
2. In the browser URL bar, manually type `localhost:5173/fleet` → press Enter
3. Page redirects to Dashboard

**Say:**
> "The dispatcher tried to access Fleet directly — the route guard detected they don't have write access and redirected them to the dashboard. This is enforced on both the frontend routes and the backend API."

---

## SCENE 14 — Closing (9:30–9:45)

**On screen:** Dashboard (any role)

**Say:**
> "TransitOps is built from scratch with PostgreSQL, Prisma, Express, and React — no backend-as-a-service. Custom JWT authentication with lockout protection, Zod validation on every endpoint, and a single-source RBAC matrix that controls both the API and the UI. Thank you."

**End recording.**

---

## Quick Reference — All Logins

| Role | Email | Password |
|------|-------|----------|
| Fleet Manager | manager@transitops.in | Passw0rd! |
| Dispatcher | dispatcher@transitops.in | Passw0rd! |
| Safety Officer | safety@transitops.in | Passw0rd! |
| Financial Analyst | finance@transitops.in | Passw0rd! |
