# LogiTrack AI

> A multi-tenant logistics and delivery management platform for coordinating shipments, fleets, drivers, warehouses, and operational intelligence.

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?logo=nestjs&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?logo=react&logoColor=111827)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-4169E1?logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7%2B-DC382D?logo=redis&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-22C55E)

</div>

## Overview

LogiTrack AI brings the core workflows of a delivery operation into one application. Organizations can manage their people and resources, plan and track shipments, coordinate drivers, monitor locations, manage warehouse inventory, and generate operational reports.

The platform is built as a TypeScript monorepo-style project with separate applications:

- **Backend:** NestJS REST API with PostgreSQL persistence, TypeORM migrations, Redis caching and queues, JWT authentication, role-based access control, and Swagger documentation.
- **Frontend:** React single-page application with role-specific dashboards, protected routes, shipment and fleet workflows, maps, reports, and AI-assisted features.

## Key capabilities

### Operations

- Shipment creation, assignment, tracking, status updates, and delivery history
- Driver, vehicle, warehouse, product, and inventory management
- Driver location updates and map-based shipment coordination
- Waybill and shipment document workflows
- Customer shipment tracking and reviews

### Administration

- Multi-organization tenant model
- Super-admin and company-admin management areas
- Role-based access control (RBAC)
- User lifecycle, organization, subscription, plan, and billing workflows
- Audit and operational reporting

### Intelligence and automation

- AI-assisted route optimization
- Delay prediction
- In-app AI chatbot
- Redis-backed caching and Bull background jobs
- Email notifications and scheduled reporting workflows

## User roles

| Role | Primary responsibilities |
| --- | --- |
| **Super admin** | Manages organizations, plans, subscriptions, users, and platform-wide operations |
| **Company admin** | Manages an organization’s users, drivers, vehicles, warehouses, shipments, and reports |
| **Dispatcher** | Creates and assigns shipments, coordinates drivers, and monitors delivery progress |
| **Driver** | Views assigned shipments, follows routes, updates location, and submits delivery reports |
| **Customer** | Creates or tracks shipments and reviews delivery experiences |

## Architecture

```text
┌──────────────────────┐       HTTP/REST       ┌──────────────────────┐
│ React + Vite         │ ◄───────────────────► │ NestJS API           │
│ Frontend             │                       │ Authentication + RBAC│
│ http://localhost:5173│                       │ http://localhost:5000 │
└──────────────────────┘                       └──────────┬───────────┘
                                                           │
                                      ┌────────────────────┼────────────────────┐
                                      ▼                    ▼                    ▼
                              ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                              │ PostgreSQL   │     │ Redis        │     │ OpenAI API   │
                              │ Persistence  │     │ Cache + jobs │     │ AI features  │
                              └──────────────┘     └──────────────┘     └──────────────┘
```

## Technology stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Leaflet, Recharts |
| Backend | NestJS, TypeScript, Express, TypeORM, PostgreSQL, Swagger |
| Authentication | JWT, Passport, bcrypt, role-based guards |
| Infrastructure | Redis, Bull, Nodemailer |
| AI and data | OpenAI API, Xenova Transformers, Zod |
| Testing | Jest, Supertest, Vitest, Testing Library |

## Prerequisites

Install the following before starting local development:

- Node.js 20.x or a compatible current LTS release
- npm
- PostgreSQL 14 or newer
- Redis 7 or newer
- Git

Verify the required tools:

```bash
node --version
npm --version
psql --version
redis-server --version
git --version
```

## Getting started

### 1. Clone the repository

```bash
git clone https://github.com/DiellFazliu/LogiTrack-AI.git
cd LogiTrack-AI
```

### 2. Install dependencies

Install dependencies independently for each application:

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 3. Create the databases

Create a development database and, if you plan to run the test configuration, a test database:

```sql
CREATE DATABASE logitrack_db;
CREATE DATABASE logitrack_db_test;
```

### 4. Configure the backend

Create `backend/.env` with values appropriate for your local environment:

```env
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=logitrack_db
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=replace-with-your-openai-key

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=no-reply@logitrack.local
```

