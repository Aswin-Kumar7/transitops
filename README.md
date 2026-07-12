<div align="center">

# TransitOps

**A full-stack transport operations platform for the modern fleet depot.**

Manage vehicles · Dispatch trips · Track fuel & cost · Enforce role-based access

<br/>

> Built for the Odoo Hackathon 2026

<br/>

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://neon.tech)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://prisma.io)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## Overview

TransitOps is a production-grade transport operations application that runs a vehicle fleet end to end — from registering a vehicle to closing out a completed trip with its fuel and expense records. It combines a fleet registry, a driver and safety module, a live trip dispatcher, a maintenance workflow, fuel and expense tracking, and an analytics suite — all behind a single role-based interface.

The backend is a RESTful Express API with a fully typed Prisma ORM layer on a serverless PostgreSQL database (Neon). The frontend is a React SPA styled with a Tailwind design system, charts rendered with Recharts, and a token-based auth flow backed by a single permission matrix that governs both the API and the UI. Nothing is outsourced to a backend-as-a-service — authentication, authorization, and every business rule are written in this repo.

---

## Screenshots

### Login

![Login](screenshots/login.png)

### Dashboard

![Dashboard](screenshots/dashboard.png)

### Vehicle Registry

![Vehicle Registry](screenshots/fleet.png)

### Drivers & Safety

![Drivers](screenshots/drivers.png)

### Trip Dispatcher

![Trip Dispatcher](screenshots/trips.png)

### Fuel & Expenses

![Fuel & Expenses](screenshots/fuel.png)

### Analytics

![Analytics](screenshots/analytics.png)

### Settings & RBAC

![Settings](screenshots/settings.png)

---

## Features

| Feature | Description |
|---|---|
| **Role-Based Access** | Four roles (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst) governed by one permission matrix that drives both API guards and UI navigation — screens you cannot edit are unreachable |
| **Vehicle Registry** | Full CRUD for vehicles with unique registration numbers, capacity, odometer, acquisition cost, region, and a status lifecycle (Available, On Trip, In Shop, Retired) |
| **Drivers & Safety** | Driver CRUD with license category and expiry; expired or suspended drivers are flagged and blocked from assignment at the server level |
| **Trip Dispatcher** | Full trip lifecycle (Draft, Dispatched, Completed, Cancelled) with a live capacity check that blocks over-weight dispatches |
| **Trip Completion Hand-off** | Completing a trip captures the final odometer and auto-creates the fuel log and expense records in a single atomic transaction |
| **Maintenance** | Log service records that move a vehicle to In-Shop (out of the dispatch pool) and close them to return it to Available |
| **Fuel & Expenses** | Track fuel logs and expenses per vehicle, link maintenance cost, and compute total operational cost (fuel + maintenance) |
| **Analytics** | Fuel efficiency, fleet utilization, operational cost, per-vehicle ROI, monthly revenue, and costliest-vehicle rankings as real database aggregations |
| **Global Search** | Permission-aware search across vehicles, drivers, and trips — returns only records the current role can read |
| **Settings & RBAC** | Depot configuration (name, currency, distance unit) plus the read-only permission matrix |
| **Auth & Security** | JWT sessions, bcrypt password hashing, a five-attempt account lockout, Zod validation, and Helmet headers — all server-side |
| **Responsive UI** | Soft-rounded card design system with a Poppins typeface, consistent across every screen |

---

## Tech Stack

### Frontend — `frontend/`

| Technology | Version | Role |
|---|---|---|
| **React** | 18 | UI component framework |
| **TypeScript** | 5 | End-to-end type safety |
| **Vite** | 6 | Build tool & HMR dev server |
| **Tailwind CSS** | 3 | Utility-first design system |
| **shadcn/ui** | — | Accessible component primitives |
| **React Router** | 6 | Client-side routing with protected route guards |
| **Recharts** | 2 | Dashboard & analytics charts (area, bar) |
| **Hugeicons / Lucide** | — | Icon systems |
| **React Context** | — | Auth session + permission hooks |
| **clsx + tailwind-merge** | — | Conditional class composition |

### Backend — `backend/`

| Technology | Version | Role |
|---|---|---|
| **Node.js** + **Express** | ≥18 / 4 | REST API server |
| **Prisma** | 5 | Type-safe ORM + migration runner |
| **PostgreSQL** (Neon) | 15 | Serverless relational database |
| **JSON Web Tokens** | — | Stateless auth, 8-hour access token |
| **bcryptjs** | — | Password hashing (10 rounds) |
| **Zod** | 3 | Request body/params validation via middleware |
| **Helmet** | — | Secure HTTP headers |
| **CORS** | — | Configured for client origin with credentials |
| **Morgan** | — | HTTP request logging (development) |

