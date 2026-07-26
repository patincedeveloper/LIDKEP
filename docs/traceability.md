# LIDKEP PRD traceability

This matrix describes the demo-complete frontend and API-contract implementation. Database-dependent acceptance remains pending PostgreSQL.

| PRD IDs | Evidence |
| --- | --- |
| IAM-01 - IAM-07, PRO-01 - PRO-06 | Registration/login/recovery pages, five-role demo access, profile/verification/security screens, exact role fixture assertions |
| INN-01 - INN-07 | Innovator portfolio, multi-step autosave draft form, required structured fields, evidence/visibility/declarations, version-aware workspace and preview |
| TRK-01 | Milestone and progress screens with status values and visibility language |
| REV-01 - REV-09 | Assignment queues, immutable version reference, screening checklist, weighted scoring, comments, revisions, recommendation, decisions and publication preview |
| DIS-01 - DIS-05 | Public API filtering, combined UI filters, public-only detail serializer, aggregate statistics, stable `/innovations/:slug` routes |
| ENG-01 - ENG-07 | Saved opportunities, structured engagement types, participant actions, consent-based contact language, status tracking, safety/reporting controls |
| NTF-01 | Notification centre and realistic event fixtures |
| ADM-01 - ADM-05 | Users, verification, taxonomy, criteria, publication, moderation, reports, settings and audit pages |
| BR-01 | Exact five-role assertion in `api/src/mockData.test.ts` |
| BR-03 - BR-08 | Role-specific routes and public-only API detail route; unpublished slugs return 404 |
| BR-12 / ENG-06 | Non-binding/no-funds notices before and within engagement flows |
| NFR-03 - NFR-05, NFR-09 | Responsive shell from 360px, semantic fields, focus states, reduced motion, PWA manifest/offline state, language setting foundation |

## PostgreSQL-dependent items

- Prisma schema and deterministic migrations.
- Argon2id seed credential hashing and repeatable database seeding.
- Server-enforced sessions, CSRF, TOTP MFA, durable authorization policies and audit persistence.
- Object storage, signed files, malware scan integration, queues and email delivery.
- Concurrency/transaction tests, backup/restore and production acceptance suite.
