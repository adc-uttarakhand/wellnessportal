# Uttarakhand Yoga Policy 2025 — Portal

A government portal for managing scheme applications under the **Uttarakhand Yoga Policy 2025**. Built with React + TypeScript (Vite) frontend and Express.js + PostgreSQL backend. NIC-hosting compatible — no Supabase or external cloud dependency.

---

## Schemes Covered

| Scheme | Description | Max Benefit |
|--------|-------------|-------------|
| Capital Subsidy | Yoga/Meditation Centre establishment | 50% hills ≤₹20L / 25% plains ≤₹10L |
| Research Grant | Universities & institutes | ≤₹10L per project |
| Teacher Certification | YCB Level 1–7 exam fee reimbursement | 500 beneficiaries/year |
| Existing Institution | Homestays, hotels, schools | ₹250/hr × 20hr × 3 months |

---

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, React Router v6
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL (raw `pg` pool — no ORM)
- **Auth:** JWT (8hr expiry, localStorage)
- **Styling:** Custom CSS with government design system (saffron + green + navy)

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14
- npm ≥ 9

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd yoga-portal
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — set DB credentials and JWT_SECRET
```

### 3. Create database and run schema

```bash
# Create PostgreSQL database
createdb yoga_portal

# Run schema (creates all tables + seeds budget data)
psql -d yoga_portal -f server/db/schema.sql
```

### 4. Run in development

```bash
# Terminal 1 — Backend
npm run server

# Terminal 2 — Frontend
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:3001

### 5. Build for production

```bash
npm run build
# Builds frontend to dist/
# Backend serves dist/ as static files
npm start
```

---

## User Roles

| Role | Access |
|------|--------|
| `STATE_ADMIN` | Full access — all districts, users, budget, verification |
| `DISTRICT_ADMIN` | Own district applications, registrations |
| `YOGA_CENTRE` | Apply for Capital Subsidy, Existing Institution schemes |
| `YOGA_PROFESSIONAL` | Apply for Teacher Certification scheme |
| `APPLICANT` | Apply for Research Grant (individuals/institutions) |

### Default Admin Account
After running schema.sql, a STATE_ADMIN is seeded:
- Email: `admin@yoga.uk.gov.in`
- Password: `Admin@1234` ← **Change immediately after first login**

---

## Project Structure

```
yoga-portal/
├── server/
│   ├── index.ts              # Express app entry
│   ├── db/
│   │   ├── pool.ts           # pg Pool + helpers
│   │   └── schema.sql        # Full database schema + seeds
│   ├── middleware/
│   │   └── auth.ts           # JWT middleware
│   └── routes/
│       ├── auth.ts           # /api/auth
│       ├── applications.ts   # /api/applications
│       ├── admin.ts          # /api/admin
│       └── registrations.ts  # /api/registrations
├── src/
│   ├── components/
│   │   └── shared/Layout.tsx # Sidebar + topbar
│   ├── hooks/
│   │   └── useAuth.tsx       # Auth context
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ApplicationsPage.tsx
│   │   ├── NewApplicationPage.tsx
│   │   ├── ApplicationDetailPage.tsx
│   │   ├── RegistrationPage.tsx
│   │   ├── AdminUsersPage.tsx
│   │   ├── AdminBudgetPage.tsx
│   │   └── AdminRegistrationsPage.tsx
│   ├── types/index.ts        # All TypeScript types
│   └── utils/api.ts          # Axios instances
└── .env.example
```

---

## API Endpoints

### Auth (`/api/auth`)
- `POST /login` — returns JWT token
- `POST /register` — new user registration
- `GET /me` — current user info
- `POST /change-password`

### Applications (`/api/applications`)
- `GET /` — list (filtered by role/district)
- `GET /:id` — detail
- `POST /` — create (body: `{ scheme_type, ...scheme_data }`)
- `PATCH /:id/status` — update status (admin only)
- `PATCH /:id/query-response` — applicant responds to query

### Admin (`/api/admin`)
- `GET /stats` — dashboard statistics
- `GET /users` / `POST /users` / `PATCH /users/:id`
- `GET /budget?fy=2025-26`
- `GET /registrations/centres` / `professionals`
- `PATCH /registrations/centre/:id/verify`
- `PATCH /registrations/professional/:id/verify`

### Registrations (`/api/registrations`)
- `POST /yoga-centre` — register a centre
- `POST /yoga-professional` — register a professional
- `GET /my` — own registration details

---

## NIC Hosting Notes

- No external dependencies (no Supabase, no Firebase, no AWS)
- PostgreSQL connection via standard `pg` pool — works with NIC-provided PostgreSQL
- Static frontend served by Express in production (`dist/` folder)
- Single port deployment (e.g. port 3001) — configure NIC reverse proxy accordingly
- Set `NODE_ENV=production` in environment
- Ensure `JWT_SECRET` is a strong 32+ character random string in production

---

## Developed Under

**National AYUSH Mission — Uttarakhand**  
Department of Ayurvedic and Unani Services, Government of Uttarakhand