---

## Architecture

### High-Level Request Flow

```
Browser
  │
  ├─ React SPA (Vite, port 5173)
  │     ├─ fetch wrapper attaches Bearer token from localStorage
  │     ├─ On 401 → clears token → redirects to /login
  │     └─ AuthContext: user + permissions restored from /auth/me
  │
  └─ Express API (port 4000)
        ├─ Helmet + CORS + Morgan
        ├─ Zod validate middleware
        ├─ authenticate middleware (JWT verify)
        ├─ requirePermission middleware (RBAC guard)
        └─ Prisma ──────────────── Neon PostgreSQL
```

### Backend Module Structure

Each feature lives in `backend/src/modules/<feature>/`, typically as four files:

```
modules/
├── auth/          register · login · me (JWT + bcrypt + 5-attempt lockout)
├── dashboard/     live KPIs · filters · activity trend · status breakdowns
├── vehicles/      CRUD · status lifecycle · list filters
├── maintenance/   log service · close service (vehicle status sync)
├── drivers/       CRUD · status control · eligibility flags
├── trips/         create · dispatch · complete · cancel · options
├── fuel/          fuel logs · expenses · operational-cost summary
├── analytics/     efficiency · utilization · ROI · revenue · rankings
├── settings/      depot config · read-only RBAC matrix
└── search/        permission-scoped global search
```

Each module exports:
- **`*.routes.ts`** — Express router with middleware composition
- **`*.controller.ts`** — Thin request/response handlers
- **`*.service.ts`** — Prisma queries and business logic
- **`*.validation.ts`** — Zod validation schemas

### Frontend Page Map

```
pages/
├── Login          Role-scoped sign in with RBAC selector
├── Dashboard      Live KPIs, filters, interactive status charts, recent trips
├── Fleet          Vehicle registry — CRUD, filters, status control
├── Maintenance    Service log — vehicle In-Shop / return to Available
├── Drivers        Driver registry — license checks, eligibility, status
├── Trips          Trip dispatcher — lifecycle, capacity check, completion
├── Fuel           Fuel logs, expenses, linked maintenance, operational cost
├── Analytics      Efficiency, utilization, ROI, revenue, costliest vehicles
└── Settings       Depot configuration + RBAC permission matrix
```

### Access Control

A single permission matrix in `backend/src/config/permissions.ts` is the source of truth for the whole app. The frontend mirrors it for navigation and route guarding.

| Role | Fleet | Drivers | Trips | Fuel | Analytics | Settings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Fleet Manager** | Write | Write | — | — | Write | Write |
| **Dispatcher** | Read | — | Write | — | — | — |
| **Safety Officer** | — | Write | Read | — | — | — |
| **Financial Analyst** | Read | — | — | Write | Write | — |

Access levels: `none` (hidden / 403) · `view` (read-only) · `full` (read + write). The sidebar surfaces only the screens a role can **edit**, and route guards redirect any read-only screen reached by direct URL.

### Auth Flow

```
Register / Login
  └─ Server verifies bcrypt hash, then issues:
       accessToken  (JWT HS256, 8h → returned in response body)

Client stores accessToken in localStorage

Every request → Authorization: Bearer <accessToken>

accessToken invalid / expired (401) →
  fetch wrapper clears the token and redirects to /login

Five consecutive failed logins →
  account locked for LOCKOUT_MINUTES (server-enforced)
```

---

## Data Model

```
User
 └── createdTrips[]        Trip (audit — who created the trip)

Vehicle
 ├── maintenanceRecords[]  MaintenanceRecord
 ├── trips[]               Trip
 ├── fuelLogs[]            FuelLog
 └── expenses[]            Expense

Driver
 └── trips[]               Trip

Trip
 ├── vehicle              Vehicle?   (held while dispatched)
 ├── driver               Driver?    (held while dispatched)
 ├── fuelLogs[]           FuelLog    (created on completion)
 └── expenses[]           Expense    (created on completion)

Setting                    Singleton row — depot name, currency, distance unit
```

**Key design decisions:**

- `Vehicle.registrationNo`, `Driver.licenseNo`, and `Trip.tripCode` are all `@unique` — enforced at the database level
- `Trip.vehicleId` and `Trip.driverId` are nullable — a draft can exist before assignment, and resources are released back to the pool on completion or cancellation
- Trip completion runs inside a **Prisma transaction** — odometer capture, fuel log, expenses, and vehicle/driver status change all commit together or not at all
- `MaintenanceRecord` status (`IN_SHOP` / `COMPLETED`) is kept in sync with the parent vehicle's status
- `Setting` is a singleton (`@id @default(1)`) — one depot configuration row
- Indexes on `status`, `type`, `region`, `vehicleId`, and `driverId` serve the filtered list and dashboard queries efficiently
- Fuel logs and expenses cascade-delete with their vehicle; trip links are preserved for audit

