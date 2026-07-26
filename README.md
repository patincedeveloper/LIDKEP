# LIDKEP professional MVP

LIDKEP is Rwanda's Local Innovation Discovery and Knowledge Exchange Platform.

## Run

```bash
npm install
npm dev
```

- Application: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`

## Initial accounts

The production seed creates exactly two initial accounts from environment variables:

- `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD`
- `INITIAL_INNOVATOR_EMAIL` / `INITIAL_INNOVATOR_PASSWORD`

Both initial accounts must change their password. Other users register through `/register`;
Expert and Investor/Partner registrations await administrator approval.

## Implemented UI journeys

- Public home, directory, combined filters, statistics, stable innovation detail URLs, sharing and system states.
- Registration, sign-in, logout, secure sessions, account-state enforcement, and password changes.
- Innovator dashboard, portfolio, multi-step autosave form, preview, versions, feedback, revisions, milestones, engagements, notifications and profile/team.
- Expert dashboard, assignment queue, screening checklist, weighted scoring, criterion comments, revision items, recommendation and history.
- Investor/Partner dashboard, discovery, saved opportunities, contact/funding/partnership forms, consent notice and engagement tracking.
- Administrator dashboard, users, verification, assignments, decisions, publication preview, moderation, taxonomies, criteria versions, reports, settings and audit logs.
- Responsive application shell from 360px, visible focus states, reduced-motion support and PWA manifest/offline shell.

All displayed domain data is obtained from the Express API. Components do not embed the mock dataset.

## Backend foundation

Phase 1 provides an Express JavaScript application, validated environment configuration,
Prisma/PostgreSQL schema and migration, deterministic seed data, request IDs, security
headers, rate limiting, structured errors, and graceful shutdown.

Copy `.env.example` to `.env`, set PostgreSQL credentials, then run:

```bash
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

Demo identity routes and sample users have been removed. Public data and authenticated
workspace data are read from PostgreSQL.

## Docker

The Compose stack runs PostgreSQL 17, the Express API, and the production frontend:

```bash
cp .env.docker.example .env.docker
npm run docker:up
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`
- PostgreSQL host port: `5434`

The API waits for PostgreSQL, applies committed migrations, runs the idempotent seed,
and then starts. Database data is stored in the named `lidkep_postgres_data` volume.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev
```

`npm test:e2e` is reserved for the database-backed acceptance environment.
