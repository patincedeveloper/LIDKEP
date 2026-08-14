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
| Evidence | Upload PDF, DOCX, XLSX, image, or MP4 with visibility | Authorized download returns the stored file |
| Submission | Validate required fields and declarations; freeze submitted version | Incomplete records fail; complete records become `SUBMITTED` |
| Project progress | Add milestone title, description, date, status, and visibility | Update persists and appears after reload |
| Expert feedback | Display revision requests and store responses | Response is tied to the reviewed version |
| Notifications | Display status and approval messages and mark them read | Read state persists |
| Profile | Update identity, organization, district, biography, and language | Values persist and workspace identity refreshes |

### 3.2 System Administrator pages and functions

| Page | Core functions | Completion condition |
| --- | --- | --- |
| Overview | Live user, approval, innovation and publication counts | No fixed demo totals |
| Users | View safe fields; activate, suspend, or disable | Status is server-enforced and sessions are revoked when necessary |
| Account approvals | Approve or reject Innovator, Expert, and Partner registrations | Approved user can sign in; rejected user cannot |
| Innovations | Review all records and apply validated decisions | Invalid status transitions fail on the server |
| Publication | Publish only an approved immutable version | Public slug returns only the selected published version |
| Sectors and categories | Add and activate/deactivate classifications | Registration/editor filters use active values |
| Evaluation criteria | View versions and create weighted drafts totaling 100% | Invalid totals are rejected |
| Content moderation | Reject or archive an innovation with a reason | Innovator is notified of the decision |
| Reports | Show simple users/innovation database summaries | Values match database counts |
| Settings | Save the small prototype configuration set | Settings persist in PostgreSQL |

### 3.3 Phase 1 verification gate

Before starting Expert work, confirm:

- Registration for each selectable role creates a pending approval record.
- System Administrator approval enables sign-in.
- Innovator create → save → reload → submit works.
- Incomplete submission is rejected.
- Evidence and milestone records remain after reload.
- System Administrator can approve and then publish.
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
2. Expert accepts the assignment.
3. Expert completes the checklist and criterion scores.
4. Expert saves a draft review.
5. Expert requests revisions or submits approve/reject/revision recommendation.
6. Innovator receives comments and responds.
7. System Administrator sees the recommendation but remains the final decision maker.

### Prototype limits

- One active assignment per Expert and version.
- One criteria version per review.
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
5. Contact information is shown only after consent.
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