**Enums:**

| Enum | Values |
|---|---|
| `Role` | `FLEET_MANAGER` · `DISPATCHER` · `SAFETY_OFFICER` · `FINANCIAL_ANALYST` |
| `VehicleType` | `VAN` · `TRUCK` · `MINI` |
| `VehicleStatus` | `AVAILABLE` · `ON_TRIP` · `IN_SHOP` · `RETIRED` |
| `LicenseCategory` | `LMV` · `HMV` |
| `DriverStatus` | `AVAILABLE` · `ON_TRIP` · `OFF_DUTY` · `SUSPENDED` |
| `TripStatus` | `DRAFT` · `DISPATCHED` · `COMPLETED` · `CANCELLED` |
| `MaintenanceStatus` | `IN_SHOP` · `COMPLETED` |
| `ExpenseCategory` | `TOLL` · `FUEL` · `MAINTENANCE` · `MISC` |

---

## Security

| Layer | Implementation |
|---|---|
| **Password storage** | bcrypt, 10 rounds |
| **Access token** | JWT HS256, 8-hour TTL, stored in localStorage |
| **Account lockout** | Five consecutive failed logins lock the account for a configurable window |
| **Input validation** | Zod schemas enforced via `validate` middleware before every controller |
| **Authorization** | `authenticate` (JWT verify) + `requirePermission` (RBAC matrix) on protected routes |
| **RBAC source of truth** | Single matrix drives backend guards and frontend nav/route gating |
| **HTTP headers** | Helmet sets `X-Content-Type-Options`, `X-Frame-Options`, CSP, and more |
| **CORS** | Restricted to the configured client origin with credentials |
| **Business-rule enforcement** | Capacity checks, driver eligibility, and status lifecycles enforced server-side, not just in the UI |

---

