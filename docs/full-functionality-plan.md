# LIDKEP full functionality plan

## 1. Product direction

LIDKEP is a four-actor prototype based on the updated conceptual framework:

1. Innovator
2. System Administrator
3. Expert
4. Investor / Industry Partner

People registering from the public website select Innovator, Expert, or Investor / Industry Partner. System Administrator accounts are provisioned through the local seed and are not available for public selection. Every self-registered account remains pending until a System Administrator approves or rejects it.

The prototype uses a restrained professional interface, visible workflow status, responsive forms, clear empty states, and database-backed success feedback. Advanced production features are deliberately excluded.

## 2. Shared system structure

### Public area

- Home and platform explanation
- Published innovation directory
- Keyword, sector, district, and maturity filters
- Public innovation details
- Public statistics
- Registration, login, and account-state feedback

### Shared account functions

- Role-based registration
- Pending account approval
- Secure sign-in and sign-out
- Required password change for provisioned accounts
- Profile update
- Notifications
- Role-appropriate navigation and API authorization

## 3. Phase 1 — Innovator and System Administrator

Status: implemented and covered by database-backed integration tests.

### 3.1 Innovator pages and functions

| Page | Core functions | Completion condition |
| --- | --- | --- |
| Overview | Owned innovation, draft, feedback, and notification counts | Counts come from the signed-in user's PostgreSQL records |
| My innovations | List only owned records and create a draft | Another Innovator cannot retrieve the record |
| Innovation editor | Save structured problem, solution, beneficiaries, classifications, impact, and support needs | Reload shows the saved values |
| Evidence | Upload PDF, DOCX, XLSX, image, or MP4 with visibility and add supporting links | Owner and Administrator retain access, assigned Expert receives review-team files, and published pages expose only public files |
| Submission | Validate required fields and declarations; freeze submitted version | Incomplete records fail; complete records become `SUBMITTED` |
| Expert feedback | Display versioned scores, recommendation, rationale, comments, revisions, and responses | Every review round remains available after resubmission |
| Notifications | Display linked workflow messages and mark all or individual items read | Read state persists and actions open the related record |
| Profile | Update identity, organization, district, biography, and language | Values persist and workspace identity refreshes |

### 3.2 System Administrator pages and functions

| Page | Core functions | Completion condition |
| --- | --- | --- |
| Overview | Live user, approval, innovation and publication counts | No fixed demo totals |
| Users | View safe fields; activate, suspend, or disable | Status is server-enforced and sessions are revoked when necessary |
| Account approvals | Approve or reject Innovator, Expert, and Partner registrations | Approved user can sign in; rejected user cannot |
| Innovations | Open the complete submitted version before assigning one Expert | Assignment fails until the detail review is recorded |
| Publication | Monitor automatic publication after an Expert recommends approval | Public slug returns the exact reviewed version |
| Sectors and categories | Add and activate/deactivate classifications | Registration/editor filters use active values |
| Evaluation criteria | Create 2–12 named criteria with guidance and weights, then activate or reactivate a version | Exactly one version is active, weights total 100%, and existing assignments retain their frozen version |
| Content moderation | Archive an innovation while retaining workflow history | Innovator is notified of the archive |
| Reports | Show simple users/innovation database summaries | Values match database counts |
| Settings | Save the small prototype configuration set | Settings persist in PostgreSQL |

### 3.3 Phase 1 verification gate

Before starting Expert work, confirm:

- Registration for each selectable role creates a pending approval record.
- System Administrator approval enables sign-in.
- Innovator create → save → reload → submit works.
- Incomplete submission is rejected.
- Evidence and milestone records remain after reload.
- System Administrator detail review is required before Expert assignment.
- Expert approval publishes the reviewed version without an Administrator decision.
- Published innovation appears in public discovery.
- Suspension blocks an existing account session.
- Management decisions notify the affected user and persist their workflow state.

## 4. Phase 2 — Expert

Status: implemented and covered by the four-role lifecycle integration test.

### Pages

- Expert overview
- Assigned innovation queue
- Submitted-version reader
- Evaluation checklist
- Weighted scoring form
- Criterion comments
- Revision request form
- Recommendation confirmation
- Review history
- Notifications and profile

### Workflow

1. System Administrator assigns a submitted immutable version to an approved Expert.
2. Assignment changes the innovation to `UNDER_REVIEW`; no Expert acceptance is required.
3. Expert completes the checklist and criterion scores and saves a draft review.
4. Request revisions returns the innovation to its owner with versioned feedback.
5. Innovator improves and resubmits; the same Expert receives the new immutable version.
6. Recommend approval publishes that reviewed version automatically.

### Prototype limits

- One locked Expert assignment per innovation, reused across revision rounds.
- One immutable review per assignment and submitted version.
- No automatic AI scoring, matching, or recommendation.
- No advanced reviewer performance analytics.

## 5. Phase 3 — Investor / Industry Partner

Status: implemented and covered by the four-role lifecycle integration test.

### Pages

- Partner overview
- Published innovation search and filters
- Innovation detail and Innovator contact request
- Funding offer form
- Partnership request form
- Opportunity tracking list
- Engagement detail/status history
- Notifications and profile

### Workflow

1. Approved Partner searches published innovations.
2. Partner creates a contact, funding, or partnership request.
3. Request is explicitly non-binding and does not transfer funds.
4. Innovator accepts, declines, or requests clarification.
5. Acceptance grants that requesting Partner access to the Innovator email and phone.
6. Both parties track the opportunity status.

### Prototype limits

- No payment handling.
- No contracts or digital signatures.
- No automatic investment recommendations.
- No external CRM integrations.

## 6. Technical organization

### API layers

- Routes: HTTP paths and role middleware
- Validators: Zod request contracts
- Controllers: response/status handling
- Services: workflow rules and transactions
- Repositories: scoped reusable database access
- Prisma: schema and committed migrations

### Frontend layers

- Public pages
- Shared authentication/data context
- Role workspace shell
- Role-specific feature pages
- Reusable form, status, table, loading, error, and confirmation components

### Prototype security baseline

- Argon2id password hashing
- HTTP-only server-side sessions
- Role and ownership checks in the API
- Account-state enforcement
- Validated status transitions
- Structured request validation
- Private evidence download through authenticated routes
- API responses excluded from service-worker caching

## 7. Explicit non-goals

- Deployment and infrastructure automation
- Cloud object storage
- Email/SMS delivery
- MFA and SSO
- Malware scanning
- Payment processing
- AI recommendations
- Real-time chat
- Complex report builders
- Multi-tenant institution management

These can be reconsidered only after the four core actor workflows work reliably as a prototype.
