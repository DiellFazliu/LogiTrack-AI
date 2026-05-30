LogiTrack AI
Platformë për menaxhimin e logjistikës dhe dërgesave me AI.

Përshkrimi
LogiTrack AI është një platformë web për menaxhimin e dërgesave, shoferëve, automjeteve, magazinave dhe produkteve. Përdor Inteligjencën Artificiale për optimizimin e rrugëve dhe parashikimin e vonesave.

Teknologjitë

Backend:
NestJS 10.x
TypeScript 5.x
PostgreSQL 14.x
TypeORM 0.3.x
Redis 7.x
Bull (Background Jobs)
JWT (Autentikim)
OpenAI API
Swagger (Dokumentim)

Frontend:
React 18.x
TypeScript 5.x
TailwindCSS 3.x
Vite 5.x
Axios
React Router 6.x
Recharts

Mjete:
Git & GitHub
GitHub Actions (CI/CD)
Postman
TablePlus

Karakteristikat:
Multi-tenancy (shumë organizata të izoluara)
RBAC (Role-Based Access Control
Gjurmim në kohë reale i dërgesave
Optimizim i rrugëve me AI
Parashikim i vonesave
Fletë rrugë dixhitale me QR Code
Inventar dhe menaxhim magazinash
Raporte ditore dhe mujore
Audit log për të gjitha aktivitetet
Njoftime në kohë reale

Rolet e Përdoruesve
Roli	        Përshkrimi
Super         Admin	Qasje në të gjitha organizatat
Company       Admin	Menaxhon organizatën e vet
Dispatcher  	Krijon dhe menaxhon dërgesa
Driver	      Sheh dërgesat e caktuara, përditëson statusin
Customer	    Krijon dhe gjurmon dërgesat e veta


Komandat Kryesore
Backend
bash
npm run start:dev          # Startimi në modalitet zhvillimi
npm run build              # Build-i për production
npm run migration:run      # Aplikimi i migrimeve
npm run migration:revert   # Anulimi i migrimit të fundit
npm run test               # Ekzekutimi i testeve
Frontend
bash
npm run dev                # Startimi në modalitet zhvillimi
npm run build              # Build-i për production

API Endpoint-et Kryesore
Metoda        	Endpoint	                Përshkrimi
POST	          /auth/register	          Regjistrimi
POST          	/auth/login	              Login
GET           	/users/me	                Profili aktual
POST           	/shipments	              Krijo dërgesë
GET	            /shipments              	Lista e dërgesave
PATCH	          /shipments/:id/status   	Përditëso statusin
GET	            /tracking/:trackingNumber	Gjurmimi publik
POST	          /ai/optimize-route	      Optimizimi i rrugës
Dokumentimi i plotë: http://localhost:5000/api-docs

Database

31 tabela të organizuara në 7 grupe:
Multi-tenancy dhe organizatat
Përdoruesit dhe RBAC
Dërgesat, shoferët, automjetet
Magazinat dhe inventari
Optimizimi me AI dhe rrugët
Faturimi dhe financat
Sistemi dhe auditimi

Migrimet
bash
npm run migration:create -- src/migrations/Emri
npm run migration:generate -- src/migrations/Emri
npm run migration:run
npm run migration:revert

Testimi
bash
# Backend
cd backend
npm run test        # Unit testet
npm run test:e2e    # API testet

# Frontend
cd frontend
npm run test

CI/CD (GitHub Actions)

Pipeline ekzekutohet automatikisht në çdo push ose pull request:
Instalimi i dependency-ve
Unit testet
API testet
Build-i i projektit

Menaxhimi i Projektit
Projekti është menaxhuar përmes GitHub Projects me kolonat:
Backlog
To Do
In Progress
In Review
Done

Branch Strategjia
main – Kodi në production
develop – Integrimi i të gjithë kodit
feature/* – Veçori të reja
backend/setup – Zhvillimi i backend
frontend/setup – Zhvillimi i frontend

Kontributet
Studentët:
Arijana Braha
Albin Maqastena
Diona Sadiku
Diell Fazliu
Flon Kastrati
Fion Islami
Profesor: Prof. Dr. Isak Shabani
Asistent: Ass. Msc. Blend Arifaj