## Quick Start

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (free tier on [Neon](https://neon.tech) works perfectly)
- npm

### 1 · Clone

```bash
git clone https://github.com/Aswin-Kumar7/transitops.git
cd transitops
```

### 2 · Install (npm workspaces)

```bash
npm install
```

### 3 · Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

`backend/.env`:

```env
DATABASE_URL="postgresql://user:pass@host-pooler/db?sslmode=require"
DIRECT_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="at-least-32-char-random-string"
JWT_EXPIRES_IN="8h"
MAX_FAILED_LOGINS="5"
LOCKOUT_MINUTES="15"
PORT="4000"
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### 4 · Migrate + seed

```bash
npm run db:migrate   # prisma migrate dev
npm run db:seed      # seeds users + rich demo fleet, drivers, trips, fuel, expenses
```

### 5 · Run both apps

```bash
npm run dev
# backend  → http://localhost:4000
# frontend → http://localhost:5173
```

### Demo Logins

All accounts use the password **`Passw0rd!`**

| Role | Email |
|---|---|
| Fleet Manager | `manager@transitops.in` |
| Dispatcher | `dispatcher@transitops.in` |
| Safety Officer | `safety@transitops.in` |
| Financial Analyst | `finance@transitops.in` |

---

## Project Structure

```
transitops/
│
├── screenshots/                     # UI screenshots for documentation
│
├── frontend/                        # React + TypeScript SPA
│   └── src/
│       ├── lib/
│       │   ├── api.ts               # fetch wrapper + token store + ApiError
│       │   └── utils.ts             # cn() + currency formatting
│       ├── context/
│       │   └── AuthContext.tsx      # session, permissions, canRead / canWrite
│       ├── components/
│       │   ├── layout/              # Sidebar, Topbar (global search), AppLayout
│       │   ├── ui/                  # badge, button, card, table, dropdown
│       │   └── ProtectedRoute.tsx   # auth + RBAC route guard
│       ├── config/
│       │   └── nav.ts               # sidebar items keyed to modules
│       ├── pages/                   # one file per screen (see page map above)
│       └── types/
│           └── index.ts             # shared TS interfaces (Vehicle, Trip, …)
│
└── backend/                         # Express + Prisma REST API
    ├── prisma/
    │   ├── schema.prisma            # Full data model (8 models, 8 enums)
    │   ├── migrations/              # Prisma migration history
    │   └── seed.ts                  # Rich demo dataset
    └── src/
        ├── app.ts                   # Express setup, middleware, route mounting
        ├── server.ts                # HTTP server entry point
        ├── config/
        │   ├── prisma.ts            # Prisma singleton
        │   ├── env.ts               # Validated environment config
        │   └── permissions.ts       # RBAC matrix (source of truth)
        ├── middleware/
        │   ├── auth.ts              # authenticate() + requirePermission()
        │   └── validate.ts          # Zod schema validation
        ├── modules/                 # Feature modules (routes · controller · service · validation)
        │   ├── auth/
        │   ├── dashboard/
        │   ├── vehicles/
        │   ├── maintenance/
        │   ├── drivers/
        │   ├── trips/
        │   ├── fuel/
        │   ├── analytics/
        │   ├── settings/
        │   └── search/
        ├── routes/
        │   └── index.ts             # Mounts all module routers
        └── utils/
            ├── ApiError.ts          # Operational error class with HTTP status
            ├── asyncHandler.ts      # Wraps async controllers to forward errors
            ├── jwt.ts               # Token sign + verify helpers
            └── password.ts          # bcrypt hash + verify
```

---

## API Reference

All endpoints are prefixed `/api`. Protected routes require `Authorization: Bearer <accessToken>`.
Responses follow a consistent envelope, with validation errors returned as `{ error, details }`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Create account, receive token |
| `POST` | `/auth/login` | — | Authenticate (with role check + lockout), receive token |
| `GET`  | `/auth/me` | Yes | Current user + permissions |

### Dashboard & Search

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/dashboard/summary` | Yes | KPIs, filters, activity trend, status breakdowns, recent trips |
| `GET` | `/search?q=` | Yes | Permission-scoped search across vehicles, drivers, trips |

### Vehicles

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/vehicles` | Yes | List with type / status / search filters |
| `POST`  | `/vehicles` | Fleet write | Create vehicle |
| `PUT`   | `/vehicles/:id` | Fleet write | Update vehicle |
| `PATCH` | `/vehicles/:id/status` | Fleet write | Change status (retire / reactivate / …) |

### Maintenance

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/maintenance` | Yes | Service records |
| `POST`  | `/maintenance` | Fleet write | Log service (vehicle → In-Shop) |
| `PATCH` | `/maintenance/:id/close` | Fleet write | Close service (vehicle → Available) |

### Drivers

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/drivers` | Yes | List drivers with eligibility flags |
| `POST`  | `/drivers` | Drivers write | Create driver |
| `PUT`   | `/drivers/:id` | Drivers write | Update driver |
| `PATCH` | `/drivers/:id/status` | Drivers write | Change driver status |

### Trips

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`   | `/trips` | Yes | All trips (live board) |
| `GET`   | `/trips/options` | Yes | Available vehicles + eligible drivers |
| `POST`  | `/trips` | Trips write | Create draft (with capacity check) |
| `PATCH` | `/trips/:id/dispatch` | Trips write | Dispatch (hold vehicle + driver) |
| `PATCH` | `/trips/:id/complete` | Trips write | Complete (odometer + fuel + expenses) |
| `PATCH` | `/trips/:id/cancel` | Trips write | Cancel with reason |

### Fuel & Expenses

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET`  | `/fuel/logs` | Yes | Fuel logs |
| `POST` | `/fuel/logs` | Fuel write | Add fuel log |
| `GET`  | `/fuel/expenses` | Yes | Expenses |
| `POST` | `/fuel/expenses` | Fuel write | Add expense |
| `GET`  | `/fuel/summary` | Yes | Operational cost (fuel + maintenance) |

### Analytics & Settings

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics/overview` | Analytics read | Efficiency, utilization, ROI, revenue, rankings |
| `GET` | `/settings` | Yes | Depot config + RBAC matrix |
| `PUT` | `/settings` | Settings write | Update depot configuration |

---

## Hackathon Context

TransitOps was designed and built end-to-end for the **Odoo Hackathon 2026** — a sprint-format competition focused on building production-ready full-stack applications on a well-modeled relational database.

The project demonstrates:

- **Strong database design** — a normalized schema with unique constraints, nullable assignment relations, proper indexes, and atomic transactions for the trip-completion hand-off
- **Built from scratch** — authentication, authorization, and every business rule are implemented in this repo; PostgreSQL is the only hosted dependency
- **Role-based security** — a single permission matrix enforced at both the API and the UI, so access is consistent and cannot be bypassed by direct URL
- **Real business rules** — capacity checks block bad dispatches, expired and suspended drivers cannot be assigned, and vehicle status governs the entire lifecycle
- **End-to-end type safety** — Prisma schema through Express services to a typed React client with shared interfaces
- **Polished, consistent UI** — a soft-rounded card design system with Poppins, applied uniformly across every screen

---

<div align="center">
<sub>© 2026 TransitOps · Built for the Odoo Hackathon 2026 · Smart transport operations.</sub>
</div>