Never commit `.env` files or real credentials. Use separate credentials and secrets for development, testing, and production.

### 5. Configure the frontend

The frontend defaults to `http://localhost:5000` for the API. To use another API URL, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

### 6. Run database migrations

From `backend`:

```bash
npm run migration:run
```

### 7. Start the applications

Run each application in a separate terminal.

**Backend**

```bash
cd backend
npm run start:dev
```

**Frontend**

```bash
cd frontend
npm run dev
```

The applications are then available at:

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000>
- Swagger UI: <http://localhost:5000/api-docs>

## Database migrations

Run migration commands from the `backend` directory:

```bash
# Apply pending migrations
npm run migration:run

# Generate a migration from entity changes
npm run migration:generate -- src/migrations/DescriptiveMigrationName

# Create an empty migration
npm run migration:create -- src/migrations/DescriptiveMigrationName

# Revert the latest migration
npm run migration:revert
```

Keep migrations under version control. Do not enable TypeORM synchronization in shared or production environments.

## API documentation

The backend exposes an interactive Swagger UI when it is running:

<http://localhost:5000/api-docs>

The generated OpenAPI document is also available at:

<http://localhost:5000/api-docs-json>

The API uses bearer-token authentication for protected endpoints. Authenticate through the auth endpoints, then use the returned token in Swagger’s **Authorize** dialog.

## Common API areas

The API is organized around the following resource areas:

| Area | Examples |
| --- | --- |
| Authentication | Registration, login, refresh, logout, password changes |
| Users and organizations | Profiles, user administration, tenant management |
| Shipments | Creation, assignment, tracking, status, delivery operations |
| Drivers and vehicles | Driver profiles, fleet management, location updates |
| Warehouses and inventory | Warehouse, product, and stock management |
| Reports | Operational, daily, custom, and exportable reports |
| AI | Route optimization, delay prediction, and chatbot interactions |

Swagger is the source of truth for the complete request and response contract.

## Testing and quality checks

### Backend

```bash
cd backend
npm test
npm run test:cov
npm run test:e2e
npm run lint
npm run build
```

AI-specific end-to-end tests can be run with:

```bash
npm run test:e2e:ai
```

### Frontend

```bash
cd frontend
npm run test:run
npm run test:coverage
npm run lint
npm run build
```

Use `npm run test:watch` in either application when developing interactively.

## Project structure

```text
LogiTrack-AI/
├── backend/
│   ├── src/
│   │   ├── common/          # Guards, middleware, shared infrastructure
│   │   ├── config/          # Data-source and application configuration
│   │   ├── jobs/            # Queued and scheduled background work
│   │   ├── migrations/      # TypeORM database migrations
│   │   └── modules/         # Auth, shipments, users, reports, AI, and more
│   └── test/                # End-to-end test configuration
├── frontend/
│   └── src/
│       ├── components/      # Reusable UI and feature components
│       ├── context/         # Application providers and auth state
│       ├── hooks/           # Data and access hooks
│       ├── pages/           # Role-specific screens
│       ├── services/        # API clients and resource services
│       ├── types/           # Shared frontend types
│       └── utils/           # UI and data helpers
├── .github/
│   └── workflows/           # CI/CD workflows
├── LICENSE
└── README.md
```

## Contributing

1. Create a focused branch from the current development branch.
2. Keep changes scoped to one feature or fix.
3. Update migrations, tests, and documentation when behavior changes.
4. Run the relevant backend and frontend checks locally.
5. Open a pull request with a clear summary, testing notes, and screenshots for UI changes.

Please use GitHub Issues to report bugs or propose improvements:

<https://github.com/DiellFazliu/LogiTrack-AI/issues>

## License

LogiTrack AI is released under the MIT License. See [LICENSE](./LICENSE) for details.

## Team

LogiTrack AI is developed by:

- Arijana Braha
- Albin Maqastena
- Diona Sadiku
- Diell Fazliu
- Flon Kastrati
- Fion Islami

Project mentorship:

- Prof. Dr. Isak Shabani
- Ass. Msc. Blend Arifaj
