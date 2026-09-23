# LIDKEP route inventory

## Public website

- `/` — home
- `/discover` — published innovation directory and filters
- `/innovations/:slug` — stable public innovation detail
- `/statistics` — public aggregate statistics
- `/about` — platform process and actor responsibilities
- `/login`, `/register`, `/forgot-password`, `/change-password` — identity pages
- `/forbidden`, `/session-expired`, `/offline`, `/maintenance`, unmatched 404 — system states

## Innovator — Phase 1 functional

- `/innovator/dashboard` — owned-record and notification summary
- `/innovator/innovations` — owned innovations
- `/innovator/innovations/new` — create draft
- `/innovator/innovations/:id` — edit, upload evidence, and submit
- `/innovator/revisions` and `/innovator/revisions/:id` — versioned Expert feedback, responses, and revise action
- `/innovator/collaborations` — Partner requests and Innovator decisions
- `/innovator/notifications` — workflow notifications
- `/innovator/profile` — profile information

## System Administrator — Phase 1 functional

- `/admin/dashboard` — live prototype overview
- `/admin/users` — account status management
- `/admin/verifications` — role registration decisions
- `/admin/innovations` — submitted innovation queue and workflow monitoring
- `/admin/innovations/:id` — detail-first review, one-time Expert assignment, review history, and archive
- `/admin/taxonomies` — sectors and classification lists
- `/admin/criteria` — variable-count criteria builder, version history, and active-version switching
- `/admin/reports` — prototype database summary
- `/admin/settings` — prototype settings
- `/admin/notifications` — workflow notifications

## Expert — functional

- `/expert/dashboard` — assignment and notification summary
- `/expert/assignments` — assigned review queue
- `/expert/assignments/:id` — immediate immutable submission review, scoring, comments, revision request, approval, and round history
- `/expert/history` — submitted evaluation history
- `/expert/notifications` — workflow notifications
- `/expert/profile` — profile completion, review submission, and account state

## Investor / Industry Partner — functional

- `/partner/dashboard` — published catalogue and opportunity summary
- `/partner/discover` — published innovation search
- `/partner/discover/:id` — published detail and structured request entry
- `/partner/opportunities` — request status and consented contact details
- `/partner/notifications` — workflow notifications
- `/partner/profile` — profile completion, review submission, and account state
