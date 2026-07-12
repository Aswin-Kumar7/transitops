<div align="center">

# 🚚 TransitOps

### Smart Transport Operations Platform

Manage a transport depot end-to-end — vehicles, drivers, trips, maintenance, fuel, and analytics — on a well-modeled relational database with role-based access and business rules enforced in code.

Built from scratch for the **Odoo Hackathon**.

![Dashboard](screenshots/01-dashboard.png)

</div>

---

## ✨ Highlights

- **Built from scratch** — no backend-as-a-service. PostgreSQL is the only hosted piece; **auth, RBAC, business rules, and every API are written in this repo**.
- **Role-based access control** — 4 roles, 6 modules, one permission matrix that drives both the API and the UI. Screens you can't use aren't just hidden, they're unreachable.
- **Real business rules** — capacity checks block bad dispatches, expired/suspended drivers can't be assigned, vehicle status governs the whole lifecycle.
- **Live analytics** — fuel efficiency, fleet utilization, operational cost, and per-vehicle ROI, all as real database aggregations.
- **Secure auth** — bcrypt password hashing, JWT sessions, and a 5-attempt account lockout, all server-side.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| **Database** | Neon (serverless PostgreSQL) — used purely as Postgres, no BaaS auth/storage |
| **ORM** | Prisma — typed schema + migrations |
| **Backend** | Node · Express · TypeScript |
| **Auth** | Custom JWT + bcrypt (5-attempt lockout) — written in code |
| **Validation** | Zod — request validation with field-level errors |
| **Frontend** | React · Vite · TypeScript · Tailwind CSS · shadcn/ui |
| **Charts / UI** | Recharts · Hugeicons · Poppins |
| **Tooling** | npm workspaces monorepo |

---

## 🔐 Role-Based Access Control

A single permission matrix is the source of truth for both the backend middleware and the frontend navigation.

| Role | Fleet | Drivers | Trips | Fuel | Analytics | Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Fleet Manager** | ✅ Write | ✅ Write | — | — | ✅ Write | ✅ Write |
| **Dispatcher** | 👁 Read | — | ✅ Write | — | — | — |
| **Safety Officer** | — | ✅ Write | 👁 Read | — | — | — |
| **Financial Analyst** | 👁 Read | — | — | ✅ Write | ✅ Write | — |

> ✅ Write · 👁 Read-only · — No access. The navigation shows only the screens a role can **edit**.

---

## 📋 Core Business Rules

- **Unique constraints** — vehicle registration numbers and driver license numbers must be unique.
- **Capacity check** — a trip whose cargo exceeds the vehicle's capacity **cannot be dispatched** (UI shows exactly by how much).
- **Driver eligibility** — expired licenses and suspended drivers are **blocked** from trip assignment (enforced server-side).
- **Vehicle lifecycle** — `Available ↔ On Trip` (dispatch/complete), `Available ↔ In Shop` (maintenance), `Available ↔ Retired`.
- **Trip lifecycle** — `Draft → Dispatched → Completed | Cancelled`, with vehicle + driver held and released atomically.
- **Trip completion hand-off** — completing a trip captures the odometer and **auto-creates the fuel log and expenses** in a single transaction.
- **Operational cost** — `fuel + maintenance`, computed once and reused across Fuel and Analytics.

---

## 🚀 Getting Started

```bash
# 1. Install everything (npm workspaces)
npm install

# 2. Configure env — copy the examples and add your Neon connection string
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Create the schema + seed rich demo data
npm run db:migrate
npm run db:seed

# 4. Run both apps
npm run dev
```

| App | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:4000 |

### Demo Logins

All accounts use the password **`Passw0rd!`**

| Role | Email |
|---|---|
| Fleet Manager | `manager@transitops.in` |
| Dispatcher | `dispatcher@transitops.in` |
| Safety Officer | `safety@transitops.in` |
| Financial Analyst | `finance@transitops.in` |

---

## 🖥️ Screens

| # | Screen | Description |
|---|---|---|
| 1 | **Dashboard** | Live KPIs, filters (type / status / region), activity trend, recent trips. Click a KPI card to switch the chart to a status breakdown. |
| 2 | **Vehicle Registry** | Fleet CRUD with validation, filters, and status control (retire / reactivate). |
| 3 | **Maintenance** | Log service records; vehicles move to In-Shop and back to Available. |
| 4 | **Drivers & Safety** | Driver CRUD, license expiry warnings, eligibility (Clear / Blocked). |
| 5 | **Trip Dispatcher** | Full trip lifecycle with live capacity check and fuel/expense capture on completion. |
| 6 | **Fuel & Expenses** | Fuel logs, expenses, linked maintenance, total operational cost. |
| 7 | **Analytics** | Fuel efficiency, utilization, operational cost, monthly revenue, per-vehicle ROI. |
| 8 | **Settings & RBAC** | Depot configuration + the read-only permission matrix. |

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%"><img src="screenshots/01-dashboard.png" alt="Dashboard"/><br/><b>Dashboard</b> — live KPIs & interactive charts</td>
    <td width="50%"><img src="screenshots/02-fleet.png" alt="Vehicle Registry"/><br/><b>Vehicle Registry</b> — fleet CRUD & filters</td>
  </tr>
  <tr>
    <td><img src="screenshots/03-drivers.png" alt="Drivers"/><br/><b>Drivers & Safety</b> — eligibility & license checks</td>
    <td><img src="screenshots/04-trips.png" alt="Trip Dispatcher"/><br/><b>Trip Dispatcher</b> — lifecycle & capacity check</td>
  </tr>
  <tr>
    <td><img src="screenshots/05-fuel.png" alt="Fuel & Expenses"/><br/><b>Fuel & Expenses</b> — operational cost</td>
    <td><img src="screenshots/06-analytics.png" alt="Analytics"/><br/><b>Analytics</b> — ROI & revenue trends</td>
  </tr>
  <tr>
    <td><img src="screenshots/07-settings.png" alt="Settings & RBAC"/><br/><b>Settings & RBAC</b> — permission matrix</td>
    <td><img src="screenshots/08-login.png" alt="Login"/><br/><b>Login</b> — role-based sign in</td>
  </tr>
</table>

---

## 📁 Repo Layout

```
transitops/
├── backend/                      # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma         # Data model (8 models, 8 enums)
│   │   └── seed.ts               # Rich demo dataset
│   └── src/
│       ├── config/permissions.ts # RBAC matrix (source of truth)
│       ├── middleware/           # auth + RBAC guards
│       └── modules/              # auth, vehicles, drivers, trips, fuel, analytics, settings, search
├── frontend/                     # React + Vite SPA
│   └── src/
│       ├── pages/                # one file per screen
│       ├── components/           # layout, ui, route guards
│       └── context/AuthContext   # session + permission hooks
├── screenshots/                  # images used in this README
└── package.json                  # npm workspaces + dev scripts
```

---

## 👥 Team & Ownership

| Member | Domain | Screens |
|---|---|---|
| Base | Auth, RBAC, layout, dashboard, integration | Login, Dashboard, Settings |
| Member 1 | Fleet | Vehicle Registry, Maintenance |
| Member 2 | Operations | Trip Dispatcher, Drivers & Safety |
| Member 3 | Finance | Fuel & Expenses, Analytics, Settings/RBAC |

---

<div align="center">
Built with ❤️ for the Odoo Hackathon
</div>
