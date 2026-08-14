# LIDKEP functional prototype

LIDKEP is Rwanda's Local Innovation Discovery and Knowledge Exchange Platform.
The functional prototype implements the updated four-actor conceptual framework across Innovator, System Administrator, Expert, and Investor / Industry Partner workspaces.

## Prototype actors

- **Innovator:** self-registers, completes and submits a profile for approval, creates and submits innovations, uploads supporting files, records progress, responds to Expert feedback, and decides Partner requests.
- **System Administrator:** approves submitted profiles, manages users, assigns Experts, makes final innovation decisions, publishes records, manages classifications and criteria, and reviews reports.
- **Expert:** completes the same approval gate, accepts assigned immutable submissions, scores every active criterion, requests revisions, and submits recommendations to the System Administrator.
- **Investor / Industry Partner:** completes the approval gate, searches published innovations, sends non-binding contact/funding/partnership requests, and tracks consent-controlled opportunities.

Public innovation discovery does not require an account.

## Run locally

1. Install PostgreSQL and create a database named `lidkep`.
2. Copy `.env.example` to `.env` and enter the local PostgreSQL connection and initial account credentials.
3. Run:

```bash
npm install
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

- Web application: `http://localhost:5173`
- API: `http://localhost:3001/api/v1`

The seed provisions one System Administrator and one Innovator for reliable local access. A self-registered user can sign in only to complete a profile. Selecting **Submit profile for review** creates the administrator queue entry and shows the under-review state. Role operations remain server-blocked until approval.

## Current functional scope

### Innovator

- Account registration, approval gating, login, logout, and password change.
- Database-backed dashboard and owned innovation list.
- Create and update draft innovation records.
- Completion calculation and required declarations.
- Submit an immutable version for administrator review.
- Upload private prototype evidence files and download authorized files.
- Add project milestones/progress updates.
- Receive workflow notifications and respond to revision requests.
- Update profile information.

### System Administrator

- Live dashboard counts for users, approvals, innovations, and publication.
- Approve or reject every self-registered account.
- Activate, suspend, or disable users without deleting them.
- Review all innovations and apply validated status transitions.
- Approve and publish an innovation to the public registry.
- Manage sectors, categories, districts, maturity levels, and impact areas.
- View criteria versions and create a simple weighted draft.
- View prototype reports and manage settings.
- Moderate innovation content through reject/archive status decisions.

### Expert

- Receive only assignments created by the System Administrator.
- Accept an assignment and read the immutable submitted innovation version.
- Score all active weighted criteria from 0 to 5 with criterion comments.
- Save a draft evaluation, request a specific revision, or submit an approve/reject recommendation.
- Preserve the System Administrator as the final innovation decision maker.
- Review submitted evaluation history and notifications.

### Investor / Industry Partner

- Search and open only approved published innovations.
- Send contact, funding, or partnership requests with mandatory non-binding acknowledgement.
- Track pending, clarification, accepted, declined, or withdrawn opportunities.
- Receive private Innovator email/phone only when the Innovator accepts and grants that consent.

### Innovator collaboration response

- Receive Partner requests for owned published innovations.
- Accept and share selected contact fields, request clarification, or decline.
- Keep requests informational: the platform does not transfer money or create contracts.

## Intentionally excluded from this prototype phase

- Email delivery and password recovery messages.
- MFA, malware scanning, cloud object storage, queues, payments, and deployment automation.
- Advanced analytics and formatted report exports.

The complete phased page and workflow plan is in [`docs/full-functionality-plan.md`](docs/full-functionality-plan.md).

## Verification

```bash
npm test
npm run build
npm run prisma:validate
```

The integration suite exercises registration, restricted profile completion, explicit profile submission, the under-review state, administrator approval, Innovator submission, Expert assignment/scoring/recommendation, final publication, Partner opportunity creation, Innovator consent, and contact-field disclosure. Test records are removed after each run.
