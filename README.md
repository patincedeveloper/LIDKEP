# LIDKEP functional prototype

LIDKEP is Rwanda's Local Innovation Discovery and Knowledge Exchange Platform.
The functional prototype implements the updated four-actor conceptual framework across Innovator, System Administrator, Expert, and Investor / Industry Partner workspaces.

## Prototype actors

- **Innovator:** self-registers, completes and submits a profile for approval, creates and submits innovations, uploads supporting files, records progress, responds to Expert feedback, and decides Partner requests.
- **System Administrator:** approves submitted profiles, manages users, reviews submissions before assigning Experts, manages classifications and active evaluation criteria, and reviews reports.
- **Expert:** completes the same approval gate, immediately reviews assigned immutable submissions, scores the frozen criteria version, requests revisions, or publishes through an approval recommendation.
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
- Upload evidence with Administrator-only, review-team, or public-after-publication access and open saved supporting links.
- Receive linked workflow notifications, review full Expert feedback, and resubmit improvements to the same Expert.
- Update profile information.

### System Administrator

- Live dashboard counts for users, approvals, innovations, and publication.
- Approve or reject every self-registered account.
- Activate, suspend, or disable users without deleting them.
- Review the complete submitted version before assigning exactly one approved Expert.
- Monitor Expert revision rounds and automatic publication outcomes.
- Manage sectors, categories, districts, maturity levels, and impact areas.
- Create criteria versions with 2–12 weighted criteria, activate the version used for new assignments, and safely switch versions without changing existing reviews.
- View prototype reports and manage settings.
- Archive innovation content while preserving review and engagement history.

### Expert

- Receive only assignments created by the System Administrator.
- Open an assigned immutable submission and begin evaluating immediately.
- Open review-team documents and supporting links attached to the assigned version.
- Score all active weighted criteria from 0 to 5 with criterion comments.
- Save a draft evaluation and choose only Recommend approval or Request revisions.
- Publish the reviewed version automatically when Recommend approval is submitted.
- Review improved versions from the same Innovator without reassignment.
- Review submitted evaluation history and notifications.

### Investor / Industry Partner

- Search and open only approved published innovations.
- Send contact, funding, or partnership requests with mandatory non-binding acknowledgement.
- Send at most one collaboration request for each innovation, regardless of request type or final response.
- Track pending, clarification, accepted, declined, or withdrawn opportunities.
- Receive the Innovator email and phone automatically when the Innovator accepts.

### Innovator collaboration response

- Receive Partner requests for owned published innovations.
- Accept and share both saved email and phone, request clarification, or decline.
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
