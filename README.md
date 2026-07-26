# LIDKEP professional MVP

LIDKEP is a responsive React/TypeScript demonstration of Rwanda's Local Innovation Discovery and Knowledge Exchange Platform.

## Run

```bash
npm install
npm dev
```

- Application: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`
- Full role demo selector: `http://localhost:5173/demo`

## Demo workspaces

No production credentials are stored in source. Use the demo selector to open a safe, non-persistent workspace for each authoritative role:

| Role | Demo identity | Start route |
| --- | --- | --- |
| System Administrator | Aline Uwase | `/admin/dashboard` |
| Innovator | Keza Nyirabazungu | `/innovator/dashboard` |
| Expert | Dr. Pascal Habimana | `/expert/dashboard` |
| Investor / Partner | Isoko Ventures | `/partner/dashboard` |
| Public User | Ariane Mukamana | `/discover` |

## Implemented UI journeys

- Public home, directory, combined filters, statistics, stable innovation detail URLs, sharing and system states.
- Registration, sign-in, password recovery and demo account access.
- Innovator dashboard, portfolio, multi-step autosave form, preview, versions, feedback, revisions, milestones, engagements, notifications and profile/team.
- Expert dashboard, assignment queue, screening checklist, weighted scoring, criterion comments, revision items, recommendation and history.
- Investor/Partner dashboard, discovery, saved opportunities, contact/funding/partnership forms, consent notice and engagement tracking.
- Administrator dashboard, users, verification, assignments, decisions, publication preview, moderation, taxonomies, criteria versions, reports, settings and audit logs.
- Responsive application shell from 360px, visible focus states, reduced-motion support and PWA manifest/offline shell.

All displayed domain data is obtained from the Express API. Components do not embed the mock dataset.

## PostgreSQL handoff

The current API repository is an in-memory demonstration backed by `lidkep_mock_data.json`. PostgreSQL/Prisma persistence, real Argon2id authentication, rotating sessions, TOTP MFA, durable uploads, queues and operational integrations are intentionally not represented as complete.

Connect PostgreSQL by replacing the JSON-backed repository behind the existing `/api/v1` contracts. The frontend routes and components should not require data-source changes.

## Verification

```bash
npm test
npm run build
npm audit --omit=dev
```

`npm test:e2e` is reserved for the database-backed acceptance environment.
