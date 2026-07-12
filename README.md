# TransitOps — Smart Transport Operations Platform

Fleet, trip, driver, maintenance, fuel, and analytics management for a transport depot.
Built for the **Odoo Hackathon**.

## Stack

| Layer | Tech |
|---|---|
| Database | **Neon (serverless PostgreSQL)** — used purely as a Postgres database, no BaaS auth/storage |
| ORM | Prisma (typed schema + migrations) |
| Backend | Node + Express + TypeScript |
| Auth | **Custom** JWT + bcrypt, written in code (no third-party auth) |
| Frontend | React + Vite + TypeScript + Tailwind + shadcn/ui |
| Validation | Zod (shared request validation) |

> The database is the only hosted piece. **Authentication, authorization (RBAC), business
> rules, and all APIs are implemented from scratch in this repo** — see `docs/ARCHITECTURE.md`.

## Repo layout

```
transitops/
├── backend/           # Express + Prisma API
├── frontend/          # React + Vite SPA
├── docs/
│   ├── ARCHITECTURE.md          # System design, data model, conventions
│   ├── HACKATHON.md             # Rules, evaluation criteria, team norms (READ FIRST)
│   ├── INTEGRATION-CONTRACT.md  # Uniformity bible: setup, contracts, pinned formulas
│   └── prompts/                 # Per-member task briefs (self-contained)
└── package.json       # npm workspaces + dev scripts
```

## Getting started

```bash
# 1. Install everything (root uses npm workspaces)
npm install

# 2. Configure env — copy the examples and fill in your Neon connection string
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Create the schema on Neon + seed demo data
npm run db:migrate
npm run db:seed

# 4. Run both apps
npm run dev
# backend  -> http://localhost:4000
# frontend -> http://localhost:5173
```

### Demo logins (created by the seed)

| Role | Email | Password |
|---|---|---|
| Fleet Manager | `manager@transitops.in` | `Passw0rd!` |
| Dispatcher | `dispatcher@transitops.in` | `Passw0rd!` |
| Safety Officer | `safety@transitops.in` | `Passw0rd!` |
| Financial Analyst | `finance@transitops.in` | `Passw0rd!` |

## Team & ownership

| Member | Domain | Screens | Brief |
|---|---|---|---|
| **You (base)** | Auth, RBAC, layout, dashboard, integration | 0, 1, 8(general) | — |
| **Member 1** | Fleet | Vehicle Registry (2), Maintenance (5) | `docs/prompts/MEMBER-1-FLEET.md` |
| **Member 2** | Operations | Trip Dispatcher (4), Drivers & Safety (3) | `docs/prompts/MEMBER-2-OPERATIONS.md` |
| **Member 3** | Finance | Fuel & Expenses (6), Analytics (7), Settings/RBAC (8) | `docs/prompts/MEMBER-3-FINANCE.md` |

See `docs/HACKATHON.md` for the rules everyone must follow (Git, validation, UI, etc.).
