# 🚚 LogiTrack AI

<div align="center">

### Platformë për menaxhimin e logjistikës dhe dërgesave me Inteligjencë Artificiale

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Node](https://img.shields.io/badge/node-20.x-green)
![NestJS](https://img.shields.io/badge/NestJS-10.x-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-06B6D4)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14.x-4169E1)
![Redis](https://img.shields.io/badge/Redis-7.x-DC382D)
![License](https://img.shields.io/badge/license-MIT-green)

</div>

---

# 📋 Përmbajtja

* [Përshkrimi](#-përshkrimi)
* [Teknologjitë](#-teknologjitë)
* [Karakteristikat Kryesore](#-karakteristikat-kryesore)
* [Arkitektura e Sistemit](#-arkitektura-e-sistemit)
* [Rolet e Përdoruesve](#-rolet-e-përdoruesve)
* [Kërkesat e Projektit](#-kërkesat-e-projektit)
* [Udhëzimi i Instalimit](#-udhëzimi-i-instalimit)
* [Konfigurimi i Ambientit](#-konfigurimi-i-ambientit)
* [Migrimet e Databazës](#-migrimet-e-databazës)
* [API Endpoint-et](#-api-endpoint-et)
* [Testimi](#-testimi)
* [CI/CD](#-cicd)
* [Struktura e Projektit](#-struktura-e-projektit)
* [Kontributet](#-kontributet)
* [Licenca](#-licenca)

---

# 🎯 Përshkrimi

**LogiTrack AI** është një platformë moderne web për menaxhimin e logjistikës dhe dërgesave, e cila përdor **Inteligjencën Artificiale (AI)** për të optimizuar operacionet e transportit.

Platforma ofron një zgjidhje të plotë për kompanitë e shpërndarjes, duke mundësuar:

* Menaxhimin e dërgesave
* Menaxhimin e shoferëve
* Menaxhimin e automjeteve
* Menaxhimin e magazinave
* Menaxhimin e inventarit
* Optimizimin inteligjent të rrugëve
* Raportimin dhe analizën e performancës

---

# 🛠️ Teknologjitë

## Backend

| Teknologjia | Versioni | Përshkrimi                   |
| ----------- | -------- | ---------------------------- |
| NestJS      | 10.x     | Framework për API skalabile  |
| TypeScript  | 5.x      | Gjuhë programuese e tipizuar |
| PostgreSQL  | 14.x     | Database relacional          |
| TypeORM     | 0.3.x    | ORM                          |
| Redis       | 7.x      | Cache & Queue                |
| Bull        | 4.x      | Background Jobs              |
| JWT         | -        | Authentication               |
| OpenAI API  | -        | AI Features                  |
| Swagger     | -        | API Documentation            |

## Frontend

| Teknologjia  | Versioni | Përshkrimi        |
| ------------ | -------- | ----------------- |
| React        | 18.x     | UI Library        |
| TypeScript   | 5.x      | Gjuhë programuese |
| TailwindCSS  | 3.x      | Styling           |
| Vite         | 5.x      | Build Tool        |
| Axios        | -        | HTTP Client       |
| React Router | 6.x      | Routing           |
| Recharts     | -        | Charts            |

## Mjete

| Mjeti           | Përshkrimi          |
| --------------- | ------------------- |
| Git & GitHub    | Version Control     |
| GitHub Actions  | CI/CD               |
| Postman         | API Testing         |
| TablePlus       | Database Management |
| GitHub Projects | Project Management  |

---

# ✨ Karakteristikat Kryesore

## 🏗️ Arkitektura & Siguria

| Karakteristika     | Përshkrimi                |
| ------------------ | ------------------------- |
| Multi-tenancy      | Ndarje sipas organizatave |
| RBAC               | Role Based Access Control |
| JWT Authentication | Login i sigurt            |
| Audit Logging      | Regjistrim aktivitetesh   |

## 📦 Menaxhimi i Logjistikës

| Karakteristika | Përshkrimi             |
| -------------- | ---------------------- |
| Dërgesat       | CRUD + Tracking        |
| Shoferët       | Menaxhim dhe vlerësime |
| Automjetet     | Menaxhim flotash       |
| Magazinat      | Menaxhim inventari     |
| Produktet      | Katalog produktesh     |

## 🤖 Inteligjenca Artificiale

| Karakteristika     | Përshkrimi           |
| ------------------ | -------------------- |
| Route Optimization | AI optimizon rrugët  |
| Delay Prediction   | Parashikon vonesat   |
| AI Chatbot         | Asistent inteligjent |

## 📊 Raportimi

| Karakteristika     | Përshkrimi              |
| ------------------ | ----------------------- |
| Raporte Ditore     | Analizë ditore          |
| Raporte Mujore     | Analizë mujore          |
| Driver Performance | Performanca e shoferëve |

## 🔔 Njoftimet

| Karakteristika      | Përshkrimi         |
| ------------------- | ------------------ |
| Email Notifications | Email automatik    |
| ETA Updates         | Përditësim ETA     |
| Auto Reports        | Raporte automatike |

---

# 🏗️ Arkitektura e Sistemit

```text
┌─────────────────────────────────────────────────────────────┐
│                       LOGITRACK AI                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐        HTTP/REST     ┌──────────────┐     │
│   │  FRONTEND   │ ◄──────────────────► │  BACKEND     │     │
│   │   React     │                      │   NestJS     │     │
│   │ Port: 5173  │                      │ Port: 5000   │     │
│   └─────────────┘                      └──────┬───────┘     │
│                                               │             │
│              ┌────────────────────────────────┼───────┐     │
│              │                                │       │     │
│              ▼                                ▼       ▼     │
│      ┌───────────────┐             ┌───────────────┐        │
│      │ PostgreSQL    │             │ Redis         │        │
│      │ Database      │             │ Cache/Queue   │        │
│      └───────────────┘             └───────────────┘        │
│                                              │              │
│                                              ▼              │
│                                      ┌───────────────┐      │
│                                      │ OpenAI API    │      │
│                                      │ AI Engine     │      │
│                                      └───────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Flow i të Dhënave

```yaml
1. React Client dërgon HTTP Request
2. Middleware autentikon JWT
3. Guards verifikojnë rolet
4. Controller pranon kërkesën
5. Service përpunon logjikën
6. TypeORM komunikon me PostgreSQL
7. Response kthehet në JSON
```

---

# 👥 Rolet e Përdoruesve

| Roli          | Përshkrimi           | Aksesi            |
| ------------- | -------------------- | ----------------- |
| Super Admin   | Menaxhon sistemin    | Full Access       |
| Company Admin | Menaxhon organizatën | Organizata        |
| Dispatcher    | Planifikon dërgesa   | Logistics         |
| Driver        | Kryen dërgesat       | Driver Portal     |
| Customer      | Klienti              | Shipment Tracking |

---

# ✅ Kërkesat e Projektit

| #  | Kërkesa                        | Statusi |
| -- | ------------------------------ | ------- |
| 1  | Arkitektura Client-Server      | ✅       |
| 2  | HTTP/HTTPS REST                | ✅       |
| 3  | Minimum 20 Endpoint-e          | ✅       |
| 4  | RESTful API                    | ✅       |
| 5  | OOP Programming                | ✅       |
| 6  | Swagger Documentation          | ✅       |
| 7  | ORM + Database                 | ✅       |
| 8  | Authentication & Authorization | ✅       |
| 9  | Middleware                     | ✅       |
| 10 | React Frontend                 | ✅       |
| 11 | Testing + CI/CD                | ✅       |
| 12 | Migrations                     | ✅       |
| 13 | Documentation                  | ✅       |
| 14 | Project Management             | ✅       |
| 15 | Git Collaboration              | ✅       |
| 16 | OpenAI Integration             | ✅       |
| 17 | Redis Caching                  | ✅       |
| 18 | Async Tasks                    | ✅       |
| 19 | Multi-Tenancy                  | ✅       |
| 20 | Search & Filtering             | ✅       |

---

# 🚀 Udhëzimi i Instalimit

## Parakushtet

```bash
node --version
psql --version
redis-server --version
git --version
```

## Instalimi

```bash
git clone https://github.com/username/LogiTrack-AI.git

cd LogiTrack-AI/backend
npm install

cd ../frontend
npm install
```

---

# ⚙️ Konfigurimi i Ambientit

## Backend (.env)

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=logitrack_db
DB_USER=postgres
DB_PASSWORD=postgres

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

OPENAI_API_KEY=your-openai-key

CLIENT_URL=http://localhost:5173
```

## Krijimi i Database

```sql
CREATE DATABASE logitrack_db;
CREATE DATABASE logitrack_db_test;
```

---

# 🗄️ Migrimet e Databazës

```bash
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run migration:show
```
# 🔗 API Endpoint-et

## Auth

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | /auth/register        |
| POST   | /auth/login           |
| POST   | /auth/logout          |
| POST   | /auth/refresh         |
| POST   | /auth/change-password |

## Users

| Method | Endpoint   |
| ------ | ---------- |
| GET    | /users     |
| GET    | /users/me  |
| GET    | /users/:id |
| PUT    | /users/:id |
| DELETE | /users/:id |

## Shipments

| Method | Endpoint              |
| ------ | --------------------- |
| POST   | /shipments            |
| GET    | /shipments            |
| GET    | /shipments/:id        |
| PUT    | /shipments/:id        |
| PATCH  | /shipments/:id/status |
| DELETE | /shipments/:id        |

## AI

| Method | Endpoint                      |
| ------ | ----------------------------- |
| POST   | /ai/optimize-route            |
| POST   | /ai/predict-delay/:shipmentId |
| POST   | /ai/chatbot                   |

---

# 📚 Swagger Documentation

```text
http://localhost:5000/api-docs
```

---

# 🧪 Testimi

## Backend

```bash
npm run test
npm run test:watch
npm run test:cov
npm run test:e2e
```

## Frontend

```bash
npm run test
```

## Coverage

| Moduli    | Coverage |
| --------- | -------- |
| Users     | 86.55%   |
| Auth      | 42.01%   |
| Reviews   | 52.06%   |
| Shipments | 25.07%   |
| Total     | 38%      |

🎯 Target Coverage: **70%**

---

# 🔄 CI/CD

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]

jobs:
  backend:
    runs-on: ubuntu-latest

  frontend:
    runs-on: ubuntu-latest
```

---

# 📁 Struktura e Projektit

```text
LogiTrack-AI
│
├── backend
│   ├── src
│   │   ├── modules
│   │   ├── common
│   │   ├── config
│   │   └── migrations
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── hooks
│   │   ├── services
│   │   └── context
│
├── .github
│   └── workflows
│
├── README.md
└── LICENSE
```

---

# 👥 Kontributet

## Studentët

| Emri            | 
| --------------- |
| Arijana Braha   | 
| Albin Maqastena |
| Diona Sadiku    | 
| Diell Fazliu    | 
| Flon Kastrati   | 
| Fion Islami     |

## Mentorët

| Pozita   | Emri                   |
| -------- | ---------------------- |
| Profesor | Prof. Dr. Isak Shabani |
| Asistent | Ass. Msc. Blend Arifaj |

---

# 📄 Licenca

Ky projekt është licencuar nën **MIT License**.

---

# 📞 Kontakt

Për pyetje ose sugjerime:

**GitHub Issues**

https://github.com/username/LogiTrack-AI/issues

---

<div align="center">

© 2026 LogiTrack AI. Të gjitha të drejtat e rezervuara.

</div>
