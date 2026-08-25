import { useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleUserRound,
  ClipboardCheck,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Gauge,
  Handshake,
  Leaf,
  Link2,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  Pencil,
  Search,
  Send,
  Save,
  Settings,
  ShieldCheck,
  Tags,
  Trash2,
  UploadCloud,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { ApiRequestError, usePlatform } from "../api";
import { palette } from "../styles";
import type {
  Account,
  Assignment,
  Engagement,
  Innovation,
  InnovationFeedback,
  Role,
} from "../types";
import {
  countWords,
  fullNameIsValid,
  identificationNumberError,
  projectCoverageLevels,
} from "../validation";
import {
  Brand,
  Button,
  ButtonLink,
  EmptyState,
  Eyebrow,
  Field,
  FormGrid,
  Input,
  PageHeader,
  Panel,
  PanelBody,
  PanelHeader,
  PasswordInput,
  Select,
  StatCard,
  StatGrid,
  StatusBadge,
  Table,
  TableWrap,
  Textarea,
} from "../ui";


type NavigationItem = { label: string; section: string; icon: React.ReactNode };
type AdminDashboard = {
  counts: {
    users: number;
    pendingVerifications: number;
    innovations: number;
    submitted: number;
    published: number;
  };
};
type Verification = {
  id: string;
  name: string;
  email?: string;
  organization: string;
  role: Role;
  status: string;
  evidence: number;
  submittedAt?: string;
  decisionReason?: string;
  decidedAt?: string;
  identificationType?: string;
  identificationNumber?: string;
  phoneNumber?: string;
  educationLevel?: string;
  province?: string;
  district?: string;
  administrativeSector?: string;
  occupation?: string;
  yearsOfExperience?: number;
  preferredLanguage?: string;
  publicProfile?: boolean;
  evidenceFiles?: Array<{
    id: string;
    name: string;
    mimeType: string;
    sizeBytes: string;
  }>;
};
type Taxonomy = { id: string; type: string; label: string; isActive: boolean };
type CriteriaVersion = {
  id: string;
  version: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  activatedAt: string;
  retiredAt: string;
  createdAt: string;
  criteria: Array<{
    id: string;
    name: string;
    guidance: string;
    weight: number;
  }>;
};
type CriteriaDraftItem = { name: string; guidance: string; weight: number };
type SettingsData = {
  publicStatistics: boolean;
  allowComments: boolean;
  maintenanceMode: boolean;
  maxFileSizeMb: number;
};
type FieldErrors = Record<string, string>;

const roleWorkspace: Record<Role, string> = {
  SYSTEM_ADMINISTRATOR: "admin",
  INNOVATOR: "innovator",
  EXPERT: "expert",
  INVESTOR_PARTNER: "partner",
};
const workspaceRole: Record<string, Role> = {
  admin: "SYSTEM_ADMINISTRATOR",
  innovator: "INNOVATOR",
  expert: "EXPERT",
  partner: "INVESTOR_PARTNER",
};

const navigation: Record<
  "admin" | "innovator" | "expert" | "partner",
  NavigationItem[]
> = {
  innovator: [
    { label: "Overview", section: "dashboard", icon: <Gauge /> },
    { label: "My innovations", section: "innovations", icon: <FolderKanban /> },
    {
      label: "Expert feedback",
      section: "revisions",
      icon: <ClipboardCheck />,
    },
    {
      label: "Collaboration requests",
      section: "collaborations",
      icon: <Handshake />,
    },
    { label: "Notifications", section: "notifications", icon: <Bell /> },
    { label: "My profile", section: "profile", icon: <CircleUserRound /> },
  ],
  admin: [
    { label: "Overview", section: "dashboard", icon: <Gauge /> },
    { label: "Users", section: "users", icon: <Users /> },
    {
      label: "Account approvals",
      section: "verifications",
      icon: <UserCheck />,
    },
    { label: "Innovations", section: "innovations", icon: <FolderKanban /> },
    { label: "Sectors & categories", section: "taxonomies", icon: <Tags /> },
    {
      label: "Evaluation criteria",
      section: "criteria",
      icon: <ClipboardCheck />,
    },
    { label: "Reports", section: "reports", icon: <BarChart3 /> },
    { label: "Settings", section: "settings", icon: <Settings /> },
    { label: "Notifications", section: "notifications", icon: <Bell /> },
  ],
  expert: [
    { label: "Overview", section: "dashboard", icon: <Gauge /> },
    {
      label: "Assigned reviews",
      section: "assignments",
      icon: <ClipboardCheck />,
    },
    { label: "Review history", section: "history", icon: <FileText /> },
    { label: "Notifications", section: "notifications", icon: <Bell /> },
    { label: "My profile", section: "profile", icon: <CircleUserRound /> },
  ],
  partner: [
    { label: "Overview", section: "dashboard", icon: <Gauge /> },
    { label: "Discover innovations", section: "discover", icon: <Search /> },
    {
      label: "Opportunities",
      section: "opportunities",
      icon: <BriefcaseBusiness />,
    },
    { label: "Notifications", section: "notifications", icon: <Bell /> },
    { label: "My profile", section: "profile", icon: <CircleUserRound /> },
  ],
};

export function WorkspacePage() {
  const { workspace = "innovator", section = "dashboard", id } = useParams();
  const { user, role, logout } = usePlatform();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  const expectedRole = workspaceRole[workspace];
  if (!expectedRole || expectedRole !== role)
    return (
      <Navigate
        to={
          !role
            ? "/discover"
            : `/${roleWorkspace[role]}/dashboard`
        }
        replace
      />
    );

  if (
    user.accountStatus !== "ACTIVE" &&
    !["profile", "notifications"].includes(section)
  )
    return <Navigate to={`/${workspace}/profile`} replace />;
  const allItems =
    navigation[workspace as "admin" | "innovator" | "expert" | "partner"];
  const items =
    user.accountStatus === "ACTIVE"
      ? allItems
      : allItems.filter((item) =>
          ["profile", "notifications"].includes(item.section),
        );
  return (
    <Shell>
      <SkipLink href="#workspace-content">Skip to main content</SkipLink>
      <Sidebar $open={open}>
        <SidebarHead>
          <Brand />
          <button aria-label="Close navigation" onClick={() => setOpen(false)}>
            <X />
          </button>
        </SidebarHead>
        <Identity>
          <Avatar>{initials(user.name)}</Avatar>
          <span>
            <strong>{user.name}</strong>
            <small>{friendlyRole(role)}</small>
            <small>{user.email}</small>
          </span>
        </Identity>
        <Nav>
          {items.map((item) => (
            <Link
              key={item.section}
              to={`/${workspace}/${item.section}`}
              className={
                location.pathname.includes(`/${workspace}/${item.section}`)
                  ? "active"
                  : ""
              }
              onClick={() => setOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
              <ChevronRight />
            </Link>
          ))}
        </Nav>
        <SidebarFoot>
          <button
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            <LogOut />
            Sign out
          </button>
          <Link to="/">
            <Leaf />
            Public website
          </Link>
        </SidebarFoot>
      </Sidebar>
      <Workspace>
        <Topbar>
          <button aria-label="Open navigation" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <div>
            <span>{friendlyRole(role)}</span>
            <small>{user.email}</small>
          </div>
          <Link to={`/${workspace}/notifications`} aria-label="Notifications">
            <Bell />
          </Link>
        </Topbar>
        <Content id="workspace-content">
          {user.accountStatus !== "ACTIVE" &&
          user.approvalStatus === "PENDING_APPROVAL" &&
          section === "profile" ? (
            <PendingApprovalPage />
          ) : role === "INNOVATOR" ? (
            <InnovatorSection section={section} id={id} />
          ) : role === "SYSTEM_ADMINISTRATOR" ? (
            <AdminSection section={section} id={id} />
          ) : role === "EXPERT" ? (
            <ExpertSection section={section} id={id} />
          ) : (
            <PartnerSection section={section} id={id} />
          )}
        </Content>
      </Workspace>
      <Scrim $open={open} onClick={() => setOpen(false)} />
    </Shell>
  );
}

function PendingApprovalPage() {
  const { user } = usePlatform();
  const role = user?.role ?? "INNOVATOR";
  return (
    <>
      <PageHeader
        eyebrow={`${friendlyRole(role)} account`}
        title="Your profile is under review"
        description="Your information has been submitted to the System Administrator. You can use the workspace after approval."
      />
      <ProfileNotice>
        <ShieldCheck />
        <span>
          <strong>Waiting for administrator approval</strong>You do not need to
          submit again. Check notifications for the decision.
        </span>
      </ProfileNotice>
      <Panel>
        <PanelBody>
          <StatusBadge status="PENDING_APPROVAL" />
          <h2>What happens next</h2>
          <p>
            The System Administrator reviews your identity, contact, location,
            occupation, and role information. If approved, your role dashboard
            unlocks automatically the next time this page refreshes.
          </p>
          <Actions>
            <ButtonLink to="/discover" $variant="secondary">
              Browse public innovations
            </ButtonLink>
            <ButtonLink
              to={`/${roleWorkspace[role]}/notifications`}
            >
              View notifications
            </ButtonLink>
          </Actions>
        </PanelBody>
      </Panel>
    </>
  );
}


function InnovatorSection({ section, id }: { section: string; id?: string }) {
  if (section === "dashboard") return <InnovatorDashboard />;
  if (section === "innovations" && id === "new") return <InnovationEditor />;
  if (section === "innovations" && id) return <InnovationEditor id={id} />;
  if (section === "innovations") return <InnovationList />;
  if (section === "progress")
    return <Navigate to="/innovator/innovations" replace />;
  if (section === "revisions") return <RevisionPage selectedId={id} />;
  if (section === "collaborations") return <InnovatorCollaborationsPage />;
  if (section === "notifications") return <NotificationsPage />;
  if (section === "profile") return <ProfilePage />;
  return <NotFoundSection />;
}

function ExpertSection({ section, id }: { section: string; id?: string }) {
  if (section === "dashboard") return <ExpertDashboard />;
  if (section === "assignments")
    return <ExpertAssignmentsPage selectedId={id} />;
  if (section === "history") return <ExpertHistoryPage />;
  if (section === "notifications") return <NotificationsPage />;
  if (section === "profile") return <ProfilePage />;
  return <NotFoundSection />;
}

function PartnerSection({ section, id }: { section: string; id?: string }) {
  if (section === "dashboard") return <PartnerDashboard />;
  if (section === "discover") return <PartnerDiscoverPage selectedId={id} />;
  if (section === "opportunities") return <PartnerOpportunitiesPage />;
  if (section === "notifications") return <NotificationsPage />;
  if (section === "profile") return <ProfilePage />;
  return <NotFoundSection />;
}

function AdminSection({ section, id }: { section: string; id?: string }) {
  if (section === "dashboard") return <AdminDashboardPage />;
  if (section === "users") return <UsersPage selectedId={id} />;
  if (section === "verifications") return <VerificationsPage selectedId={id} />;
  if (section === "innovations")
    return <AdminInnovationsPage selectedId={id} />;
  if (section === "taxonomies") return <TaxonomiesPage />;
  if (section === "criteria") return <CriteriaPage />;
  if (section === "reports") return <ReportsPage />;
  if (section === "settings") return <SettingsPage />;
  if (section === "notifications") return <NotificationsPage />;
  return <NotFoundSection />;
}

function ManagementPageHeader({
  icon,
  eyebrow,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <ManagementHeader>
      <ManagementIcon aria-hidden="true">{icon}</ManagementIcon>
      <ManagementHeading>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1>{title}</h1>
        <p>{description}</p>
      </ManagementHeading>
      {action && <ManagementActions>{action}</ManagementActions>}
    </ManagementHeader>
  );
}

function InnovatorDashboard() {
  const { data, user } = usePlatform();
  const records = data?.innovations ?? [];
  const revisions = data?.revisions ?? [];
  const notifications = data?.notifications ?? [];
  const engagements = data?.engagements ?? [];
  const pendingCollaborations = engagements.filter((item) =>
    ["PENDING", "CLARIFICATION_REQUESTED"].includes(item.status),
  );
  const localDraft = readLocalInnovationDraft(user?.id);
  return (
    <>
      <PageHeader
        eyebrow="Innovator workspace"
        title="Turn your idea into a clear innovation record"
        description="Create a draft, add supporting documents, record progress, submit for review, and follow every status change."
        action={
          <ButtonLink to="/innovator/innovations/new">
            <Plus />
            New innovation
          </ButtonLink>
        }
      />
      {localDraft && (
        <DraftRecovery>
          <span>
            <strong>Unfinished innovation found</strong>
            <small>
              {localDraft.title || "Untitled local draft"} was saved in this
              browser.
            </small>
          </span>
          <ButtonLink to="/innovator/innovations/new">Resume draft</ButtonLink>
        </DraftRecovery>
      )}
      <StatGrid>
        <StatCard
          label="My innovations"
          value={records.length}
          detail="Owned by your account"
          icon={<FolderKanban />}
        />
        <StatCard
          label="Drafts"
          value={records.filter((item) => item.status === "DRAFT").length}
          detail="Continue editing"
          icon={<FileText />}
        />
        <StatCard
          label="Open feedback"
          value={revisions.filter((item) => item.status === "OPEN").length}
          detail="Expert comments"
          icon={<ClipboardCheck />}
        />
        <StatCard
          label="Collaboration requests"
          value={pendingCollaborations.length}
          detail="Pending partner requests"
          icon={<Handshake />}
        />
        <StatCard
          label="Unread updates"
          value={notifications.filter((item) => !item.read).length}
          detail="Account notifications"
          icon={<Bell />}
        />
      </StatGrid>
      <Panel>
        <PanelHeader>
          <div>
            <h2>Recent innovations</h2>
            <p>Continue from the last saved database record.</p>
          </div>
        </PanelHeader>
        {records.length ? (
          <RecordList>
            {records.slice(0, 6).map((item) => (
              <Link key={item.id} to={`/innovator/innovations/${item.id}`}>
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.sector || "Sector not selected"} · {item.completion}%
                    complete
                  </small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight />
              </Link>
            ))}
          </RecordList>
        ) : (
          <EmptyState
            title="Create your first innovation"
            copy="Complete the required information to save your first database draft. Unfinished entries remain preserved in this browser."
            action={
              <ButtonLink to="/innovator/innovations/new">
                Create innovation
              </ButtonLink>
            }
          />
        )}
      </Panel>
      {pendingCollaborations.length > 0 && (
        <Panel>
          <PanelHeader>
            <div>
              <h2>Pending collaboration requests</h2>
              <p>Partner requests awaiting your response.</p>
            </div>
            <ButtonLink to="/innovator/collaborations" $variant="secondary">
              View all
            </ButtonLink>
          </PanelHeader>
          <RecordList>
            {pendingCollaborations.slice(0, 5).map((item) => (
              <Link key={item.id} to="/innovator/collaborations">
                <span>
                  <strong>{item.innovation}</strong>
                  <small>
                    {item.partner} · {item.type.replaceAll("_", " ")}
                  </small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight />
              </Link>
            ))}
          </RecordList>
        </Panel>
      )}
    </>
  );
}


function ExpertDashboard() {
  const { data } = usePlatform();
  const assignments = data?.assignments ?? [];
  const open = assignments.filter(
    (item) => !["COMPLETED", "CANCELLED"].includes(item.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="Expert workspace"
        title="Review local innovations with transparent criteria"
        description="Open assigned submissions, assess every active criterion, provide actionable comments, and submit your recommendation."
      />
      <StatGrid>
        <StatCard
          label="Assigned reviews"
          value={assignments.length}
          detail="All assignments"
          icon={<ClipboardCheck />}
        />
        <StatCard
          label="In progress"
          value={open.length}
          detail="Awaiting your action"
          icon={<Activity />}
        />
        <StatCard
          label="Completed"
          value={
            assignments.filter((item) => item.status === "COMPLETED").length
          }
          detail="Submitted recommendations"
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Unread updates"
          value={
            (data?.notifications ?? []).filter((item) => !item.read).length
          }
          detail="Review notifications"
          icon={<Bell />}
        />
      </StatGrid>
      <Panel>
        <PanelHeader>
          <div>
            <h2>Current review queue</h2>
            <p>Assignments are ordered by the most recent activity.</p>
          </div>
        </PanelHeader>
        {open.length ? (
          <RecordList>
            {open.map((item) => (
              <Link key={item.id} to={`/expert/assignments/${item.id}`}>
                <span>
                  <strong>{item.innovation}</strong>
                  <small>
                    {item.sector || "Sector not provided"} · Version{" "}
                    {item.version}
                  </small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight />
              </Link>
            ))}
          </RecordList>
        ) : (
          <EmptyState
            title="No reviews awaiting action"
            copy="New assignments from the System Administrator will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function ExpertAssignmentsPage({ selectedId }: { selectedId?: string }) {
  const { data } = usePlatform();
  const assignments = data?.assignments ?? [];
  const selected = assignments.find((item) => item.id === selectedId);
  if (selectedId && !selected) return <LoadingPanel />;
  if (selected)
    return (
      <>
        <PageHeader
          eyebrow="Assigned review"
          title={selected.innovation}
          description={`Immutable submitted version ${selected.version}`}
          action={
            <ButtonLink to="/expert/assignments" $variant="secondary">
              <ArrowLeft />
              All assignments
            </ButtonLink>
          }
        />
        <Panel>
          <PanelBody>
            <StatusBadge status={selected.status} />
            <DetailGrid>
              {[
                ["Sector", selected.sector],
                ["Project coverage", selected.district],
                [
                  "Due",
                  selected.dueAt ? formatDate(selected.dueAt) : "No due date",
                ],
              ].map(([label, value]) => (
                <DetailItem key={label}>
                  <small>{label}</small>
                  <strong>{value || "Not provided"}</strong>
                </DetailItem>
              ))}
            </DetailGrid>
            <NarrativeGrid>
              {[
                ["Summary", selected.summary],
                ["Problem or need", selected.problem],
                ["Proposed solution", selected.solution],
                ["Beneficiaries", selected.beneficiaries],
                ["Expected impact", selected.impact],
                ["What is new", selected.novelty],
                ["Current evidence", selected.currentEvidence],
                ["Implementation plan", selected.implementationPlan],
                ["Scalability", selected.scalability],
                ["Sustainability", selected.sustainability],
                ["Support needed", selected.supportNeeded],
              ].map(([label, value]) => (
                <section key={label}>
                  <h3>{label}</h3>
                  <p>{value || "Not provided"}</p>
                </section>
              ))}
            </NarrativeGrid>
            <SectionBlock>
              <h3>Supporting links</h3>
              {selected.supportingLinks?.length ? (
                <FileList>
                  {selected.supportingLinks.map((link) => (
                    <div key={link.url}>
                      <Link2 />
                      <span>
                        <strong>{link.title}</strong>
                        <small>{link.url}</small>
                      </span>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No supporting links were attached.</p>
              )}
            </SectionBlock>
            <SectionBlock>
              <h3>Review documents</h3>
              {selected.evidence?.length ? (
                <FileList>
                  {selected.evidence.map((file) => (
                    <div key={file.id}>
                      <FileText />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.mimeType}</small>
                      </span>
                      <a
                        href={`/api/v1/innovations/${selected.innovationId}/evidence/${file.id}/download`}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No review-team documents were attached.</p>
              )}
            </SectionBlock>
          </PanelBody>
        </Panel>
        {["ASSIGNED", "IN_PROGRESS"].includes(selected.status) && (
          <ExpertReviewEditor assignment={selected} />
        )}
        {["COMPLETED", "REVISION_REQUESTED"].includes(selected.status) &&
          selected.review && <SubmittedReviewPanel assignment={selected} />}
        {selected.reviewHistory.length > 0 && (
          <ExpertReviewHistory assignment={selected} />
        )}
      </>
    );
  return (
    <>
      <PageHeader
        eyebrow="Expert evaluation"
        title="Assigned innovation reviews"
        description="Only submissions assigned to your account are visible here."
      />
      <Panel>
        {assignments.length ? (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <th>Innovation</th>
                  <th>Version</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.innovation}</strong>
                      <br />
                      <small>{item.sector || "No sector"}</small>
                    </td>
                    <td>{item.version}</td>
                    <td>{item.dueAt ? formatDate(item.dueAt) : "Not set"}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      <ButtonLink
                        to={`/expert/assignments/${item.id}`}
                        $variant="secondary"
                      >
                        Open review
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        ) : (
          <EmptyState
            title="No assignments"
            copy="The System Administrator has not assigned an innovation to you yet."
          />
        )}
      </Panel>
    </>
  );
}

function ExpertReviewEditor({ assignment }: { assignment: Assignment }) {
  const { request, refreshWorkspace, notify } = usePlatform();
  const [scores, setScores] = useState<
    Record<string, { score: number; comment: string }>
  >(() =>
    Object.fromEntries(
      (assignment.criteria ?? []).map((criterion) => {
        const saved = assignment.review?.scores.find(
          (item) => item.criterionKey === criterion.key,
        );
        return [
          criterion.key,
          { score: saved?.score ?? 0, comment: saved?.comment ?? "" },
        ];
      }),
    ),
  );
  const [rationale, setRationale] = useState(
    assignment.review?.rationale ?? "",
  );
  const [recommendation, setRecommendation] = useState(
    assignment.review?.recommendation ?? "",
  );
  const [revision, setRevision] = useState({
    fieldKey: "solution",
    instruction: "",
    dueAt: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const payload = () => ({
    scores: (assignment.criteria ?? []).map((criterion) => ({
      criterionKey: criterion.key,
      score: scores[criterion.key]?.score ?? 0,
      comment: scores[criterion.key]?.comment || undefined,
    })),
    rationale,
    recommendation: recommendation || undefined,
    revisionRequests:
      recommendation === "REVISION_REQUIRED" && revision.instruction.trim()
        ? [revision]
        : [],
  });
  const save = async (submit = false) => {
    setBusy(true);
    setError("");
    try {
      await request(`/api/v1/reviews/assignments/${assignment.id}`, {
        method: "PUT",
        body: JSON.stringify(payload()),
      });
      if (submit)
        await request(`/api/v1/reviews/assignments/${assignment.id}/submit`, {
          method: "POST",
          body: "{}",
        });
      await refreshWorkspace();
      notify(
        submit
          ? recommendation === "APPROVE"
            ? "Recommendation submitted. The innovation is now public."
            : "Revision request submitted to the Innovator."
          : "Evaluation draft saved.",
      );
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel>
      <PanelHeader>
        <div>
          <h2>Evaluation criteria</h2>
          <p>
            Score every criterion from 0 to 5 and explain the evidence behind
            the score.
          </p>
        </div>
      </PanelHeader>
      <PanelBody>
        {error && <ErrorBox role="alert">{error}</ErrorBox>}
        <CriteriaList>
          {(assignment.criteria ?? []).map((criterion) => (
            <section key={criterion.key}>
              <div>
                <strong>{criterion.name}</strong>
                <small>
                  {criterion.weight}% ·{" "}
                  {criterion.guidance ||
                    "Use the submitted information and evidence."}
                </small>
              </div>
              <Field label={`Score for ${criterion.name}`}>
                <Select
                  aria-label={`Score for ${criterion.name}`}
                  value={scores[criterion.key]?.score ?? 0}
                  onChange={(event) =>
                    setScores({
                      ...scores,
                      [criterion.key]: {
                        ...scores[criterion.key],
                        score: Number(event.target.value),
                      },
                    })
                  }
                >
                  {[0, 1, 2, 3, 4, 5].map((value) => (
                    <option key={value} value={value}>
                      {value} / 5
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Criterion comment">
                <Textarea
                  value={scores[criterion.key]?.comment ?? ""}
                  onChange={(event) =>
                    setScores({
                      ...scores,
                      [criterion.key]: {
                        ...scores[criterion.key],
                        comment: event.target.value,
                      },
                    })
                  }
                />
              </Field>
            </section>
          ))}
        </CriteriaList>
        <FormGrid>
          <Field label="Recommendation">
            <Select
              value={recommendation}
              onChange={(event) => setRecommendation(event.target.value)}
            >
              <option value="">Select recommendation</option>
              <option value="APPROVE">Recommend approval</option>
              <option value="REVISION_REQUIRED">Request revisions</option>
            </Select>
          </Field>
          <Field label="Overall rationale">
            <Textarea
              value={rationale}
              onChange={(event) => setRationale(event.target.value)}
              placeholder="Summarize the evidence and reasoning behind your recommendation."
            />
          </Field>
        </FormGrid>
        {recommendation === "REVISION_REQUIRED" && (
          <FormGrid>
            <Field label="Field requiring revision">
              <Select
                value={revision.fieldKey}
                onChange={(event) =>
                  setRevision({ ...revision, fieldKey: event.target.value })
                }
              >
                {[
                  "summary",
                  "problem",
                  "solution",
                  "beneficiaries",
                  "impact",
                  "novelty",
                  "currentEvidence",
                  "implementationPlan",
                  "scalability",
                  "sustainability",
                  "supportNeeded",
                ].map((field) => (
                  <option key={field} value={field}>
                    {field.replaceAll("_", " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Revision due date (optional)">
              <Input
                type="date"
                value={revision.dueAt}
                onChange={(event) =>
                  setRevision({ ...revision, dueAt: event.target.value })
                }
              />
            </Field>
            <Field label="Clear revision instruction">
              <Textarea
                value={revision.instruction}
                onChange={(event) =>
                  setRevision({ ...revision, instruction: event.target.value })
                }
              />
            </Field>
          </FormGrid>
        )}
        <AttachmentNotice>
          <CircleAlert />
          <span>
            <strong>Your recommendation completes this review round.</strong>
            Recommend approval publishes this version automatically. Request
            revisions returns it to the Innovator and then back to you.
          </span>
        </AttachmentNotice>
        <Actions>
          <Button
            $variant="secondary"
            disabled={busy}
            onClick={() => save(false)}
          >
            <Save />
            Save draft
          </Button>
          <Button
            disabled={busy || !recommendation || !rationale.trim()}
            onClick={() => save(true)}
          >
            <Send />
            Submit recommendation
          </Button>
        </Actions>
      </PanelBody>
    </Panel>
  );
}

function SubmittedReviewPanel({ assignment }: { assignment: Assignment }) {
  const review = assignment.review!;
  return (
    <Panel>
      <PanelHeader>
        <div>
          <h2>Submitted recommendation</h2>
          <p>This evaluation is read-only.</p>
        </div>
        <StatusBadge status={review.recommendation} />
      </PanelHeader>
      <PanelBody>
        <DetailGrid>
          <DetailItem>
            <small>Weighted score</small>
            <strong>{review.totalScore?.toFixed(1) ?? "Not available"}%</strong>
          </DetailItem>
          <DetailItem>
            <small>Submitted</small>
            <strong>
              {review.submittedAt
                ? formatDate(review.submittedAt)
                : "Not submitted"}
            </strong>
          </DetailItem>
        </DetailGrid>
        <SectionBlock>
          <h3>Rationale</h3>
          <p>{review.rationale}</p>
        </SectionBlock>
        {review.scores.length > 0 && (
          <CriteriaList>
            {review.scores.map((score) => (
              <section key={score.criterionKey}>
                <div>
                  <strong>{score.criterionName || score.criterionKey}</strong>
                  <small>
                    {score.score} / 5
                    {score.weight ? ` · ${score.weight}% weight` : ""}
                  </small>
                </div>
                <p>{score.comment || "No criterion comment."}</p>
              </section>
            ))}
          </CriteriaList>
        )}
        {review.revisionRequests.length > 0 && (
          <SectionBlock>
            <h3>Revision instructions</h3>
            <RecordList>
              {review.revisionRequests.map((revision, index) => (
                <div key={revision.id || `${revision.fieldKey}-${index}`}>
                  <span>
                    <strong>{revision.fieldKey.replaceAll("_", " ")}</strong>
                    <small>{revision.instruction}</small>
                  </span>
                  <StatusBadge status={revision.status} />
                </div>
              ))}
            </RecordList>
          </SectionBlock>
        )}
      </PanelBody>
    </Panel>
  );
}

function ExpertReviewHistory({ assignment }: { assignment: Assignment }) {
  return (
    <Panel>
      <PanelHeader>
        <div>
          <h2>Review round history</h2>
          <p>Submitted scores and recommendations remain read-only.</p>
        </div>
      </PanelHeader>
      <PanelBody>
        <CardGrid>
          {assignment.reviewHistory.map((review) => (
            <SectionBlock key={review.id}>
              <StatusBadge status={review.recommendation} />
              <h3>Version {review.version}</h3>
              <p>{review.rationale}</p>
              <Meta>
                <span>{review.totalScore?.toFixed(1) ?? "—"}%</span>
                <span>
                  {review.submittedAt
                    ? formatDate(review.submittedAt)
                    : "Not submitted"}
                </span>
              </Meta>
            </SectionBlock>
          ))}
        </CardGrid>
      </PanelBody>
    </Panel>
  );
}

function ExpertHistoryPage() {
  const { data } = usePlatform();
  const completed = (data?.assignments ?? []).filter(
    (item) => item.reviewHistory.length > 0,
  );
  return (
    <>
      <PageHeader
        eyebrow="Expert history"
        title="Submitted evaluations"
        description="Review the recommendations you have already sent."
      />
      <Panel>
        {completed.length ? (
          <RecordList>
            {completed.map((item) => (
              <Link key={item.id} to={`/expert/assignments/${item.id}`}>
                <span>
                  <strong>{item.innovation}</strong>
                  <small>
                    {item.reviewHistory.length} submitted review
                    {item.reviewHistory.length === 1 ? "" : "s"}
                  </small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight />
              </Link>
            ))}
          </RecordList>
        ) : (
          <EmptyState
            title="No submitted evaluations"
            copy="Completed reviews will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function PartnerDashboard() {
  const { data } = usePlatform();
  const engagements = data?.engagements ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Investor / Industry Partner workspace"
        title="Find promising local innovations and engage responsibly"
        description="Search approved public work, send a structured non-binding request, and track every opportunity."
        action={
          <ButtonLink to="/partner/discover">
            <Search />
            Discover innovations
          </ButtonLink>
        }
      />
      <StatGrid>
        <StatCard
          label="Published innovations"
          value={(data?.innovations ?? []).length}
          detail="Available to explore"
          icon={<FolderKanban />}
        />
        <StatCard
          label="Open opportunities"
          value={
            engagements.filter((item) =>
              ["PENDING", "CLARIFICATION_REQUESTED"].includes(item.status),
            ).length
          }
          detail="Awaiting action"
          icon={<BriefcaseBusiness />}
        />
        <StatCard
          label="Accepted"
          value={
            engagements.filter((item) => item.status === "ACCEPTED").length
          }
          detail="Consent-controlled contacts"
          icon={<Handshake />}
        />
        <StatCard
          label="Unread updates"
          value={
            (data?.notifications ?? []).filter((item) => !item.read).length
          }
          detail="Opportunity notifications"
          icon={<Bell />}
        />
      </StatGrid>
      <Panel>
        <PanelHeader>
          <div>
            <h2>Recent opportunities</h2>
            <p>Funding, partnership, and contact requests.</p>
          </div>
        </PanelHeader>
        {engagements.length ? (
          <RecordList>
            {engagements.slice(0, 6).map((item) => (
              <Link key={item.id} to="/partner/opportunities">
                <span>
                  <strong>{item.innovation}</strong>
                  <small>{item.type.replaceAll("_", " ")}</small>
                </span>
                <StatusBadge status={item.status} />
                <ChevronRight />
              </Link>
            ))}
          </RecordList>
        ) : (
          <EmptyState
            title="No opportunities yet"
            copy="Browse published innovations and send a structured request when you find a suitable project."
            action={
              <ButtonLink to="/partner/discover">Browse innovations</ButtonLink>
            }
          />
        )}
      </Panel>
    </>
  );
}

function PartnerDiscoverPage({ selectedId }: { selectedId?: string }) {
  const { data } = usePlatform();
  const [query, setQuery] = useState("");
  const [requestItem, setRequestItem] = useState<Innovation | null>(null);
  const requestedInnovationIds = new Set(
    (data?.engagements ?? []).map((engagement) => engagement.innovationId),
  );
  const items = (data?.innovations ?? []).filter(
    (item) =>
      !query ||
      `${item.title} ${item.summary} ${item.sector} ${item.district}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = (data?.innovations ?? []).find(
    (item) => item.id === selectedId,
  );
  if (selected)
    return (
      <>
        <PageHeader
          eyebrow="Published innovation"
          title={selected.title}
          description={selected.summary}
          action={
            <Actions>
              <ButtonLink to="/partner/discover" $variant="secondary">
                <ArrowLeft />
                All innovations
              </ButtonLink>
              {requestedInnovationIds.has(selected.id) ? (
                <ButtonLink to="/partner/opportunities">
                  View existing request
                </ButtonLink>
              ) : (
                <Button onClick={() => setRequestItem(selected)}>
                  <Handshake />
                  Start request
                </Button>
              )}
            </Actions>
          }
        />
        <Panel>
          <PanelBody>
            <StatusBadge status={selected.status} />
            <DetailGrid>
              {[
                ["Innovator", selected.owner],
                ["Organization", selected.organization],
                ["Sector", selected.sector],
                ["Project coverage", selected.district],
                ["Maturity", selected.maturity],
              ].map(([label, value]) => (
                <DetailItem key={label}>
                  <small>{label}</small>
                  <strong>{value || "Not provided"}</strong>
                </DetailItem>
              ))}
            </DetailGrid>
            <NarrativeGrid>
              {[
                ["Problem", selected.problem],
                ["Solution", selected.solution],
                ["Expected impact", selected.impact],
                ["Support needed", selected.supportNeeded],
              ].map(([label, value]) => (
                <section key={label}>
                  <h3>{label}</h3>
                  <p>{value || "Not provided"}</p>
                </section>
              ))}
            </NarrativeGrid>
            <SectionBlock>
              <h3>Supporting links</h3>
              {selected.supportingLinks.length ? (
                <FileList>
                  {selected.supportingLinks.map((link) => (
                    <div key={link.url}>
                      <Link2 />
                      <span>
                        <strong>{link.title}</strong>
                        <small>{link.url}</small>
                      </span>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No supporting links were published.</p>
              )}
            </SectionBlock>
            <SectionBlock>
              <h3>Public documents</h3>
              {selected.evidence.length ? (
                <FileList>
                  {selected.evidence.map((file) => (
                    <div key={file.id}>
                      <FileText />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.mimeType}</small>
                      </span>
                      <a
                        href={`/api/v1/public/innovations/${selected.slug}/evidence/${file.id}/download`}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No public documents were attached.</p>
              )}
            </SectionBlock>
          </PanelBody>
        </Panel>
        {requestItem && (
          <EngagementRequestDialog
            item={requestItem}
            onClose={() => setRequestItem(null)}
          />
        )}
      </>
    );
  return (
    <>
      <PageHeader
        eyebrow="Innovation discovery"
        title="Search published innovations"
        description="Filter the approved public catalogue before starting a collaboration request."
      />
      <PartnerSearch>
        <Search size={19} />
        <Input
          aria-label="Search published innovations"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, sector, coverage, or need"
        />
      </PartnerSearch>
      {items.length ? (
        <CardGrid>
          {items.map((item) => (
            <Panel key={item.id}>
              <PanelBody>
                <StatusBadge status={item.status} />
                <h2>{item.title}</h2>
                <p>{item.summary}</p>
                <Meta>
                  <span>{item.sector}</span>
                  <span>{item.district}</span>
                </Meta>
                <Actions>
                  <ButtonLink
                    to={`/partner/discover/${item.id}`}
                    $variant="secondary"
                  >
                    View details
                  </ButtonLink>
                  {requestedInnovationIds.has(item.id) ? (
                    <ButtonLink to="/partner/opportunities">
                      View request
                    </ButtonLink>
                  ) : (
                    <Button onClick={() => setRequestItem(item)}>
                      Start request
                    </Button>
                  )}
                </Actions>
              </PanelBody>
            </Panel>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="No published innovations match"
          copy="Try a broader search term."
        />
      )}
      {requestItem && (
        <EngagementRequestDialog
          item={requestItem}
          onClose={() => setRequestItem(null)}
        />
      )}
    </>
  );
}

function EngagementRequestDialog({
  item,
  onClose,
}: {
  item: Innovation;
  onClose: () => void;
}) {
  const { request, refreshWorkspace, notify } = usePlatform();
  const [type, setType] = useState("CONTACT");
  const [summary, setSummary] = useState("");
  const [terms, setTerms] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/api/v1/engagements", {
        method: "POST",
        body: JSON.stringify({
          innovationId: item.id,
          type,
          summary,
          termsSummary: terms || undefined,
          nonBindingAccepted: accepted,
        }),
      });
      await refreshWorkspace();
      notify("Collaboration request sent to the Innovator.");
      onClose();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalBackdrop role="presentation">
      <Modal role="dialog" aria-modal="true" aria-labelledby="engagement-title">
        <PanelHeader>
          <div>
            <h2 id="engagement-title">Start a request</h2>
            <p>{item.title}</p>
          </div>
          <button aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </PanelHeader>
        <PanelBody>
          {error && <ErrorBox>{error}</ErrorBox>}
          <Field label="Request type">
            <Select
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <option value="CONTACT">Contact Innovator</option>
              <option value="FUNDING_OFFER">Funding offer</option>
              <option value="PARTNERSHIP_REQUEST">Partnership request</option>
            </Select>
          </Field>
          <Field label="Purpose and proposed next step">
            <Textarea
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </Field>
          <Field label="Outline of terms (optional)">
            <Textarea
              value={terms}
              onChange={(event) => setTerms(event.target.value)}
            />
          </Field>
          <CheckLabel>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
            />
            <span>
              <strong>I understand this request is non-binding.</strong>No
              payment, contract, or transfer of funds occurs through LIDKEP.
            </span>
          </CheckLabel>
          <Actions>
            <Button $variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={busy || !accepted || summary.trim().length < 10}
              onClick={submit}
            >
              <Send />
              Send request
            </Button>
          </Actions>
        </PanelBody>
      </Modal>
    </ModalBackdrop>
  );
}

function PartnerOpportunitiesPage() {
  const { data, request, refreshWorkspace, notify } = usePlatform();
  const [error, setError] = useState("");
  const withdraw = async (item: Engagement) => {
    try {
      await request(`/api/v1/engagements/${item.id}/withdraw`, {
        method: "POST",
        body: "{}",
      });
      await refreshWorkspace();
      notify("Opportunity withdrawn.");
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const items = data?.engagements ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Opportunity tracking"
        title="My collaboration requests"
        description="Track the response and view contact details only when the Innovator has explicitly shared them."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {items.length ? (
        <CardGrid>
          {items.map((item) => (
            <Panel key={item.id}>
              <PanelBody>
                <StatusBadge status={item.status} />
                <h2>{item.innovation}</h2>
                <p>{item.summary}</p>
                <Meta>
                  <span>{item.type.replaceAll("_", " ")}</span>
                  <span>{formatDate(item.createdAt)}</span>
                </Meta>
                {item.status === "ACCEPTED" && (
                  <SectionBlock>
                    <h3>Shared contact details</h3>
                    <p>
                      {item.contact.email || item.contact.phone
                        ? [
                            item.contact.email,
                            item.contact.phone,
                            item.contact.organization,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "The Innovator accepted without sharing private contact information."}
                    </p>
                  </SectionBlock>
                )}
                {["PENDING", "CLARIFICATION_REQUESTED"].includes(
                  item.status,
                ) && (
                  <Actions>
                    <Button $variant="secondary" onClick={() => withdraw(item)}>
                      Withdraw request
                    </Button>
                  </Actions>
                )}
              </PanelBody>
            </Panel>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="No collaboration requests"
          copy="Requests sent from published innovations appear here."
          action={
            <ButtonLink to="/partner/discover">Discover innovations</ButtonLink>
          }
        />
      )}
    </>
  );
}

function InnovatorCollaborationsPage() {
  const { data, request, refreshWorkspace, notify } = usePlatform();
  const [error, setError] = useState("");
  const respond = async (item: Engagement, status: string) => {
    try {
      await request(`/api/v1/engagements/${item.id}/respond`, {
        method: "POST",
        body: JSON.stringify({
          status,
        }),
      });
      await refreshWorkspace();
      notify("Collaboration request updated.");
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const items = data?.engagements ?? [];
  return (
    <>
      <PageHeader
        eyebrow="Partner engagement"
        title="Collaboration requests"
        description="Review non-binding contact, funding, and partnership requests. Your email and phone are shared only when you accept."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {items.length ? (
        <CardGrid>
          {items.map((item) => (
            <Panel key={item.id}>
              <PanelBody>
                <StatusBadge status={item.status} />
                <h2>{item.innovation}</h2>
                <Meta>
                  <span>{item.partner}</span>
                  <span>{item.type.replaceAll("_", " ")}</span>
                </Meta>
                <p>{item.summary}</p>
                {item.termsSummary && (
                  <SectionBlock>
                    <h3>Proposed terms</h3>
                    <p>{item.termsSummary}</p>
                  </SectionBlock>
                )}
                {["PENDING", "CLARIFICATION_REQUESTED"].includes(
                  item.status,
                ) && (
                  <Actions>
                    <Button onClick={() => respond(item, "ACCEPTED")}>
                      <CheckCircle2 />
                      Accept
                      </Button>

                    <Button
                      $variant="danger"
                      onClick={() => respond(item, "DECLINED")}
                    >
                      Decline
                    </Button>
                  </Actions>
                )}
              </PanelBody>
            </Panel>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="No Partner requests"
          copy="Requests concerning your published innovations will appear here."
        />
      )}
    </>
  );
}

function InnovationList() {
  const { data, user } = usePlatform();
  const records = data?.innovations ?? [];
  const localDraft = readLocalInnovationDraft(user?.id);
  return (
    <>
      <PageHeader
        eyebrow="Innovation records"
        title="My innovations"
        description="Saved drafts stay here so you can close the page and resume later."
        action={
          <ButtonLink to="/innovator/innovations/new">
            <Plus />
            New innovation
          </ButtonLink>
        }
      />
      {localDraft && (
        <DraftRecovery>
          <span>
            <strong>Unfinished local draft</strong>
            <small>
              {localDraft.title || "Untitled innovation"} has not been saved to
              the database yet.
            </small>
          </span>
          <ButtonLink to="/innovator/innovations/new">Resume draft</ButtonLink>
        </DraftRecovery>
      )}
      {records.length ? (
        <CardGrid>
          {records.map((item) => (
            <InnovationCard key={item.id} item={item} />
          ))}
        </CardGrid>
      ) : (
        !localDraft && (
          <EmptyState
            title="No innovations yet"
            copy="Create a draft to start documenting your work."
            action={
              <ButtonLink to="/innovator/innovations/new">
                Create innovation
              </ButtonLink>
            }
          />
        )
      )}
    </>
  );
}

function InnovationCard({ item }: { item: Innovation }) {
  const editable = ["DRAFT", "REVISION_REQUIRED"].includes(item.status);
  return (
    <Panel>
      <PanelBody>
        <StatusBadge status={item.status} />
        <h2>{item.title}</h2>
        <p>
          {item.summary || "Complete the summary to describe this innovation."}
        </p>
        <Meta>
          <span>{item.sector || "No sector"}</span>
          <span>{item.completion}% complete</span>
        </Meta>
        <ButtonLink
          to={`/innovator/innovations/${item.id}`}
          $variant="secondary"
        >
          {editable ? "Resume draft" : "View record"}
        </ButtonLink>
      </PanelBody>
    </Panel>
  );
}

const emptyInnovation = {
  title: "",
  summary: "",
  problem: "",
  solution: "",
  beneficiaries: "",
  sector: "",
  category: "",
  district: "",
  maturity: "",
  impactArea: "",
  impact: "",
  novelty: "",
  currentEvidence: "",
  implementationPlan: "",
  scalability: "",
  sustainability: "",
  supportNeeded: "",
  supportingLinks: [] as Array<{ title: string; url: string }>,
  ownershipDeclared: false,
  accuracyDeclared: false,
};
type InnovationForm = typeof emptyInnovation;
const requiredInnovationLabels: Partial<Record<keyof InnovationForm, string>> =
  {
    title: "Innovation title",
    summary: "Short summary",
    problem: "Problem or need",
    solution: "Proposed solution",
    beneficiaries: "Main beneficiaries",
    sector: "Innovation sector",
    category: "Innovation type",
    district: "Project coverage",
    maturity: "Maturity level",
    impactArea: "Primary impact area",
    impact: "Expected impact",
    novelty: "What is new or different",
    implementationPlan: "Implementation plan",
    scalability: "Potential to scale",
    sustainability: "Sustainability",
    supportNeeded: "Support requested",
    ownershipDeclared: "Ownership declaration",
    accuracyDeclared: "Accuracy declaration",
  };
const narrativeInnovationLabels: Partial<Record<keyof InnovationForm, string>> =
  {
    summary: "Short summary",
    problem: "Problem or need",
    solution: "Proposed solution",
    beneficiaries: "Main beneficiaries",
    impact: "Expected impact",
    novelty: "What is new or different",
    currentEvidence: "Evidence so far",
    implementationPlan: "Implementation plan",
    scalability: "Potential to scale",
    sustainability: "Sustainability",
    supportNeeded: "Support requested",
  };
const innovationMinimumWords = 30;
const innovationMaximumWords = 1000;
const wordLimitHint = (value: string) =>
  `${countWords(value)} words (minimum ${innovationMinimumWords}, maximum ${innovationMaximumWords.toLocaleString()})`;
const localDraftKey = (userId?: string) =>
  userId ? `lidkep:innovation-draft:${userId}` : "";
const hasInnovationContent = (form: InnovationForm) =>
  Object.entries(form).some(([key, value]) =>
    key === "supportingLinks"
      ? Array.isArray(value) && value.length
      : key === "ownershipDeclared" || key === "accuracyDeclared"
        ? Boolean(value)
        : String(value).trim(),
  );
function readLocalInnovationDraft(userId?: string): InnovationForm | null {
  const key = localDraftKey(userId);
  if (!key) return null;
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    return value && typeof value === "object" && hasInnovationContent(value)
      ? {
          ...emptyInnovation,
          ...value,
          supportingLinks: Array.isArray(value.supportingLinks)
            ? value.supportingLinks
            : [],
        }
      : null;
  } catch {
    return null;
  }
}
const errorsFrom = (cause: unknown): FieldErrors =>
  cause instanceof ApiRequestError
    ? Object.fromEntries(
        cause.fieldErrors.map((item) => [
          item.field.replace(/^body\./, ""),
          item.message,
        ]),
      )
    : {};
const focusFirstError = (errors: FieldErrors, prefix: string) => {
  const first = Object.keys(errors)[0];
  if (first)
    window.requestAnimationFrame(() =>
      document.getElementById(`${prefix}-${first}`)?.focus(),
    );
};
function validateInnovation(
  form: InnovationForm,
  complete = false,
): FieldErrors {
  const errors: FieldErrors = {};
  if (form.title.trim().length < 3)
    errors.title = "Enter an innovation title with at least 3 characters.";
  if (complete) {
    Object.entries(requiredInnovationLabels).forEach(([field, label]) => {
      const value = form[field as keyof InnovationForm];
      if (!value || (typeof value === "string" && !value.trim()))
        errors[field] =
          field === "ownershipDeclared"
            ? "Confirm that you own or are authorized to submit this innovation."
            : field === "accuracyDeclared"
              ? "Confirm that the information is accurate."
              : `${label} is required.`;
    });
  }
  Object.entries(narrativeInnovationLabels).forEach(([field, label]) => {
    const value = form[field as keyof InnovationForm];
    if (typeof value !== "string" || !value.trim()) return;
    const words = countWords(value);
    if (words < innovationMinimumWords)
      errors[field] = `${label} must contain at least ${innovationMinimumWords} words.`;
    else if (words > innovationMaximumWords)
      errors[field] = `${label} must contain ${innovationMaximumWords.toLocaleString()} words or fewer.`;
  });
  return errors;
}

function InnovationEditor({ id }: { id?: string }) {
  const { data, user, request, refreshWorkspace, notify } = usePlatform();
  const navigate = useNavigate();
  const record = data?.innovations.find((item) => item.id === id);
  const [form, setForm] = useState<InnovationForm>(() =>
    id
      ? { ...emptyInnovation, supportingLinks: [] }
      : (readLocalInnovationDraft(user?.id) ?? {
          ...emptyInnovation,
          supportingLinks: [],
        }),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [visibility, setVisibility] = useState("REVIEW_TEAM");
  const [attachmentError, setAttachmentError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkErrors, setLinkErrors] = useState<FieldErrors>({});
  useEffect(() => {
    if (record)
      setForm({
        title: record.title,
        summary: record.summary,
        problem: record.problem,
        solution: record.solution,
        beneficiaries: record.beneficiaries,
        sector: record.sector,
        category: record.category,
        district: record.district,
        maturity: record.maturity,
        impactArea: record.impactArea,
        impact: record.impact,
        novelty: record.novelty,
        currentEvidence: record.currentEvidence,
        implementationPlan: record.implementationPlan,
        scalability: record.scalability,
        sustainability: record.sustainability,
        supportNeeded: record.supportNeeded,
        supportingLinks: record.supportingLinks ?? [],
        ownershipDeclared: Boolean(record.ownershipDeclared),
        accuracyDeclared: Boolean(record.accuracyDeclared),
      });
  }, [record?.id]);
  useEffect(() => {
    if (id || !user?.id) return;
    const key = localDraftKey(user.id);
    if (hasInnovationContent(form))
      localStorage.setItem(key, JSON.stringify(form));
    else localStorage.removeItem(key);
  }, [form, id, user?.id]);
  const set = <K extends keyof InnovationForm>(
    key: K,
    value: InnovationForm[K],
  ) => {
    setForm((old) => ({ ...old, [key]: value }));
    setFieldErrors((old) => {
      const next = { ...old };
      delete next[key];
      return next;
    });
  };
  const persist = () =>
    request<Innovation>(
      id ? `/api/v1/innovations/${id}` : "/api/v1/innovations",
      { method: id ? "PATCH" : "POST", body: JSON.stringify(form) },
    );
  const showErrors = (cause: unknown) => {
    const details = errorsFrom(cause);
    setError(messageOf(cause));
    setFieldErrors(details);
    focusFirstError(details, "innovation");
  };
  const save = async () => {
    const details = validateInnovation(form, true);
    if (Object.keys(details).length) {
      setFieldErrors(details);
      setError("Correct the highlighted fields before saving.");
      focusFirstError(details, "innovation");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      const saved = await persist();
      if (user?.id) localStorage.removeItem(localDraftKey(user.id));
      await refreshWorkspace();
      notify(
        id
          ? "Innovation draft saved."
          : "Innovation draft created. You can now upload documents and images.",
      );
      if (!id)
        navigate(`/innovator/innovations/${saved.id}`, { replace: true });
    } catch (cause) {
      showErrors(cause);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    if (!id) return;
    const details = validateInnovation(form, true);
    if (Object.keys(details).length) {
      setFieldErrors(details);
      setError("Correct the highlighted fields before submitting.");
      focusFirstError(details, "innovation");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await persist();
      await request(`/api/v1/innovations/${id}/submit`, {
        method: "POST",
        body: "{}",
      });
      await refreshWorkspace();
      notify("Innovation submitted to the System Administrator.");
    } catch (cause) {
      showErrors(cause);
    } finally {
      setBusy(false);
    }
  };
  const upload = async () => {
    if (!id || !files.length) return;
    setBusy(true);
    setAttachmentError("");
    try {
      for (const selectedFile of files) {
        const body = new FormData();
        body.append("file", selectedFile);
        body.append("visibility", visibility);
        await request(`/api/v1/innovations/${id}/evidence`, {
          method: "POST",
          body,
        });
      }
      await refreshWorkspace();
      setFiles([]);
      setFileInputKey((value) => value + 1);
      notify(
        `${files.length} supporting file${files.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (cause) {
      setAttachmentError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };
  const addLink = () => {
    const details: FieldErrors = {};
    if (linkTitle.trim().length < 2)
      details.linkTitle = "Enter a short title describing this link.";
    if (!/^https?:\/\/\S+$/i.test(linkUrl.trim()))
      details.linkUrl =
        "Enter a complete link beginning with http:// or https://.";
    if (Object.keys(details).length) {
      setLinkErrors(details);
      focusFirstError(details, "support");
      return;
    }
    set("supportingLinks", [
      ...form.supportingLinks,
      { title: linkTitle.trim(), url: linkUrl.trim() },
    ]);
    setLinkTitle("");
    setLinkUrl("");
    setLinkErrors({});
  };
  const editable =
    !record || ["DRAFT", "REVISION_REQUIRED"].includes(record.status);
  return (
    <>
      <PageHeader
        eyebrow={id ? "Innovation record" : "New innovation"}
        title={id ? record?.title || "Innovation" : "Create an innovation"}
        description="Complete the required fields to save a database draft. Documents and images can be uploaded; videos must be added as links."
        action={
          <ButtonLink to="/innovator/innovations" $variant="secondary">
            <ArrowLeft />
            Back
          </ButtonLink>
        }
      />
      {record && (
        <StatusLine>
          <StatusBadge status={record.status} />
          <span>
            {record.completion}% complete · Version {record.version}
          </span>
        </StatusLine>
      )}
      {!id && hasInnovationContent(form) && (
        <LocalSaveNotice>
          <Save />
          <span>
            <strong>Local draft recovered and saving automatically</strong>Your
            unfinished entries remain available in this browser until you create
            the database draft.
          </span>
        </LocalSaveNotice>
      )}
      {error && (
        <ValidationSummary role="alert" aria-live="assertive">
          <CircleAlert />
          <div>
            <strong>{error}</strong>
            {Object.keys(fieldErrors).length > 0 && (
              <ul>
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>
                    <button
                      onClick={() =>
                        document.getElementById(`innovation-${field}`)?.focus()
                      }
                    >
                      {message}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ValidationSummary>
      )}
      <Panel>
        <PanelHeader>
          <div>
            <h2>Innovation information</h2>
            <p>
              Complete the grouped fields with clear, direct information a
              reviewer can understand.
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          <SectionTitle>Basic information</SectionTitle>
          <FormGrid>
            <Field label="Innovation title" error={fieldErrors.title}>
              <Input
                id="innovation-title"
                value={form.title}
                disabled={!editable}
                placeholder="Example: Solar-powered crop dryer"
                onChange={(e) => set("title", e.target.value)}
              />
            </Field>
            <Field label="Innovation sector" error={fieldErrors.sector}>
              <Select
                id="innovation-sector"
                value={form.sector}
                disabled={!editable}
                onChange={(e) => set("sector", e.target.value)}
              >
                <option value="">Select innovation sector</option>
                {data?.taxonomies.sectors.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Innovation type" error={fieldErrors.category}>
              <Select
                id="innovation-category"
                value={form.category}
                disabled={!editable}
                onChange={(e) => set("category", e.target.value)}
              >
                <option value="">Select innovation type</option>
                {data?.taxonomies.categories.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Project coverage" error={fieldErrors.district}>
              <Select
                id="innovation-district"
                value={form.district}
                disabled={!editable}
                onChange={(e) => set("district", e.target.value)}
              >
                <option value="">Select project coverage</option>
                {projectCoverageLevels.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Maturity level" error={fieldErrors.maturity}>
              <Select
                id="innovation-maturity"
                value={form.maturity}
                disabled={!editable}
                onChange={(e) => set("maturity", e.target.value)}
              >
                <option value="">Select current maturity</option>
                {data?.taxonomies.maturityLevels.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Primary impact area" error={fieldErrors.impactArea}>
              <Select
                id="innovation-impactArea"
                value={form.impactArea}
                disabled={!editable}
                onChange={(e) => set("impactArea", e.target.value)}
              >
                <option value="">Select impact area</option>
                {data?.taxonomies.impactAreas.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
          </FormGrid>
          <Field
            label="Short summary"
            hint={wordLimitHint(form.summary)}
            error={fieldErrors.summary}
          >
            <Textarea
              id="innovation-summary"
              value={form.summary}
              disabled={!editable}
              placeholder="Summarize the innovation, who it helps, and its main value."
              onChange={(e) => set("summary", e.target.value)}
            />
          </Field>
          <SectionTitle>Problem and solution</SectionTitle>
          <FormGrid>
            <Field
              label="Problem or need"
              hint={wordLimitHint(form.problem)}
              error={fieldErrors.problem}
            >
              <Textarea
                id="innovation-problem"
                value={form.problem}
                disabled={!editable}
                placeholder="Describe the specific local problem, its causes, and who experiences it."
                onChange={(e) => set("problem", e.target.value)}
              />
            </Field>
            <Field
              label="Proposed solution"
              hint={wordLimitHint(form.solution)}
              error={fieldErrors.solution}
            >
              <Textarea
                id="innovation-solution"
                value={form.solution}
                disabled={!editable}
                placeholder="Explain how the product, service, or process works in practice."
                onChange={(e) => set("solution", e.target.value)}
              />
            </Field>
            <Field
              label="What is new or different?"
              hint={wordLimitHint(form.novelty)}
              error={fieldErrors.novelty}
            >
              <Textarea
                id="innovation-novelty"
                value={form.novelty}
                disabled={!editable}
                placeholder="Compare it with existing approaches and state the improvement clearly."
                onChange={(e) => set("novelty", e.target.value)}
              />
            </Field>
            <Field
              label="Main beneficiaries"
              hint={wordLimitHint(form.beneficiaries)}
              error={fieldErrors.beneficiaries}
            >
              <Textarea
                id="innovation-beneficiaries"
                value={form.beneficiaries}
                disabled={!editable}
                placeholder="Identify users, customers, communities, or institutions that benefit."
                onChange={(e) => set("beneficiaries", e.target.value)}
              />
            </Field>
          </FormGrid>
          <SectionTitle>Readiness and expected results</SectionTitle>
          <FormGrid>
            <Field
              label="Evidence so far (optional)"
              hint={wordLimitHint(form.currentEvidence)}
              error={fieldErrors.currentEvidence}
            >
              <Textarea
                id="innovation-currentEvidence"
                value={form.currentEvidence}
                disabled={!editable}
                placeholder="Mention tests, prototypes, pilots, user feedback, sales, or measurements already available."
                onChange={(e) => set("currentEvidence", e.target.value)}
              />
            </Field>
            <Field
              label="Implementation plan"
              hint={wordLimitHint(form.implementationPlan)}
              error={fieldErrors.implementationPlan}
            >
              <Textarea
                id="innovation-implementationPlan"
                value={form.implementationPlan}
                disabled={!editable}
                placeholder="List the next activities, approximate timeline, and resources needed."
                onChange={(e) => set("implementationPlan", e.target.value)}
              />
            </Field>
            <Field
              label="Expected impact"
              hint={wordLimitHint(form.impact)}
              error={fieldErrors.impact}
            >
              <Textarea
                id="innovation-impact"
                value={form.impact}
                disabled={!editable}
                placeholder="Describe the expected social, economic, or environmental improvement."
                onChange={(e) => set("impact", e.target.value)}
              />
            </Field>
            <Field
              label="Potential to scale"
              hint={wordLimitHint(form.scalability)}
              error={fieldErrors.scalability}
            >
              <Textarea
                id="innovation-scalability"
                value={form.scalability}
                disabled={!editable}
                placeholder="Explain how this could reach more users, districts, or markets."
                onChange={(e) => set("scalability", e.target.value)}
              />
            </Field>
            <Field
              label="Sustainability"
              hint={wordLimitHint(form.sustainability)}
              error={fieldErrors.sustainability}
            >
              <Textarea
                id="innovation-sustainability"
                value={form.sustainability}
                disabled={!editable}
                placeholder="Explain how the work can continue financially, operationally, and responsibly."
                onChange={(e) => set("sustainability", e.target.value)}
              />
            </Field>
            <Field
              label="Support requested"
              hint={wordLimitHint(form.supportNeeded)}
              error={fieldErrors.supportNeeded}
            >
              <Textarea
                id="innovation-supportNeeded"
                value={form.supportNeeded}
                disabled={!editable}
                placeholder="State the expertise, collaboration, equipment, testing, or funding support needed."
                onChange={(e) => set("supportNeeded", e.target.value)}
              />
            </Field>
          </FormGrid>
          {editable && (
            <Declarations
              $invalid={Boolean(
                fieldErrors.ownershipDeclared || fieldErrors.accuracyDeclared,
              )}
            >
              <label>
                <input
                  id="innovation-ownershipDeclared"
                  type="checkbox"
                  aria-invalid={Boolean(fieldErrors.ownershipDeclared)}
                  checked={form.ownershipDeclared}
                  onChange={(e) => set("ownershipDeclared", e.target.checked)}
                />{" "}
                I own or am authorized to submit this innovation.
              </label>
              {fieldErrors.ownershipDeclared && (
                <InlineError role="alert">
                  {fieldErrors.ownershipDeclared}
                </InlineError>
              )}
              <label>
                <input
                  id="innovation-accuracyDeclared"
                  type="checkbox"
                  aria-invalid={Boolean(fieldErrors.accuracyDeclared)}
                  checked={form.accuracyDeclared}
                  onChange={(e) => set("accuracyDeclared", e.target.checked)}
                />{" "}
                The information is accurate to the best of my knowledge.
              </label>
              {fieldErrors.accuracyDeclared && (
                <InlineError role="alert">
                  {fieldErrors.accuracyDeclared}
                </InlineError>
              )}
            </Declarations>
          )}
          {editable && (
            <Actions>
              <Button disabled={busy} onClick={save}>
                <Save /> {busy ? "Saving..." : "Save draft"}
              </Button>
              {id && (
                <Button $variant="secondary" disabled={busy} onClick={submit}>
                  Submit for review
                </Button>
              )}
            </Actions>
          )}
        </PanelBody>
      </Panel>
      <Panel id="supporting-materials">
        <PanelHeader>
          <div>
            <h2>Supporting materials (optional)</h2>
            <p>
              Upload documents or pictures. Add demonstrations and all videos as
              links.
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          <MaterialGroup>
            <h3>Documents and pictures</h3>
            <p>
              Accepted: PDF, DOCX, XLSX, JPG, PNG, or WEBP. You may select
              several files.
            </p>
            {!id && (
              <AttachmentNotice>
                <FileText />
                <span>
                  <strong>
                    Save the innovation draft before uploading files.
                  </strong>
                  <small>
                    Your form entries are already preserved locally.
                  </small>
                </span>
                <Button onClick={save} disabled={busy}>
                  Save draft to upload
                </Button>
              </AttachmentNotice>
            )}
            {editable && (
              <UploadRow>
                <Field
                  label="Choose files"
                  hint={
                    id
                      ? "Select one or more documents or pictures."
                      : "Available after the database draft is created."
                  }
                  error={attachmentError}
                >
                  <Input
                    key={fileInputKey}
                    id="support-files"
                    type="file"
                    multiple
                    disabled={!id || busy}
                    accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      setFiles(Array.from(e.target.files ?? []));
                      setAttachmentError("");
                    }}
                  />
                </Field>
                <Field label="Who can view these files">
                  <Select
                    value={visibility}
                    disabled={!id || busy}
                    onChange={(e) => setVisibility(e.target.value)}
                  >
                    <option value="REVIEW_TEAM">Review team</option>
                    <option value="ADMIN_ONLY">
                      System Administrator only
                    </option>
                    <option value="PUBLIC">Public after publication</option>
                  </Select>
                </Field>
                <Button
                  disabled={!id || !files.length || busy}
                  onClick={upload}
                >
                  <UploadCloud />
                  {busy
                    ? "Uploading..."
                    : files.length
                      ? `Upload ${files.length} file${files.length === 1 ? "" : "s"}`
                      : "Upload files"}
                </Button>
              </UploadRow>
            )}
            {record?.evidence.length ? (
              <FileList>
                {record.evidence.map((item) => (
                  <div key={item.id}>
                    <FileText />
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.visibility} ·{" "}
                        {Math.ceil(Number(item.sizeBytes) / 1024)} KB
                      </small>
                    </span>
                    <a
                      href={`/api/v1/innovations/${id}/evidence/${item.id}/download`}
                    >
                      Download
                    </a>
                  </div>
                ))}
              </FileList>
            ) : (
              id && (
                <EmptyState
                  title="No documents or pictures uploaded"
                  copy="Supporting files are optional and do not affect draft completion."
                />
              )
            )}
          </MaterialGroup>
          <MaterialGroup>
            <h3>Links and videos</h3>
            <p>
              Paste a link for a hosted document, website, repository,
              demonstration, or video. Video files cannot be uploaded directly.
            </p>
            {editable && (
              <LinkForm>
                <Field label="Link title" error={linkErrors.linkTitle}>
                  <Input
                    id="support-linkTitle"
                    value={linkTitle}
                    placeholder="Example: Prototype demonstration video"
                    onChange={(e) => {
                      setLinkTitle(e.target.value);
                      setLinkErrors((old) => ({ ...old, linkTitle: "" }));
                    }}
                  />
                </Field>
                <Field label="Link URL" error={linkErrors.linkUrl}>
                  <Input
                    id="support-linkUrl"
                    type="url"
                    value={linkUrl}
                    placeholder="https://example.com/demo"
                    onChange={(e) => {
                      setLinkUrl(e.target.value);
                      setLinkErrors((old) => ({ ...old, linkUrl: "" }));
                    }}
                  />
                </Field>
                <Button $variant="secondary" disabled={busy} onClick={addLink}>
                  <Link2 />
                  Add link
                </Button>
              </LinkForm>
            )}
            {form.supportingLinks.length ? (
              <FileList>
                {form.supportingLinks.map((item, index) => (
                  <div key={`${item.url}-${index}`}>
                    <Link2 />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.url}</small>
                    </span>
                    {editable ? (
                      <button
                        aria-label={`Remove ${item.title}`}
                        onClick={() =>
                          set(
                            "supportingLinks",
                            form.supportingLinks.filter(
                              (_, position) => position !== index,
                            ),
                          )
                        }
                      >
                        <Trash2 />
                      </button>
                    ) : (
                      <a href={item.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                ))}
              </FileList>
            ) : (
              <EmptyState
                title="No supporting links"
                copy="Links are optional and do not affect completion."
              />
            )}
          </MaterialGroup>
        </PanelBody>
      </Panel>
    </>
  );
}

function RevisionPage({ selectedId }: { selectedId?: string }) {
  const { request, notify } = usePlatform();
  const [feedback, setFeedback] = useState<InnovationFeedback[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const load = () =>
    request<InnovationFeedback[]>("/api/v1/innovations/feedback")
      .then(setFeedback)
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  const respond = async (innovationId: string, revisionId: string) => {
    setError("");
    try {
      await request(
        `/api/v1/innovations/${innovationId}/revisions/${revisionId}/respond`,
        {
          method: "POST",
          body: JSON.stringify({ response: responses[revisionId] || "" }),
        },
      );
      await load();
      notify("Response sent to the review team.");
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Expert feedback"
        title="Expert feedback"
        description="Review every score, recommendation, rationale, and revision instruction across submitted versions."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {(selectedId
        ? feedback.filter((item) => item.innovationId === selectedId)
        : feedback
      ).length ? (
        <CardGrid>
          {(selectedId
            ? feedback.filter((item) => item.innovationId === selectedId)
            : feedback
          ).map((item) => (
            <Panel key={item.innovationId}>
              <PanelBody>
                <StatusBadge status={item.status} />
                <h2>{item.innovation}</h2>
                <p>Assigned Expert: {item.expert}</p>
                {item.status === "REVISION_REQUIRED" && (
                  <Actions>
                    <ButtonLink
                      to={`/innovator/innovations/${item.innovationId}`}
                    >
                      <Pencil />
                      Revise innovation
                    </ButtonLink>
                  </Actions>
                )}
                {item.rounds.map((round) => (
                  <SectionBlock key={round.id}>
                    <StatusBadge status={round.recommendation} />
                    <h3>Version {round.version} review</h3>
                    <DetailGrid>
                      <DetailItem>
                        <small>Weighted score</small>
                        <strong>
                          {round.totalScore?.toFixed(1) ?? "Not available"}%
                        </strong>
                      </DetailItem>
                      <DetailItem>
                        <small>Submitted</small>
                        <strong>
                          {round.submittedAt
                            ? formatDate(round.submittedAt)
                            : "Not submitted"}
                        </strong>
                      </DetailItem>
                    </DetailGrid>
                    <h3>Overall rationale</h3>
                    <p>{round.rationale}</p>
                    {round.scores.length > 0 && (
                      <CriteriaList>
                        {round.scores.map((score) => (
                          <section key={score.criterionKey}>
                            <div>
                              <strong>
                                {score.criterionName || score.criterionKey}
                              </strong>
                              <small>
                                {score.score} / 5
                                {score.weight
                                  ? ` · ${score.weight}% weight`
                                  : ""}
                              </small>
                            </div>
                            <p>{score.comment || "No criterion comment."}</p>
                          </section>
                        ))}
                      </CriteriaList>
                    )}
                    {round.revisionRequests.map((revision) => (
                      <SectionBlock key={revision.id}>
                        <Eyebrow>
                          {revision.fieldKey.replaceAll("_", " ")}
                        </Eyebrow>
                        <p>{revision.instruction}</p>
                        {revision.response && (
                          <p>
                            <strong>Your response:</strong> {revision.response}
                          </p>
                        )}
                        {revision.status === "OPEN" && revision.id && (
                          <>
                            <Field label="Your response">
                              <Textarea
                                value={responses[revision.id] ?? ""}
                                onChange={(event) =>
                                  setResponses((old) => ({
                                    ...old,
                                    [revision.id!]: event.target.value,
                                  }))
                                }
                              />
                            </Field>
                            <Button
                              disabled={!(responses[revision.id] ?? "").trim()}
                              onClick={() =>
                                respond(item.innovationId, revision.id!)
                              }
                            >
                              Send response
                            </Button>
                          </>
                        )}
                      </SectionBlock>
                    ))}
                  </SectionBlock>
                ))}
              </PanelBody>
            </Panel>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title="No Expert feedback"
          copy="Submitted Expert scores and recommendations will appear here."
        />
      )}
    </>
  );
}

function AdminDashboardPage() {
  const { request } = usePlatform();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    request<AdminDashboard>("/api/v1/admin/dashboard")
      .then(setDashboard)
      .catch((cause) => setError(messageOf(cause)));
  }, []);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!dashboard) return <LoadingPanel />;
  return (
    <>
      <PageHeader
        eyebrow="System administration"
        title="Platform overview"
        description="Live counts from PostgreSQL for the current prototype scope."
      />
      <StatGrid>
        <StatCard
          label="Registered users"
          value={dashboard.counts.users}
          detail="All four actor types"
          icon={<Users />}
        />
        <StatCard
          label="Pending approvals"
          value={dashboard.counts.pendingVerifications}
          detail="Expert and Partner accounts"
          icon={<UserCheck />}
        />
        <StatCard
          label="Innovations"
          value={dashboard.counts.innovations}
          detail="All workflow states"
          icon={<FolderKanban />}
        />
        <StatCard
          label="Published"
          value={dashboard.counts.published}
          detail="Visible in public registry"
          icon={<CheckCircle2 />}
        />
      </StatGrid>
    </>
  );
}

function UsersPage({ selectedId }: { selectedId?: string }) {
  const { request, notify } = usePlatform();
  const navigate = useNavigate();
  const [users, setUsers] = useState<Account[]>([]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [editing, setEditing] = useState<Account | "new" | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [pendingDelete, setPendingDelete] = useState<Account | null>(null);
  const load = () =>
    request<Account[]>("/api/v1/admin/users")
      .then((records) => {
        setUsers(records);
        setError("");
      })
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    request<Account>(`/api/v1/admin/users/${selectedId}`)
      .then(setSelected)
      .catch((cause) => setError(messageOf(cause)));
  }, [selectedId]);
  const deleteUser = async () => {
    if (!pendingDelete) return;
    try {
      await request(`/api/v1/admin/users/${pendingDelete.id}`, {
        method: "DELETE",
      });
      notify("User account deleted and all active sessions revoked.");
      setPendingDelete(null);
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const save = async (input: Record<string, unknown>) => {
    try {
      const creating = editing === "new";
      const saved = await request<Account>(
        creating
          ? "/api/v1/admin/users"
          : `/api/v1/admin/users/${editing && typeof editing !== "string" ? editing.id : ""}`,
        {
          method: creating ? "POST" : "PUT",
          body: JSON.stringify(input),
        },
      );
      notify(creating ? "User account created." : "User information updated.");
      setEditing(null);
      if (selectedId) setSelected(saved);
      await load();
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    }
  };
  const filteredUsers = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesQuery =
        !needle ||
        `${user.name} ${user.email} ${user.organization} ${friendlyRole(user.role)}`
          .toLowerCase()
          .includes(needle);
      return (
        matchesQuery &&
        (roleFilter === "ALL" || user.role === roleFilter) &&
        (statusFilter === "ALL" || user.accountStatus === statusFilter)
      );
    });
  }, [users, query, roleFilter, statusFilter]);
  const exportUsers = () =>
    downloadCsv(
      "lidkep-users.csv",
      [
        "Name",
        "Email",
        "Role",
        "Organization",
        "Status",
        "Joined",
        "Last active",
      ],
      filteredUsers.map((user) => [
        user.name,
        user.email,
        friendlyRole(user.role),
        user.organization,
        user.accountStatus,
        user.createdAt ?? "",
        user.lastLoginAt ?? "",
      ]),
    );
  if (selectedId && !selected)
    return error ? <ErrorBox>{error}</ErrorBox> : <LoadingPanel />;
  if (selected) {
    const details = [
      ["Full name", selected.name],
      ["Email", selected.email],
      ["Role", friendlyRole(selected.role)],
      ["Status", selected.accountStatus.replaceAll("_", " ")],
      ["Organization", selected.organization],
      ["Identification type", selected.identificationType],
      ["Identification number", selected.identificationNumber],
      ["Phone number", selected.phoneNumber],
      ["Education", selected.educationLevel],
      ["Occupation", selected.occupation],
      ["Province", selected.province],
      ["District", selected.district],
      ["Sector", selected.administrativeSector],
      ["Years of experience", String(selected.yearsOfExperience ?? 0)],
      ["Created", selected.createdAt ? formatDate(selected.createdAt) : ""],
    ];
    return (
      <>
        <PageHeader
          eyebrow="User management"
          title={selected.name}
          description="Complete account and profile information available to the System Administrator."
          action={
            <Actions>
              <Button
                $variant="secondary"
                onClick={() => {
                  setSelected(null);
                  navigate("/admin/users");
                }}
              >
                <ArrowLeft />
                All users
              </Button>
              <Button onClick={() => setEditing(selected)}>Edit user</Button>
            </Actions>
          }
        />
        {error && <ErrorBox>{error}</ErrorBox>}
        <Panel>
          <PanelBody>
            <StatusBadge status={selected.accountStatus} />
            <DetailGrid>
              {details.map(([label, value]) => (
                <DetailItem key={label}>
                  <small>{label}</small>
                  <strong>{value || "Not provided"}</strong>
                </DetailItem>
              ))}
            </DetailGrid>
          </PanelBody>
        </Panel>
        {editing && (
          <UserEditor
            user={editing === "new" ? null : editing}
            onCancel={() => setEditing(null)}
            onSave={save}
          />
        )}
        {pendingDelete && (
          <ConfirmationDialog
            title={`Delete ${pendingDelete.name}?`}
            message="This disables the account, revokes its sessions, and removes it from active user lists."
            confirmLabel="Yes"
            danger
            onCancel={() => setPendingDelete(null)}
            onConfirm={deleteUser}
          />
        )}
      </>
    );
  }
  return (
    <>
      <ManagementPageHeader
        icon={<Users />}
        eyebrow="User management"
        title="Users and account status"
        description="View, create, edit, suspend, reactivate, disable, or delete accounts across every platform role."
        action={
          <Actions>
            <Button $variant="secondary" onClick={exportUsers}>
              <Download />
              Export
            </Button>
            <Button onClick={() => setEditing("new")}>
              <Plus />
              New user
            </Button>
          </Actions>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <AdminDataPanel>
        <DataToolbar>
          <SearchControl>
            <Search aria-hidden="true" />
            <Input
              aria-label="Search users"
              placeholder="Search users by name, email, organization, or role"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </SearchControl>
          <ToolbarFilters>
            <Select
              aria-label="Filter users by role"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="ALL">All roles</option>
              <option value="SYSTEM_ADMINISTRATOR">System Administrator</option>
              <option value="INNOVATOR">Innovator</option>
              <option value="EXPERT">Expert</option>
              <option value="INVESTOR_PARTNER">
                Investor / Industry Partner
              </option>
            </Select>
            <Select
              aria-label="Filter users by status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING_APPROVAL">Pending approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DISABLED">Disabled</option>
            </Select>
          </ToolbarFilters>
        </DataToolbar>
        <TableWrap>
          <UserManagementTable>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Last active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <IdentityCell>
                      <RowAvatar>{initials(user.name)}</RowAvatar>
                      <span>
                        <strong>{user.name}</strong>
                        <small>{user.email}</small>
                      </span>
                    </IdentityCell>
                  </td>
                  <td>{friendlyRole(user.role)}</td>
                  <td>{user.organization || "—"}</td>
                  <td>
                    <StatusBadge status={user.accountStatus} />
                  </td>
                  <td>{user.createdAt ? formatDate(user.createdAt) : "—"}</td>
                  <td>
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : "Never"}
                  </td>
                  <td>
                    <RowActions>
                      <IconButtonLink
                        to={`/admin/users/${user.id}`}
                        aria-label={`View ${user.name}`}
                        title="View user"
                      >
                        <Eye />
                      </IconButtonLink>
                      <IconButton
                        type="button"
                        $variant="secondary"
                        aria-label={`Edit ${user.name}`}
                        title="Edit user"
                        onClick={() => setEditing(user)}
                      >
                        <Pencil />
                      </IconButton>
                    </RowActions>
                  </td>
                </tr>
              ))}
            </tbody>
          </UserManagementTable>
        </TableWrap>
        {!filteredUsers.length && (
          <EmptyState
            title="No users match these filters"
            copy="Try a broader search or reset the role and status filters."
          />
        )}
        <TableFooter>
          <span>
            Showing {filteredUsers.length} of {users.length} users
          </span>
          <span>Page 1 of 1</span>
        </TableFooter>
      </AdminDataPanel>
      {editing && (
        <UserEditor
          user={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
    </>
  );
}

function UserEditor({
  user,
  onCancel,
  onSave,
}: {
  user: Account | null;
  onCancel: () => void;
  onSave: (input: Record<string, unknown>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input: Record<string, unknown> = {
      email: String(form.get("email")),
      displayName: String(form.get("displayName")),
      role: String(form.get("role")),
      status: String(form.get("status")),
      organization: String(form.get("organization")),
      identificationType: String(form.get("identificationType")),
      identificationNumber: String(form.get("identificationNumber")),
      phoneNumber: String(form.get("phoneNumber")),
      educationLevel: String(form.get("educationLevel")),
      province: String(form.get("province")),
      district: String(form.get("district")),
      administrativeSector: String(form.get("administrativeSector")),
      occupation: String(form.get("occupation")),
      yearsOfExperience: Number(form.get("yearsOfExperience") || 0),
      preferredLanguage: String(form.get("preferredLanguage")),
      publicProfile: form.get("publicProfile") === "on",
    };
    if (!user) {
      input.password = String(form.get("password"));
    }
    setBusy(true);
    try {
      await onSave(input);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalBackdrop role="presentation">
      <UserEditorModal
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-editor-title"
      >
        <PanelHeader>
          <div>
            <h2 id="user-editor-title">
              {user ? "Edit user information" : "Create user account"}
            </h2>
            <p>System Administrator managed account details.</p>
          </div>
          <button aria-label="Close" onClick={onCancel}>
            <X />
          </button>
        </PanelHeader>
        <PanelBody>
          <AdminForm onSubmit={submit}>
            <FormGrid>
              <Field label="Full name">
                <Input name="displayName" required defaultValue={user?.name} />
              </Field>
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  required
                  defaultValue={user?.email}
                />
              </Field>
              <Field label="Role">
                <Select name="role" defaultValue={user?.role ?? "INNOVATOR"}>
                  <option value="SYSTEM_ADMINISTRATOR">
                    System Administrator
                  </option>
                  <option value="INNOVATOR">Innovator</option>
                  <option value="EXPERT">Expert</option>
                  <option value="INVESTOR_PARTNER">
                    Investor / Industry Partner
                  </option>
                </Select>
              </Field>
              <Field
                label={user ? "Account status" : "Initial status"}
                hint={
                  user
                    ? "Suspending or disabling the account revokes its active sessions."
                    : "Choose the account status applied after creation."
                }
              >
                <Select
                  name="status"
                  defaultValue={user?.accountStatus ?? "ACTIVE"}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING_APPROVAL">Pending approval</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="DISABLED">Disabled</option>
                </Select>
              </Field>
              {!user && (
                <Field label="Temporary password">
                  <PasswordInput
                    name="password"
                    minLength={12}
                    required
                  />
                </Field>
              )}

              <Field label="Organization">
                <Input name="organization" defaultValue={user?.organization} />
              </Field>
              <Field label="Identification type">
                <Input
                  name="identificationType"
                  defaultValue={user?.identificationType}
                />
              </Field>
              <Field label="Identification number">
                <Input
                  name="identificationNumber"
                  defaultValue={user?.identificationNumber}
                />
              </Field>
              <Field label="Phone number">
                <Input name="phoneNumber" defaultValue={user?.phoneNumber} />
              </Field>
              <Field label="Education">
                <Input
                  name="educationLevel"
                  defaultValue={user?.educationLevel}
                />
              </Field>
              <Field label="Occupation">
                <Input name="occupation" defaultValue={user?.occupation} />
              </Field>
              <Field label="Province">
                <Input name="province" defaultValue={user?.province} />
              </Field>
              <Field label="District">
                <Input name="district" defaultValue={user?.district} />
              </Field>
              <Field label="Administrative sector">
                <Input
                  name="administrativeSector"
                  defaultValue={user?.administrativeSector}
                />
              </Field>
              <Field label="Years of experience">
                <Input
                  name="yearsOfExperience"
                  type="number"
                  min="0"
                  max="80"
                  defaultValue={user?.yearsOfExperience ?? 0}
                />
              </Field>
              <Field label="Preferred language">
                <Select
                  name="preferredLanguage"
                  defaultValue={user?.preferredLanguage ?? "en"}
                >
                  <option value="en">English</option>
                  <option value="rw">Kinyarwanda</option>
                </Select>
              </Field>
            </FormGrid>
            <CheckLabel>
              <input
                name="publicProfile"
                type="checkbox"
                defaultChecked={user?.publicProfile}
              />
              Show this profile publicly
            </CheckLabel>
            <Actions>
              <Button type="button" $variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save user"}
              </Button>
            </Actions>
          </AdminForm>
        </PanelBody>
      </UserEditorModal>
    </ModalBackdrop>
  );
}

function VerificationsPage({ selectedId }: { selectedId?: string }) {
  const { request, notify } = usePlatform();
  const [items, setItems] = useState<Verification[]>([]);
  const [selected, setSelected] = useState<Verification | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const load = () =>
    request<Verification[]>("/api/v1/admin/verifications")
      .then(setItems)
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setSelected(null);
      return;
    }
    request<Verification>(`/api/v1/admin/verifications/${selectedId}`)
      .then(setSelected)
      .catch((cause) => setError(messageOf(cause)));
  }, [selectedId]);
  const [pending, setPending] = useState<{
    item: Verification;
    decision: "APPROVE" | "REJECT";
  } | null>(null);
  const filteredItems = useMemo(
    () => statusFilter === "ALL" ? items : items.filter((item) => item.status === statusFilter),
    [items, statusFilter],
  );

  const decide = async () => {
    if (!pending) return;
    try {
      await request(`/api/v1/admin/verifications/${pending.item.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision: pending.decision }),
      });
      notify(
        `Account ${pending.decision === "APPROVE" ? "approved" : "rejected"}.`,
      );
      setPending(null);
      await load();
      if (selectedId) {
        setSelected(
          await request<Verification>(
            `/api/v1/admin/verifications/${selectedId}`,
          ),
        );
      }
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  if (selectedId && !selected)
    return error ? <ErrorBox>{error}</ErrorBox> : <LoadingPanel />;
  if (selected) {
    const details = [
      ["Full name", selected.name],
      ["Email", selected.email],
      ["Requested role", friendlyRole(selected.role)],
      ["Organization", selected.organization],
      ["Identification type", selected.identificationType],
      ["Identification number", selected.identificationNumber],
      ["Phone number", selected.phoneNumber],
      ["Education", selected.educationLevel],
      ["Occupation", selected.occupation],
      ["Province", selected.province],
      ["District", selected.district],
      ["Sector", selected.administrativeSector],
      ["Years of experience", String(selected.yearsOfExperience ?? 0)],
      [
        "Submitted",
        selected.submittedAt ? formatDate(selected.submittedAt) : "",
      ],
    ];
    return (
      <>
        <PageHeader
          eyebrow="Account approval review"
          title={selected.name}
          description="Review the complete user information below before making a decision."
          action={
            <ButtonLink to="/admin/verifications" $variant="secondary">
              <ArrowLeft />
              Approval queue
            </ButtonLink>
          }
        />
        {error && <ErrorBox>{error}</ErrorBox>}
        <Panel>
          <PanelBody>
            <StatusBadge status={selected.status} />
            <DetailGrid>
              {details.map(([label, value]) => (
                <DetailItem key={label}>
                  <small>{label}</small>
                  <strong>{value || "Not provided"}</strong>
                </DetailItem>
              ))}
            </DetailGrid>
            <SectionBlock>
              <h3>Supporting evidence</h3>
              {selected.evidenceFiles?.length ? (
                <FileList>
                  {selected.evidenceFiles.map((file) => (
                    <div key={file.id}>
                      <FileText />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.mimeType}</small>
                      </span>
                      <a
                        href={`/api/v1/users/profile/evidence/${file.id}/download`}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No evidence files were submitted.</p>
              )}
            </SectionBlock>
            {selected.status === "PENDING_APPROVAL" && (
              <Actions>
                <Button
                  $variant="danger"
                  onClick={() =>
                    setPending({ item: selected, decision: "REJECT" })
                  }
                >
                  Reject
                </Button>
                <Button
                  onClick={() =>
                    setPending({ item: selected, decision: "APPROVE" })
                  }
                >
                  <UserCheck />
                  Approve
                </Button>
              </Actions>
            )}
          </PanelBody>
        </Panel>
        {pending && (
          <ConfirmationDialog
            title={`${pending.decision === "APPROVE" ? "Approve" : "Reject"} ${pending.item.name}?`}
            message={`Are you sure you want to ${pending.decision.toLowerCase()} this account?`}
            confirmLabel="Yes"
            danger={pending.decision === "REJECT"}
            onCancel={() => setPending(null)}
            onConfirm={decide}
          />
        )}
      </>
    );
  }
  return (
    <>
      <PageHeader
        eyebrow="Account approvals"
        title="User account approval queue"
        description="Every submitted Innovator, Expert, and Investor / Industry Partner profile requires a System Administrator decision before its role workspace is unlocked."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <FilterBar>
        <Field label="Filter by status">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING_APPROVAL">Pending approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </Select>
        </Field>
      </FilterBar>
      {filteredItems.length ? (
        <CardGrid>
          {filteredItems.map((item) => (
            <Panel key={item.id}>
              <PanelBody>
                <StatusBadge status={item.status} />
                <h2>{item.name}</h2>
                <p>{item.organization || "No organization provided"}</p>
                <small>
                  {friendlyRole(item.role)} · {item.email}
                </small>
                <Actions>
                  <ButtonLink
                    to={`/admin/verifications/${item.id}`}
                    $variant="secondary"
                  >
                    Review information
                  </ButtonLink>
                </Actions>
                {item.decisionReason && (
                  <DecisionReason>{item.decisionReason}</DecisionReason>
                )}
              </PanelBody>
            </Panel>
          ))}
        </CardGrid>
      ) : (
        <EmptyState
          title={statusFilter === "ALL" ? "No account approvals" : `No ${statusFilter.replace("_", " ").toLowerCase()} accounts`}
          copy="New role registrations will appear here."
        />
      )}
      {pending && (
        <ConfirmationDialog
          title={`${pending.decision === "APPROVE" ? "Approve" : "Reject"} ${pending.item.name}?`}
          message={`Are you sure you want to ${pending.decision.toLowerCase()} this account?`}
          confirmLabel="Yes"
          danger={pending.decision === "REJECT"}
          onCancel={() => setPending(null)}
          onConfirm={decide}
        />
      )}
    </>
  );
}


const canAssignExpert = (innovation: Innovation) =>
  !innovation.assignment &&
  Boolean(innovation.submittedAt) &&
  Boolean(innovation.administratorReviewedAt) &&
  innovation.status === "SUBMITTED";

function AdminInnovationsPage({ selectedId }: { selectedId?: string }) {
  const { data, request, notify } = usePlatform();
  const [items, setItems] = useState<Innovation[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<Innovation | null>(null);
  const [editing, setEditing] = useState<Innovation | "new" | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [assigning, setAssigning] = useState<Innovation | null>(null);
  const [expertId, setExpertId] = useState("");
  const [assignmentDueAt, setAssignmentDueAt] = useState("");
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const load = () =>
    request<Innovation[]>("/api/v1/admin/innovations")
      .then((records) => {
        setItems(records);
        setError("");
      })
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    if (!selectedId) {
      setSelectedDetail(null);
      return;
    }
    request<Innovation>(`/api/v1/admin/innovations/${selectedId}`)
      .then((record) => {
        setSelectedDetail(record);
        setError("");
      })
      .catch((cause) => setError(messageOf(cause)));
  }, [selectedId]);
  const [pending, setPending] = useState<{
    item: Innovation;
    action: "archive" | "delete";
  } | null>(null);
  const decide = async () => {
    if (!pending) return;
    try {
      if (pending.action === "delete") {
        await request(`/api/v1/admin/innovations/${pending.item.id}`, {
          method: "DELETE",
        });
        notify("Innovation deleted.");
      } else {
        await request(`/api/v1/admin/innovations/${pending.item.id}/archive`, {
          method: "POST",
          body: "{}",
        });
        notify("Innovation archived and the Innovator was notified.");
      }
      setPending(null);
      await load();
      if (selectedId) {
        setSelectedDetail(
          await request<Innovation>(`/api/v1/admin/innovations/${selectedId}`),
        );
      }
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const save = async (input: Record<string, unknown>) => {
    try {
      const creating = editing === "new";
      await request(
        creating
          ? "/api/v1/admin/innovations"
          : `/api/v1/innovations/${editing && typeof editing !== "string" ? editing.id : ""}`,
        {
          method: creating ? "POST" : "PATCH",
          body: JSON.stringify(input),
        },
      );
      notify(
        creating
          ? "Innovation draft created."
          : "Innovation information updated.",
      );
      setEditing(null);
      await load();
    } catch (cause) {
      setError(messageOf(cause));
      throw cause;
    }
  };
  const selected =
    selectedDetail ?? items.find((item) => item.id === selectedId);
  const approvedExperts = (data?.users ?? []).filter(
    (user) => user.role === "EXPERT" && user.accountStatus === "ACTIVE",
  );
  const categories = useMemo(
    () =>
      Array.from(
        new Set(items.map((item) => item.category).filter(Boolean)),
      ).sort(),
    [items],
  );
  const filteredItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !needle ||
        `${item.title} ${item.owner} ${item.sector} ${item.category}`
          .toLowerCase()
          .includes(needle);
      const matchesAssigned =
        assignedFilter === "ALL" ||
        (assignedFilter === "ASSIGNED"
          ? Boolean(item.assignment)
          : !item.assignment);
      return (
        matchesQuery &&
        (statusFilter === "ALL" || item.status === statusFilter) &&
        (categoryFilter === "ALL" || item.category === categoryFilter) &&
        matchesAssigned
      );
    });
  }, [items, query, statusFilter, categoryFilter, assignedFilter]);
  const exportInnovations = () =>
    downloadCsv(
      "lidkep-innovations.csv",
      [
        "Innovation",
        "Category",
        "Owner",
        "Assigned Expert",
        "Completion",
        "Status",
        "Submitted",
      ],
      filteredItems.map((item) => [
        item.title,
        item.category,
        item.owner,
        item.assignment?.expert ?? "",
        `${item.completion}%`,
        item.status,
        item.submittedAt ?? "",
      ]),
    );
  const openAssignment = (innovation: Innovation) => {
    if (!canAssignExpert(innovation)) return;
    setExpertId("");
    setAssignmentDueAt("");
    setAssignmentError("");
    setAssigning(innovation);
  };
  const closeAssignment = () => {
    setExpertId("");
    setAssignmentDueAt("");
    setAssignmentError("");
    setAssigning(null);
  };
  const assign = async () => {
    if (!assigning || !expertId || !canAssignExpert(assigning)) return;
    setAssignmentBusy(true);
    setAssignmentError("");
    try {
      await request(`/api/v1/admin/innovations/${assigning.id}/assignments`, {
        method: "POST",
        body: JSON.stringify({ expertId, dueAt: assignmentDueAt || undefined }),
      });
      notify(
        "Innovation assigned. The Expert received a new assignment notification.",
      );
      closeAssignment();
      await load();
      if (selectedId) {
        setSelectedDetail(
          await request<Innovation>(`/api/v1/admin/innovations/${selectedId}`),
        );
      }
    } catch (cause) {
      setAssignmentError(messageOf(cause));
    } finally {
      setAssignmentBusy(false);
    }
  };
  return (
    <>
      <ManagementPageHeader
        icon={<FolderKanban />}
        eyebrow="Innovation management"
        title={selected ? selected.title : "All innovations"}
        description="Review complete submissions, assign one Expert, and monitor revision or automatic publication outcomes."
        action={
          selected ? (
            <Actions>
              <ButtonLink to="/admin/innovations" $variant="secondary">
                <ArrowLeft />
                All innovations
              </ButtonLink>
              <Button onClick={() => setEditing(selected)}>
                Edit innovation
              </Button>
            </Actions>
          ) : (
            <Actions>
              <Button $variant="secondary" onClick={exportInnovations}>
                <Download />
                Export
              </Button>
              <Button onClick={() => setEditing("new")}>
                <Plus />
                New innovation
              </Button>
            </Actions>
          )
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {selected && (
        <Panel>
          <PanelBody>
            <StatusBadge status={selected.status} />
            <DetailGrid>
              {[
                ["Owner", selected.owner],
                ["Organization", selected.organization],
                ["Sector", selected.sector],
                ["Category", selected.category],
                ["Project coverage", selected.district],
                ["Maturity", selected.maturity],
                ["Impact area", selected.impactArea],
                ["Completion", `${selected.completion}%`],
                ["Version", String(selected.version)],
                [
                  "Administrator review",
                  selected.administratorReviewedAt
                    ? formatDate(selected.administratorReviewedAt)
                    : "Not reviewed",
                ],
                [
                  "Created",
                  selected.createdAt ? formatDate(selected.createdAt) : "",
                ],
                [
                  "Updated",
                  selected.updatedAt ? formatDate(selected.updatedAt) : "",
                ],
              ].map(([label, value]) => (
                <DetailItem key={label}>
                  <small>{label}</small>
                  <strong>{value || "Not provided"}</strong>
                </DetailItem>
              ))}
            </DetailGrid>
            <NarrativeGrid>
              {[
                ["Summary", selected.summary],
                ["Problem or need", selected.problem],
                ["Proposed solution", selected.solution],
                ["Beneficiaries", selected.beneficiaries],
                ["Expected impact", selected.impact],
                ["What is new", selected.novelty],
                ["Current evidence", selected.currentEvidence],
                ["Implementation plan", selected.implementationPlan],
                ["Scalability", selected.scalability],
                ["Sustainability", selected.sustainability],
                ["Support needed", selected.supportNeeded],
              ].map(([label, value]) => (
                <section key={label}>
                  <h3>{label}</h3>
                  <p>{value || "Not provided"}</p>
                </section>
              ))}
            </NarrativeGrid>
            <SectionBlock>
              <h3>Supporting links</h3>
              {selected.supportingLinks.length ? (
                <FileList>
                  {selected.supportingLinks.map((link) => (
                    <div key={link.url}>
                      <Link2 />
                      <span>
                        <strong>{link.title}</strong>
                        <small>{link.url}</small>
                      </span>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No supporting links.</p>
              )}
            </SectionBlock>
            <SectionBlock>
              <h3>Evidence files</h3>
              {selected.evidence.length ? (
                <FileList>
                  {selected.evidence.map((file) => (
                    <div key={file.id}>
                      <FileText />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.mimeType}</small>
                      </span>
                      <a
                        href={`/api/v1/innovations/${selected.id}/evidence/${file.id}/download`}
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </FileList>
              ) : (
                <p>No evidence files.</p>
              )}
            </SectionBlock>
            {selected.assignment ? (
              <AssignmentLock>
                <LockKeyhole />
                <span>
                  <strong>Assigned to {selected.assignment.expert}</strong>
                  <small>
                    This one-time assignment is locked and cannot be changed.
                  </small>
                </span>
                <StatusBadge status={selected.assignment.status} />
              </AssignmentLock>
            ) : canAssignExpert(selected) ? (
              <SectionBlock>
                <h3>Expert assignment</h3>
                <p>
                  Assign this innovation once. The selected Expert cannot be
                  changed afterward.
                </p>
                <Button onClick={() => openAssignment(selected)}>
                  <UserCheck />
                  Assign Expert
                </Button>
              </SectionBlock>
            ) : null}
            {selected.assignment?.reviewHistory?.length ? (
              <SectionBlock>
                <h3>Expert review history</h3>
                <CardGrid>
                  {selected.assignment.reviewHistory.map((review) => (
                    <Panel key={review.id}>
                      <PanelBody>
                        <StatusBadge status={review.recommendation} />
                        <h3>Version {review.version}</h3>
                        <p>{review.rationale}</p>
                        <Meta>
                          <span>
                            Score {review.totalScore?.toFixed(1) ?? "—"}%
                          </span>
                          <span>
                            {review.submittedAt
                              ? formatDate(review.submittedAt)
                              : "Not submitted"}
                          </span>
                        </Meta>
                      </PanelBody>
                    </Panel>
                  ))}
                </CardGrid>
              </SectionBlock>
            ) : null}
            <Actions>
              {selected.status !== "ARCHIVED" && (
                <Button
                  $variant="secondary"
                  onClick={() =>
                    setPending({ item: selected, action: "archive" })
                  }
                >
                  Archive innovation
                </Button>
              )}
              <Button
                $variant="danger"
                onClick={() => setPending({ item: selected, action: "delete" })}
              >
                <Trash2 />
                Delete innovation
              </Button>
            </Actions>
          </PanelBody>
        </Panel>
      )}
      {!selected && (
        <AdminDataPanel>
          <DataToolbar>
            <SearchControl>
              <Search aria-hidden="true" />
              <Input
                aria-label="Search innovations"
                placeholder="Search innovations by title, owner, sector, or category"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </SearchControl>
            <ToolbarFilters>
              <Select
                aria-label="Filter innovations by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All statuses</option>
                {Array.from(new Set(items.map((item) => item.status)))
                  .sort()
                  .map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
              </Select>
              <Select
                aria-label="Filter innovations by category"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </Select>
              <Select
                aria-label="Filter innovations by assignment"
                value={assignedFilter}
                onChange={(event) => setAssignedFilter(event.target.value)}
              >
                <option value="ALL">All assignments</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNASSIGNED">Unassigned</option>
              </Select>
            </ToolbarFilters>
          </DataToolbar>
          <TableWrap>
            <InnovationManagementTable>
              <thead>
                <tr>
                  <th>Innovation</th>
                  <th>Category</th>
                  <th>Owner</th>
                  <th>Assigned to</th>
                  <th>Completion</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <TableTitle>
                        <strong>{item.title}</strong>
                        <small>{item.sector || "No sector"}</small>
                        <Link to={`/admin/innovations/${item.id}`}>
                          View details
                        </Link>
                      </TableTitle>
                    </td>
                    <td>
                      <CategoryPill>
                        {item.category || "Uncategorized"}
                      </CategoryPill>
                    </td>
                    <td>{item.owner}</td>
                    <td>
                      {item.assignment ? (
                        <AssignedExpert>
                          <RowAvatar>
                            {initials(item.assignment.expert)}
                          </RowAvatar>
                          <span>
                            <strong>{item.assignment.expert}</strong>
                            <small>Assignment locked</small>
                          </span>
                        </AssignedExpert>
                      ) : (
                        <MutedText>Not assigned</MutedText>
                      )}
                    </td>
                    <td>
                      <CompletionCell>
                        <span>{item.completion}%</span>
                        <ProgressTrack
                          aria-label={`${item.completion}% complete`}
                        >
                          <i style={{ width: `${item.completion}%` }} />
                        </ProgressTrack>
                      </CompletionCell>
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>
                      {item.submittedAt ? formatDate(item.submittedAt) : "—"}
                    </td>
                    <td>
                      <RowActions>
                        <IconButtonLink
                          to={`/admin/innovations/${item.id}`}
                          aria-label={`View ${item.title}`}
                          title="View innovation"
                        >
                          <Eye />
                        </IconButtonLink>
                        {item.assignment && (
                          <LockedAssignment
                            title={`Assigned to ${item.assignment.expert}`}
                          >
                            <LockKeyhole />
                            Assigned
                          </LockedAssignment>
                        )}
                      </RowActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </InnovationManagementTable>
          </TableWrap>
          {!filteredItems.length && (
            <EmptyState
              title="No innovations match these filters"
              copy="Try a broader search or reset the status, category, and assignment filters."
            />
          )}
          <TableFooter>
            <span>
              Showing {filteredItems.length} of {items.length} innovations
            </span>
            <span>Page 1 of 1</span>
          </TableFooter>
        </AdminDataPanel>
      )}
      {editing && (
        <InnovationAdminEditor
          item={editing === "new" ? null : editing}
          owners={(data?.users ?? []).filter(
            (user) => user.role === "INNOVATOR",
          )}
          onCancel={() => setEditing(null)}
          onSave={save}
        />
      )}
      {pending && (
        <ConfirmationDialog
          title={
            pending.action === "delete"
              ? `Delete ${pending.item.title}?`
              : `Archive ${pending.item.title}?`
          }
          message={
            pending.action === "delete"
              ? "This permanently removes an innovation that has no review or engagement history."
              : "The innovation will leave active workflows and its owner will be notified."
          }
          confirmLabel="Yes"
          danger
          onCancel={() => setPending(null)}
          onConfirm={decide}
        />
      )}
      {assigning && (
        <ModalBackdrop role="presentation">
          <Modal
            role="dialog"
            aria-modal="true"
            aria-labelledby="assignment-title"
          >
            <PanelHeader>
              <div>
                <h2 id="assignment-title">Assign an Expert</h2>
                <p>{assigning.title}</p>
              </div>
              <button
                aria-label="Close assignment dialog"
                onClick={closeAssignment}
              >
                <X />
              </button>
            </PanelHeader>
            <PanelBody>
              {assignmentError && (
                <ErrorBox role="alert">{assignmentError}</ErrorBox>
              )}
              <AssignmentNotice>
                <LockKeyhole />
                <span>
                  <strong>This is a one-time assignment</strong>
                  <small>
                    After confirmation, the assigned Expert cannot be replaced.
                  </small>
                </span>
              </AssignmentNotice>
              <Field label="Approved Expert">
                <Select
                  autoFocus
                  value={expertId}
                  onChange={(event) => setExpertId(event.target.value)}
                >
                  <option value="">Select an approved Expert</option>
                  {approvedExperts.map((expert) => (
                    <option key={expert.id} value={expert.id}>
                      {expert.name} ({expert.email})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Due date (optional)">
                <Input
                  type="date"
                  value={assignmentDueAt}
                  onChange={(event) => setAssignmentDueAt(event.target.value)}
                />
              </Field>
              {!approvedExperts.length && (
                <ErrorBox>
                  No approved Expert accounts are currently available.
                </ErrorBox>
              )}
              <Actions>
                <Button
                  $variant="secondary"
                  disabled={assignmentBusy}
                  onClick={closeAssignment}
                >
                  Cancel
                </Button>
                <Button
                  disabled={
                    assignmentBusy || !expertId || !approvedExperts.length
                  }
                  onClick={assign}
                >
                  <UserCheck />
                  {assignmentBusy ? "Assigning..." : "Confirm assignment"}
                </Button>
              </Actions>
            </PanelBody>
          </Modal>
        </ModalBackdrop>
      )}
    </>
  );
}

function InnovationAdminEditor({
  item,
  owners,
  onCancel,
  onSave,
}: {
  item: Innovation | null;
  owners: Account[];
  onCancel: () => void;
  onSave: (input: Record<string, unknown>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const fields: Array<[keyof Innovation, string]> = [
    ["title", "Title"],
    ["summary", "Summary"],
    ["problem", "Problem or need"],
    ["solution", "Proposed solution"],
    ["beneficiaries", "Beneficiaries"],
    ["sector", "Sector"],
    ["category", "Category"],
    ["district", "Project coverage"],
    ["maturity", "Maturity"],
    ["impactArea", "Impact area"],
    ["impact", "Expected impact"],
    ["novelty", "What is new"],
    ["currentEvidence", "Current evidence"],
    ["implementationPlan", "Implementation plan"],
    ["scalability", "Scalability"],
    ["sustainability", "Sustainability"],
    ["supportNeeded", "Support needed"],
  ];
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const input = Object.fromEntries(
      fields.map(([key]) => [key, String(form.get(key))]),
    );
    if (!item) input.ownerId = String(form.get("ownerId"));
    setBusy(true);
    try {
      await onSave(input);
    } finally {
      setBusy(false);
    }
  };
  return (
    <ModalBackdrop role="presentation">
      <WideModal
        role="dialog"
        aria-modal="true"
        aria-labelledby="innovation-editor-title"
      >
        <PanelHeader>
          <div>
            <h2 id="innovation-editor-title">
              {item ? "Edit innovation information" : "Create innovation draft"}
            </h2>
            <p>The System Administrator can manage every innovation record.</p>
          </div>
          <button aria-label="Close" onClick={onCancel}>
            <X />
          </button>
        </PanelHeader>
        <PanelBody>
          <AdminForm onSubmit={submit}>
            {!item && (
              <Field label="Innovator owner">
                <Select name="ownerId" required defaultValue="">
                  <option value="" disabled>
                    Choose an Innovator
                  </option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <FormGrid>
              {fields.map(([key, label]) => {
                const narrative = ![
                  "title",
                  "sector",
                  "category",
                  "district",
                  "maturity",
                  "impactArea",
                ].includes(String(key));
                return (
                  <Field key={String(key)} label={label}>
                    {key === "district" ? (
                      <Select
                        name="district"
                        defaultValue={item?.district ?? ""}
                      >
                        <option value="">Select project coverage</option>
                        {projectCoverageLevels.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </Select>
                    ) : narrative ? (
                      <Textarea
                        name={String(key)}
                        defaultValue={item?.[key] as string}
                      />
                    ) : (
                      <Input
                        name={String(key)}
                        required={key === "title"}
                        defaultValue={item?.[key] as string}
                      />
                    )}
                  </Field>
                );
              })}
            </FormGrid>
            <Actions>
              <Button type="button" $variant="secondary" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={busy || (!item && owners.length === 0)}
              >
                {busy ? "Saving..." : "Save innovation"}
              </Button>
            </Actions>
          </AdminForm>
        </PanelBody>
      </WideModal>
    </ModalBackdrop>
  );
}

function TaxonomiesPage() {
  const { request, notify } = usePlatform();
  const [items, setItems] = useState<Taxonomy[]>([]);
  const [type, setType] = useState("SECTOR");
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Taxonomy | null>(null);
  const load = () =>
    request<Taxonomy[]>("/api/v1/admin/taxonomies")
      .then(setItems)
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  const add = async () => {
    try {
      await request("/api/v1/admin/taxonomies", {
        method: "POST",
        body: JSON.stringify({ type, label }),
      });
      setLabel("");
      notify("Classification item added.");
      load();
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const toggle = async (item: Taxonomy) => {
    try {
      await request(`/api/v1/admin/taxonomies/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      load();
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const startEdit = (item: Taxonomy) => {
    setEditingId(item.id);
    setEditLabel(item.label);
  };
  const saveEdit = async (item: Taxonomy) => {
    if (!editLabel.trim() || editLabel.trim() === item.label) {
      setEditingId(null);
      return;
    }
    try {
      await request(`/api/v1/admin/taxonomies/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ label: editLabel.trim() }),
      });
      setEditingId(null);
      notify("Classification item renamed.");
      load();
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await request(`/api/v1/admin/taxonomies/${pendingDelete.id}`, {
        method: "DELETE",
      });
      setPendingDelete(null);
      notify("Classification item deleted.");
      load();
    } catch (cause) {
      setError(messageOf(cause));
      setPendingDelete(null);
    }
  };
  const grouped = useMemo(
    () =>
      items.reduce<Record<string, Taxonomy[]>>((result, item) => {
        (result[item.type] ??= []).push(item);
        return result;
      }, {}),
    [items],
  );
  return (
    <>
      <PageHeader
        eyebrow="Classification"
        title="Sectors and categories"
        description="Manage the simple lists used by Innovators and public discovery. Click a label to rename it. Use the toggle button to activate or deactivate."
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      <Panel>
        <PanelHeader>
          <h2>Add classification item</h2>
        </PanelHeader>
        <PanelBody>
          <InlineForm>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="SECTOR">Sector</option>
              <option value="CATEGORY">Category</option>
              <option value="DISTRICT">District</option>
              <option value="MATURITY_LEVEL">Maturity level</option>
              <option value="IMPACT_AREA">Impact area</option>
            </Select>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Item label"
            />
            <Button disabled={!label.trim()} onClick={add}>
              <Plus />
              Add
            </Button>
          </InlineForm>
        </PanelBody>
      </Panel>
      <TaxonomyGrid>
        {Object.entries(grouped).map(([key, values]) => (
          <Panel key={key}>
            <PanelHeader>
              <h2>{key.replaceAll("_", " ")}</h2>
            </PanelHeader>
            <PanelBody>
              <TagList>
                {values?.map((item) => (
                  <TaxonomyItem key={item.id} className={item.isActive ? "" : "inactive"}>
                    {editingId === item.id ? (
                      <TaxonomyEditRow>
                        <Input
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") void saveEdit(item);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Button onClick={() => saveEdit(item)}>
                          <Save size={14} />
                        </Button>
                        <Button $variant="secondary" onClick={() => setEditingId(null)}>
                          <X size={14} />
                        </Button>
                      </TaxonomyEditRow>
                    ) : (
                      <TaxonomyItemRow>
                        <button
                          className="label-toggle"
                          onClick={() => toggle(item)}
                          title={item.isActive ? "Click to deactivate" : "Click to activate"}
                        >
                          {item.label}
                          <small>{item.isActive ? "Active" : "Inactive"}</small>
                        </button>
                        <TaxonomyActions>
                          <button
                            className="icon-btn"
                            title="Rename"
                            onClick={() => startEdit(item)}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title="Delete"
                            onClick={() => setPendingDelete(item)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </TaxonomyActions>
                      </TaxonomyItemRow>
                    )}
                  </TaxonomyItem>
                ))}
              </TagList>
            </PanelBody>
          </Panel>
        ))}
      </TaxonomyGrid>
      {pendingDelete && (
        <ConfirmationDialog
          title={`Delete "${pendingDelete.label}"?`}
          message="This item will be permanently removed. If it is used by any innovation record, deletion will be blocked — deactivate it instead."
          confirmLabel="Delete"
          danger
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}


const standardCriterionNames = [
  "Problem relevance",
  "Solution quality",
  "Feasibility",
  "Potential impact",
  "Maturity and evidence",
];

function balancedCriteria(
  count: number,
  current: CriteriaDraftItem[] = [],
): CriteriaDraftItem[] {
  const baseWeight = Math.floor(10000 / count) / 100;
  const remainder = Number((100 - baseWeight * count).toFixed(2));
  return Array.from({ length: count }, (_, index) => ({
    name:
      current[index]?.name ??
      standardCriterionNames[index] ??
      `Criterion ${index + 1}`,
    guidance: current[index]?.guidance ?? "",
    weight: Number((baseWeight + (index === 0 ? remainder : 0)).toFixed(2)),
  }));
}

function CriteriaPage() {
  const { request, notify } = usePlatform();
  const [items, setItems] = useState<CriteriaVersion[]>([]);
  const [show, setShow] = useState(false);
  const [version, setVersion] = useState("v1.1");
  const [name, setName] = useState("Innovation evaluation");
  const [criteria, setCriteria] = useState<CriteriaDraftItem[]>(() =>
    balancedCriteria(5),
  );
  const [busy, setBusy] = useState(false);
  const [pendingActivation, setPendingActivation] =
    useState<CriteriaVersion | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    request<CriteriaVersion[]>("/api/v1/admin/criteria")
      .then(setItems)
      .catch((cause) => setError(messageOf(cause)));
  useEffect(() => {
    void load();
  }, []);
  const totalWeight = Number(
    criteria
      .reduce((total, item) => total + Number(item.weight || 0), 0)
      .toFixed(2),
  );
  const names = criteria.map((item) => item.name.trim().toLowerCase());
  const namesAreUnique = new Set(names).size === names.length;
  const canCreate =
    version.trim().length >= 2 &&
    name.trim().length >= 3 &&
    criteria.every(
      (item) =>
        item.name.trim().length >= 2 && item.weight > 0 && item.weight <= 100,
    ) &&
    namesAreUnique &&
    Math.abs(totalWeight - 100) < 0.001;
  const resizeCriteria = (count: number) => {
    setCriteria((current) => balancedCriteria(count, current));
  };
  const updateCriterion = (
    index: number,
    field: keyof CriteriaDraftItem,
    value: string | number,
  ) => {
    setCriteria((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  };
  const create = async () => {
    setBusy(true);
    setError("");
    try {
      await request("/api/v1/admin/criteria", {
        method: "POST",
        body: JSON.stringify({
          version: version.trim(),
          name: name.trim(),
          criteria: criteria.map((item) => ({
            name: item.name.trim(),
            guidance: item.guidance.trim() || undefined,
            weight: Number(item.weight),
          })),
        }),
      });
      notify("Draft evaluation criteria created.");
      setShow(false);
      setCriteria(balancedCriteria(5));
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };
  const activate = async () => {
    if (!pendingActivation) return;
    setBusy(true);
    setError("");
    try {
      await request(`/api/v1/admin/criteria/${pendingActivation.id}/activate`, {
        method: "POST",
        body: "{}",
      });
      notify(
        `${pendingActivation.version} is now used for new Expert assignments.`,
      );
      setPendingActivation(null);
      await load();
    } catch (cause) {
      setError(messageOf(cause));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Evaluation"
        title="Evaluation criteria"
        description="Create weighted criteria versions and choose which version new Expert assignments will use."
        action={
          <Button onClick={() => setShow((value) => !value)}>
            {show ? <X /> : <Plus />}
            {show ? "Close builder" : "New criteria version"}
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {show && (
        <Panel>
          <PanelHeader>
            <div>
              <h2>Build a criteria version</h2>
              <p>
                Set the number of criteria, names, guidance, and weights before
                saving.
              </p>
            </div>
          </PanelHeader>
          <PanelBody>
            <FormGrid>
              <Field label="Version">
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="For example, v1.1"
                />
              </Field>
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Number of criteria">
                <Select
                  value={criteria.length}
                  onChange={(event) =>
                    resizeCriteria(Number(event.target.value))
                  }
                >
                  {Array.from({ length: 11 }, (_, index) => index + 2).map(
                    (count) => (
                      <option key={count} value={count}>
                        {count} criteria
                      </option>
                    ),
                  )}
                </Select>
              </Field>
            </FormGrid>
            <CriteriaBuilder>
              {criteria.map((criterion, index) => (
                <CriterionEditor key={index}>
                  <CriterionNumber aria-hidden="true">
                    {index + 1}
                  </CriterionNumber>
                  <CriterionFields>
                    <Field label={`Criterion ${index + 1} name`}>
                      <Input
                        value={criterion.name}
                        onChange={(event) =>
                          updateCriterion(index, "name", event.target.value)
                        }
                      />
                    </Field>
                    <Field label={`Criterion ${index + 1} guidance (optional)`}>
                      <Input
                        value={criterion.guidance}
                        onChange={(event) =>
                          updateCriterion(index, "guidance", event.target.value)
                        }
                        placeholder="Explain what the Expert should assess"
                      />
                    </Field>
                    <Field label="Weight (%)">
                      <Input
                        type="number"
                        min="0.01"
                        max="100"
                        step="0.01"
                        value={criterion.weight}
                        onChange={(event) =>
                          updateCriterion(
                            index,
                            "weight",
                            Number(event.target.value),
                          )
                        }
                      />
                    </Field>
                  </CriterionFields>
                </CriterionEditor>
              ))}
            </CriteriaBuilder>
            <CriteriaBuilderFooter>
              <WeightSummary $valid={Math.abs(totalWeight - 100) < 0.001}>
                <strong>Total weight: {totalWeight.toFixed(2)}%</strong>
                <span>
                  {Math.abs(totalWeight - 100) < 0.001
                    ? "Ready to save"
                    : "Weights must total exactly 100%."}
                </span>
              </WeightSummary>
              <Actions>
                <Button $variant="secondary" onClick={() => setShow(false)}>
                  Cancel
                </Button>
                <Button disabled={!canCreate || busy} onClick={create}>
                  {busy ? "Creating..." : "Create draft"}
                </Button>
              </Actions>
            </CriteriaBuilderFooter>
            {!namesAreUnique && (
              <ErrorBox>Every criterion must have a distinct name.</ErrorBox>
            )}
          </PanelBody>
        </Panel>
      )}
      <CardGrid>
        {items.map((item) => (
          <Panel key={item.id}>
            <PanelBody>
              <CriteriaCardHeader>
                <div>
                  <StatusBadge status={item.status} />
                  <h2>{item.name}</h2>
                  <p>
                    {item.version} · {item.criteria.length} criteria
                  </p>
                </div>
                {item.status === "ACTIVE" ? (
                  <ActiveCriteriaMark>
                    <CheckCircle2 />
                    Used for new assignments
                  </ActiveCriteriaMark>
                ) : (
                  <Button
                    $variant="secondary"
                    disabled={busy}
                    onClick={() => setPendingActivation(item)}
                  >
                    Use this version
                  </Button>
                )}
              </CriteriaCardHeader>
              <CriteriaList>
                {item.criteria.map((criterion) => (
                  <div key={criterion.id}>
                    <span>
                      <strong>{criterion.name}</strong>
                      {criterion.guidance && (
                        <small>{criterion.guidance}</small>
                      )}
                    </span>
                    <strong>{criterion.weight}%</strong>
                  </div>
                ))}
              </CriteriaList>
              <CriteriaVersionMeta>
                {item.status === "ACTIVE" && item.activatedAt
                  ? `Activated ${formatDate(item.activatedAt)}`
                  : item.status === "RETIRED" && item.retiredAt
                    ? `Retired ${formatDate(item.retiredAt)}`
                    : `Created ${formatDate(item.createdAt)}`}
              </CriteriaVersionMeta>
            </PanelBody>
          </Panel>
        ))}
      </CardGrid>
      {pendingActivation && (
        <ConfirmationDialog
          title={`Use ${pendingActivation.version} for new assignments?`}
          message="The currently active version will be retired. Existing Expert assignments and revision rounds will keep their original criteria version."
          confirmLabel="Activate"
          onCancel={() => setPendingActivation(null)}
          onConfirm={activate}
        />
      )}
    </>
  );
}

type ReportData = {
  generatedAt: string;
  usersByRole: Array<{ label: string; value: number }>;
  usersByStatus: Array<{ label: string; value: number }>;
  innovationsByStatus: Array<{ label: string; value: number }>;
  publishedBySector: Array<{ label: string; value: number }>;
};

function ReportsPage() {
  const { request } = usePlatform();
  const [report, setReport] = useState<ReportData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    request<ReportData>("/api/v1/admin/reports/summary")
      .then(setReport)
      .catch((cause) => setError(messageOf(cause)));
  }, []);
  const printReport = () => window.print();
  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { font-family: sans-serif; } }`}</style>
      <PageHeader
        eyebrow="System reports"
        title="Prototype summary report"
        description="Current database totals. Use Print / Download PDF to save or share this report."
        action={
          <Button className="no-print" onClick={printReport}>
            <Download />
            Print / Download PDF
          </Button>
        }
      />
      {error && <ErrorBox>{error}</ErrorBox>}
      {report ? (
        <>
          <ReportMeta>Generated {formatDate(report.generatedAt)}</ReportMeta>
          <ReportGrid>
            <Panel>
              <PanelHeader><h2>Users by role</h2></PanelHeader>
              <PanelBody>
                <ReportTable>
                  <thead>
                    <tr><th>Role</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {report.usersByRole.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label?.replaceAll("_", " ") || "—"}</td>
                        <td><strong>{row.value}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </ReportTable>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader><h2>Users by account status</h2></PanelHeader>
              <PanelBody>
                <ReportTable>
                  <thead>
                    <tr><th>Status</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {report.usersByStatus.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label?.replaceAll("_", " ") || "—"}</td>
                        <td><strong>{row.value}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </ReportTable>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader><h2>Innovations by status</h2></PanelHeader>
              <PanelBody>
                <ReportTable>
                  <thead>
                    <tr><th>Status</th><th>Count</th></tr>
                  </thead>
                  <tbody>
                    {report.innovationsByStatus.map((row) => (
                      <tr key={row.label}>
                        <td>{row.label?.replaceAll("_", " ") || "—"}</td>
                        <td><strong>{row.value}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </ReportTable>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader><h2>Published innovations by sector</h2></PanelHeader>
              <PanelBody>
                {report.publishedBySector.length ? (
                  <ReportTable>
                    <thead>
                      <tr><th>Sector</th><th>Count</th></tr>
                    </thead>
                    <tbody>
                      {report.publishedBySector.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label || "—"}</td>
                          <td><strong>{row.value}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </ReportTable>
                ) : (
                  <p>No published innovations yet.</p>
                )}
              </PanelBody>
            </Panel>
          </ReportGrid>
        </>
      ) : (
        <LoadingPanel />
      )}
    </>
  );
}


function SettingsPage() {
  const { request, notify } = usePlatform();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    request<SettingsData>("/api/v1/admin/settings")
      .then(setSettings)
      .catch((cause) => setError(messageOf(cause)));
  }, []);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!settings) return <LoadingPanel />;
  const save = async () => {
    try {
      const saved = await request<SettingsData>("/api/v1/admin/settings", {
        method: "PUT",
        body: JSON.stringify(settings),
      });
      setSettings(saved);
      notify("Prototype settings saved.");
    } catch (cause) {
      setError(messageOf(cause));
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Platform settings"
        description="Only settings used by this prototype are included."
      />
      <SettingsGrid>
        <Panel>
          <PanelBody>
            <Setting>
              <span>
                <strong>Public statistics</strong>
                <small>Show aggregate statistics.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.publicStatistics}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    publicStatistics: e.target.checked,
                  })
                }
              />
            </Setting>
            <Setting>
              <span>
                <strong>Allow comments</strong>
                <small>Foundation for the next Expert phase.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.allowComments}
                onChange={(e) =>
                  setSettings({ ...settings, allowComments: e.target.checked })
                }
              />
            </Setting>
            <Setting>
              <span>
                <strong>Maintenance mode</strong>
                <small>Record the platform availability choice.</small>
              </span>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maintenanceMode: e.target.checked,
                  })
                }
              />
            </Setting>
            <Field label="Maximum upload size (MB)">
              <Input
                type="number"
                min="1"
                max="100"
                value={settings.maxFileSizeMb}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxFileSizeMb: Number(e.target.value),
                  })
                }
              />
            </Field>
            <Actions>
              <Button onClick={save}>
                <Save />
                Save settings
              </Button>
            </Actions>
          </PanelBody>
        </Panel>
      </SettingsGrid>
    </>
  );
}

function NotificationsPage() {
  const { data, request, refreshWorkspace, notify } = usePlatform();
  const navigate = useNavigate();
  const items = data?.notifications ?? [];
  const read = async () => {
    await request("/api/v1/users/me/notifications/read", {
      method: "POST",
      body: "{}",
    });
    await refreshWorkspace();
    notify("Notifications marked as read.");
  };
  const openNotification = async (item: (typeof items)[number]) => {
    if (!item.read) {
      await request(`/api/v1/users/me/notifications/${item.id}/read`, {
        method: "POST",
        body: "{}",
      });
      await refreshWorkspace();
    }
    if (item.actionPath) navigate(item.actionPath);
  };
  return (
    <>
      <PageHeader
        eyebrow="Updates"
        title="Notifications"
        description="Account approvals, innovation submissions, decisions, and feedback."
        action={
          <Button $variant="secondary" onClick={read}>
            Mark all read
          </Button>
        }
      />
      <Panel>
        {items.length ? (
          <RecordList>
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                onClick={() => void openNotification(item)}
              >
                <Bell />
                <span>
                  <strong>{item.title}</strong>
                  <small>
                    {item.message} · {formatDate(item.time)}
                  </small>
                </span>
                {!item.read && <Unread>New</Unread>}
                <ChevronRight />
              </button>
            ))}
          </RecordList>
        ) : (
          <EmptyState
            title="No notifications"
            copy="Important workflow updates will appear here."
          />
        )}
      </Panel>
    </>
  );
}

function ProfilePage() {
  const { user, data, request, refreshWorkspace, notify } = usePlatform();
  const [form, setForm] = useState({
    displayName: user?.name ?? "",
    identificationType: "",
    identificationNumber: "",
    phoneNumber: "",
    educationLevel: "",
    province: "",
    district: "",
    administrativeSector: "",
    occupation: "",
    yearsOfExperience: 0,
    organization: "",
    preferredLanguage: "en",
    publicProfile: true,
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [identificationDocument, setIdentificationDocument] =
    useState<File | null>(null);
  const [identificationDocuments, setIdentificationDocuments] = useState<
    Array<{
      id: string;
      name: string;
      mimeType: string;
      sizeBytes: string;
      createdAt: string;
    }>
  >([]);
  useEffect(() => {
    request<Record<string, unknown>>("/api/v1/users/me/profile")
      .then((profile) => {
        setForm((old) => ({
          ...old,
          displayName: String(profile.name ?? old.displayName),
          identificationType: String(profile.identificationType ?? ""),
          identificationNumber: String(profile.identificationNumber ?? ""),
          phoneNumber: String(profile.phoneNumber ?? "").replace(/^\+250/, "0"),
          educationLevel: String(profile.educationLevel ?? ""),
          province: String(profile.province ?? ""),
          district: String(profile.district ?? ""),
          administrativeSector: String(profile.administrativeSector ?? ""),
          occupation: String(profile.occupation ?? ""),
          yearsOfExperience: Number(profile.yearsOfExperience ?? 0),
          organization: String(profile.organization ?? ""),
          preferredLanguage: String(profile.preferredLanguage ?? "en"),
          publicProfile: Boolean(profile.publicProfile),
        }));
        setIdentificationDocuments(
          Array.isArray(profile.identificationDocuments)
            ? (profile.identificationDocuments as typeof identificationDocuments)
            : [],
        );
      })
      .catch((cause) => setError(messageOf(cause)));
  }, []);
  const locations = data?.taxonomies.locations ?? {};
  const districts = Object.keys(locations[form.province] ?? {});
  const sectors = locations[form.province]?.[form.district] ?? [];
  const update = (
    field: keyof typeof form,
    value: string | number | boolean,
  ) => {
    setForm((old) => ({ ...old, [field]: value }));
    setFieldErrors((old) => {
      const next = { ...old };
      delete next[field];
      return next;
    });
  };
  const validate = () => {
    const details: FieldErrors = {};
    if (!fullNameIsValid(form.displayName))
      details.displayName =
        "Names may contain letters, spaces, apostrophes, and hyphens only.";
    if (!form.identificationType)
      details.identificationType = "Select an identification type.";
    const identificationError = identificationNumberError(
      form.identificationType,
      form.identificationNumber,
    );
    if (identificationError)
      details.identificationNumber = identificationError;
    if (!/^07\d{8}$/.test(form.phoneNumber))
      details.phoneNumber =
        "Use a valid Rwanda mobile number: 07 followed by 8 digits.";
    if (
      form.identificationType === "OTHER_GOVERNMENT_ID" &&
      !identificationDocument &&
      identificationDocuments.length === 0
    )
      details.identificationDocument =
        "Upload the selected government-issued identification document.";
    if (!form.educationLevel)
      details.educationLevel = "Select your level of education.";
    if (form.occupation.trim().length < 2)
      details.occupation = "Enter your occupation or area of work.";
    if (form.yearsOfExperience < 0 || form.yearsOfExperience > 60)
      details.yearsOfExperience = "Enter a value between 0 and 60.";
    if (!form.province) details.province = "Select a Province.";
    if (!form.district) details.district = "Select a District.";
    if (!form.administrativeSector)
      details.administrativeSector = "Select a Sector.";
    return details;
  };
  const persistProfile = async () => {
    if (identificationDocument) {
      const body = new FormData();
      body.append("file", identificationDocument);
      const uploaded = await request<(typeof identificationDocuments)[number]>(
        "/api/v1/users/me/profile/evidence",
        { method: "POST", body },
      );
      setIdentificationDocuments((current) => [uploaded, ...current]);
      setIdentificationDocument(null);
    }
    await request("/api/v1/users/me/profile", {
      method: "PUT",
      body: JSON.stringify(form),
    });
  };
  const save = async () => {
    const details = validate();
    if (Object.keys(details).length) {
      setFieldErrors(details);
      setError("Correct the highlighted profile fields.");
      focusFirstError(details, "profile");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await persistProfile();
      await refreshWorkspace();
      notify(`${friendlyRole(user?.role)} profile saved.`);

    } catch (cause) {
      const apiErrors = errorsFrom(cause);
      setFieldErrors(apiErrors);
      setError(messageOf(cause));
      focusFirstError(apiErrors, "profile");
    } finally {
      setBusy(false);
    }
  };
  const submitForReview = async () => {
    const details = validate();
    if (Object.keys(details).length) {
      setFieldErrors(details);
      setError("Correct the highlighted profile fields before submitting.");
      focusFirstError(details, "profile");
      return;
    }
    setBusy(true);
    setError("");
    setFieldErrors({});
    try {
      await persistProfile();
      await request("/api/v1/users/me/profile/submit", {
        method: "POST",
        body: "{}",
      });
      await refreshWorkspace();
      setSubmitted(true);
    } catch (cause) {
      const apiErrors = errorsFrom(cause);
      setFieldErrors(apiErrors);
      setError(messageOf(cause));
      focusFirstError(apiErrors, "profile");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow={`${friendlyRole(user?.role)} account`}
        title={`Complete your ${friendlyRole(user?.role)} profile`}
        description="Provide the identity, contact, location, education, and professional information the System Administrator needs to review your account."
      />

      {user?.approvalStatus === "REJECTED" && (
        <ProfileNotice>
          <CircleAlert />
          <span>
            <strong>Changes requested</strong>Update the information below, save
            it, and submit the profile again for review.
          </span>
        </ProfileNotice>
      )}
      {!user?.profileComplete && (
        <ProfileNotice>
          <ShieldCheck />
          <span>
            <strong>Profile required</strong>Complete and save this form before
            submitting it for administrator review.
          </span>
        </ProfileNotice>
      )}
      {error && (
        <ValidationSummary role="alert" aria-live="assertive">
          <CircleAlert />
          <div>
            <strong>{error}</strong>
            {Object.keys(fieldErrors).length > 0 && (
              <ul>
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>
                    <button
                      onClick={() =>
                        document.getElementById(`profile-${field}`)?.focus()
                      }
                    >
                      {message}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ValidationSummary>
      )}
      <Panel>
        <PanelHeader>
          <div>
            <h2>Personal and contact information</h2>
            <p>
              Fields marked by the form are required unless identified as
              optional.
            </p>
          </div>
        </PanelHeader>
        <PanelBody>
          <FormGrid>
            <Field label="Names" error={fieldErrors.displayName}>
              <Input
                id="profile-displayName"
                value={form.displayName}
                placeholder="Enter your names as shown on your identification"
                autoComplete="name"
                onChange={(e) => update("displayName", e.target.value)}
              />
            </Field>
            <Field label="Email address">
              <Input
                value={user?.email ?? ""}
                type="email"
                readOnly
                aria-readonly="true"
              />
            </Field>
            <Field
              label="Identification type"
              error={fieldErrors.identificationType}
            >
              <Select
                id="profile-identificationType"
                value={form.identificationType}
                onChange={(e) => {
                  update("identificationType", e.target.value);
                  update("identificationNumber", "");
                }}
              >
                <option value="">Select identification type</option>
                <option value="NATIONAL_ID">Rwanda National ID</option>
                <option value="PASSPORT">Passport</option>
                <option value="OTHER_GOVERNMENT_ID">
                  Other government-issued ID
                </option>
              </Select>
            </Field>
            <Field
              label="Identification number"
              error={fieldErrors.identificationNumber}
            >
              <Input
                id="profile-identificationNumber"
                value={form.identificationNumber}
                inputMode={
                  form.identificationType === "NATIONAL_ID"
                    ? "numeric"
                    : "text"
                }
                maxLength={
                  form.identificationType === "NATIONAL_ID"
                    ? 16
                    : form.identificationType === "PASSPORT"
                      ? 20
                      : 30
                }
                placeholder={
                  form.identificationType === "NATIONAL_ID"
                    ? "16-digit Rwanda National ID"
                    : form.identificationType === "PASSPORT"
                      ? "Letters and numbers"
                      : "Enter the number exactly as issued"
                }
                onChange={(e) => {
                  const value =
                    form.identificationType === "NATIONAL_ID"
                      ? e.target.value.replace(/\D/g, "")
                      : form.identificationType === "PASSPORT"
                        ? e.target.value.replace(/[^A-Za-z\d]/g, "").toUpperCase()
                        : e.target.value.replace(/[^A-Za-z\d /-]/g, "");
                  update("identificationNumber", value);
                }}
              />
            </Field>
            {form.identificationType === "OTHER_GOVERNMENT_ID" && (
              <Field
                label="Identification document"
                hint="Required for other government-issued identification. PDF, DOCX, JPG, PNG, or WEBP."
                error={fieldErrors.identificationDocument}
              >
                <Input
                  id="profile-identificationDocument"
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={(event) => {
                    setIdentificationDocument(event.target.files?.[0] ?? null);
                    setFieldErrors((current) => ({
                      ...current,
                      identificationDocument: "",
                    }));
                  }}
                />
                {identificationDocuments.length > 0 && (
                  <small>
                    {identificationDocuments.length} document
                    {identificationDocuments.length === 1 ? "" : "s"} already
                    uploaded.
                  </small>
                )}
              </Field>
            )}
            <Field label="Phone number" error={fieldErrors.phoneNumber}>
              <Input
                id="profile-phoneNumber"
                value={form.phoneNumber}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                placeholder="07XXXXXXXX"
                onChange={(e) =>
                  update("phoneNumber", e.target.value.replace(/\D/g, ""))
                }
              />
            </Field>
            <Field
              label="Level of education"
              error={fieldErrors.educationLevel}
            >
              <Select
                id="profile-educationLevel"
                value={form.educationLevel}
                onChange={(e) => update("educationLevel", e.target.value)}
              >
                <option value="">Select education level</option>
                {data?.taxonomies.educationLevels.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field
              label="Occupation or area of work"
              error={fieldErrors.occupation}
            >
              <Input
                id="profile-occupation"
                value={form.occupation}
                placeholder="Example: Agricultural technician"
                onChange={(e) => update("occupation", e.target.value)}
              />
            </Field>
            <Field
              label="Years of relevant experience (optional)"
              error={fieldErrors.yearsOfExperience}
            >
              <Input
                id="profile-yearsOfExperience"
                type="number"
                min="0"
                max="60"
                value={form.yearsOfExperience}
                onChange={(e) =>
                  update("yearsOfExperience", Number(e.target.value))
                }
              />
            </Field>
            <Field label="Province" error={fieldErrors.province}>
              <Select
                id="profile-province"
                value={form.province}
                onChange={(e) => {
                  setForm({
                    ...form,
                    province: e.target.value,
                    district: "",
                    administrativeSector: "",
                  });
                  setFieldErrors((old) => ({
                    ...old,
                    province: "",
                    district: "",
                    administrativeSector: "",
                  }));
                }}
              >
                <option value="">Select Province</option>
                {Object.keys(locations).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="District" error={fieldErrors.district}>
              <Select
                id="profile-district"
                value={form.district}
                disabled={!form.province}
                onChange={(e) => {
                  setForm({
                    ...form,
                    district: e.target.value,
                    administrativeSector: "",
                  });
                  setFieldErrors((old) => ({
                    ...old,
                    district: "",
                    administrativeSector: "",
                  }));
                }}
              >
                <option value="">Select District</option>
                {districts.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Sector" error={fieldErrors.administrativeSector}>
              <Select
                id="profile-administrativeSector"
                value={form.administrativeSector}
                disabled={!form.district}
                onChange={(e) => update("administrativeSector", e.target.value)}
              >
                <option value="">Select Sector</option>
                {sectors.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </Select>
            </Field>
            <Field label="Organization or cooperative (optional)">
              <Input
                value={form.organization}
                placeholder="Leave blank if you work independently"
                onChange={(e) =>
                  setForm({ ...form, organization: e.target.value })
                }
              />
            </Field>
            <Field label="Preferred language">
              <Select
                value={form.preferredLanguage}
                onChange={(e) =>
                  setForm({ ...form, preferredLanguage: e.target.value })
                }
              >
                <option value="en">English</option>
                <option value="rw">Kinyarwanda</option>
              </Select>
            </Field>
          </FormGrid>
          <Setting>
            <span>
              <strong>
                Show my {friendlyRole(user?.role)} identity on
                published work

              </strong>
              <small>
                Private identification and phone details are never public.
              </small>
            </span>
            <input
              type="checkbox"
              checked={form.publicProfile}
              onChange={(e) =>
                setForm({ ...form, publicProfile: e.target.checked })
              }
            />
          </Setting>
          <Actions>
            <Button disabled={busy} onClick={save}>
              <Save />
              {busy ? "Saving..." : "Save profile"}
            </Button>
            {user?.profileComplete && user.approvalStatus !== "APPROVED" && (
              <Button disabled={busy} onClick={submitForReview}>
                <ShieldCheck />
                Submit profile for review
              </Button>
            )}
          </Actions>
        </PanelBody>
      </Panel>
      {submitted && (
        <ModalBackdrop role="presentation">
          <Modal
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-submitted-title"
          >
            <PanelBody>
              <ShieldCheck size={34} />
              <h2 id="review-submitted-title">Your profile is under review</h2>
              <p>
                Your information was submitted successfully. Please wait for the
                System Administrator to approve your{" "}
                {friendlyRole(user?.role)} account.
              </p>
              <Actions>
                <Button
                  onClick={async () => {
                    setSubmitted(false);
                    await refreshWorkspace();
                  }}
                >
                  Continue
                </Button>
              </Actions>
            </PanelBody>
          </Modal>
        </ModalBackdrop>
      )}
    </>
  );
}

function ConfirmationDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <ModalBackdrop role="presentation">
      <Modal role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <PanelHeader>
          <div>
            <h2 id="decision-title">{title}</h2>
            <p>{message}</p>
          </div>
          <button aria-label="Close" onClick={onCancel}>
            <X />
          </button>
        </PanelHeader>
        <PanelBody>
          <Actions>
            <Button $variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              autoFocus
              $variant={danger ? "danger" : "primary"}
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await onConfirm();
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving..." : confirmLabel}
            </Button>
          </Actions>
        </PanelBody>
      </Modal>
    </ModalBackdrop>
  );
}

function LoadingPanel() {
  return (
    <Panel>
      <PanelBody>
        <p>Loading current records...</p>
      </PanelBody>
    </Panel>
  );
}
function NotFoundSection() {
  return (
    <EmptyState
      title="Page not found"
      copy="Choose a section from the workspace navigation."
    />
  );
}
const downloadCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) => {
  const safeCell = (value: string | number) => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  const csv = [headers, ...rows]
    .map((row) => row.map(safeCell).join(","))
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
const messageOf = (cause: unknown) =>
  cause instanceof Error
    ? cause.message
    : "The request could not be completed.";
const friendlyRole = (role: Role | null | undefined): string =>
  (!role ? "" : ({
    SYSTEM_ADMINISTRATOR: "System Administrator",
    INNOVATOR: "Innovator",
    EXPERT: "Expert",
    INVESTOR_PARTNER: "Investor / Industry Partner",
  })[role] ?? "");

const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("en-RW", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Not dated";

const Shell = styled.div`
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  background: ${palette.paper};
  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;
const SkipLink = styled.a`
  position: fixed;
  left: 16px;
  top: -60px;
  z-index: 100;
  background: white;
  padding: 10px 14px;
  border-radius: 8px;
  &:focus {
    top: 12px;
  }
`;
const Sidebar = styled.aside<{ $open: boolean }>`
  position: sticky;
  top: 0;
  height: 100dvh;
  overflow-y: auto;
  background: ${palette.ink};
  color: white;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  z-index: 40;
  @media (max-width: 960px) {
    position: fixed;
    width: 280px;
    left: ${({ $open }) => ($open ? "0" : "-300px")};
    transition: left 0.2s ease;
  }
`;
const SidebarHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 6px 18px;
  border-bottom: 1px solid #ffffff1f;
  a span {
    color: white;
  }
  button {
    display: none;
    color: white;
    background: transparent;
    border: 0;
    min-width: 44px;
    min-height: 44px;
    @media (max-width: 960px) {
      display: grid;
      place-items: center;
    }
  }
`;
const Identity = styled.div`
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
  align-items: center;
  padding: 18px 6px;
  span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  strong {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 14px;
  }
  small {
    color: #b7cbc6;
    font-size: 12px;
    line-height: 1.45;
  }
`;
const Avatar = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: ${palette.lime};
  color: ${palette.greenDark};
  display: grid;
  place-items: center;
  font-weight: 800;
`;
const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 4px;
  a {
    min-height: 48px;
    border-radius: 10px;
    padding: 0 12px;
    display: grid;
    grid-template-columns: 22px 1fr 16px;
    align-items: center;
    gap: 9px;
    color: #bcd0cb;
    font-size: 15px;
    font-weight: 600;
  }
  svg {
    width: 17px;
  }
  a.active,
  a:hover {
    background: #0f7867;
    color: white;
  }
  a svg:last-child {
    opacity: 0.5;
  }
`;
const SidebarFoot = styled.div`
  margin-top: auto;
  border-top: 1px solid #ffffff1f;
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  a,
  button {
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 10px;
    color: #bcd0cb;
    background: transparent;
    border: 0;
    text-align: left;
  }
  svg {
    width: 17px;
  }
`;
const Workspace = styled.div`
  min-width: 0;
`;
const Topbar = styled.header`
  height: 84px;
  background: white;
  border-bottom: 1px solid ${palette.line};
  position: sticky;
  top: 0;
  z-index: 20;
  padding: 0 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  > button {
    display: none;
    border: 0;
    background: transparent;
    min-width: 44px;
    min-height: 44px;
    @media (max-width: 960px) {
      display: grid;
      place-items: center;
    }
  }
  > div {
    display: flex;
    flex-direction: column;
  }
  span {
    font-size: 15px;
    font-weight: 700;
  }
  small {
    color: ${palette.muted};
    font-size: 13px;
  }
  > a {
    min-width: 44px;
    min-height: 44px;
    display: grid;
    place-items: center;
    color: ${palette.green};
  }
  @media (max-width: 600px) {
    padding: 0 14px;
  }
`;
const Content = styled.main`
  padding: 38px clamp(16px, 3vw, 44px) 72px;
  max-width: 1500px;
  width: 100%;
  margin: auto;
`;
const ManagementHeader = styled.header`
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr) auto;
  gap: 28px;
  align-items: center;
  margin-bottom: 32px;
  @media (max-width: 760px) {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 16px;
  }
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;
const ManagementIcon = styled.div`
  width: 88px;
  height: 88px;
  display: grid;
  place-items: center;
  border: 1px solid #cde6da;
  border-radius: 16px;
  color: ${palette.green};
  background: linear-gradient(145deg, #f0faf5, #e2f4ec);
  svg {
    width: 34px;
    height: 34px;
    stroke-width: 1.8;
  }
  @media (max-width: 760px) {
    width: 64px;
    height: 64px;
    svg {
      width: 28px;
      height: 28px;
    }
  }
`;
const ManagementHeading = styled.div`
  min-width: 0;
  h1 {
    margin: 6px 0 8px;
    color: #0d1f2d;
    font-size: clamp(28px, 3vw, 38px);
    line-height: 1.12;
    letter-spacing: -0.04em;
  }
  p {
    max-width: 700px;
    margin: 0;
    color: #415466;
    font-size: 16px;
    line-height: 1.55;
  }
`;
const ManagementActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  @media (max-width: 760px) {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
  @media (max-width: 520px) {
    align-items: stretch;
    flex-direction: column;
    a,
    button {
      width: 100%;
    }
  }
`;
const AdminDataPanel = styled(Panel)`
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 12px 34px rgba(16, 42, 39, 0.07);
`;
const DataToolbar = styled.div`
  min-height: 96px;
  padding: 20px 24px;
  border-bottom: 1px solid ${palette.line};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  @media (max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;
const SearchControl = styled.label`
  min-width: min(390px, 100%);
  height: 50px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border: 1px solid #cfdad5;
  border-radius: 10px;
  background: white;
  color: #526779;
  &:focus-within {
    border-color: ${palette.green};
    box-shadow: 0 0 0 3px #0b62551a;
  }
  svg {
    width: 20px;
    height: 20px;
    flex: none;
  }
  input {
    min-height: 46px;
    padding: 0;
    border: 0;
    box-shadow: none;
    outline: none !important;
    background: transparent;
    font-size: 16px;
  }
`;
const ToolbarFilters = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  select {
    width: auto;
    min-width: 170px;
    min-height: 50px;
    font-size: 16px;
  }
  @media (max-width: 900px) {
    justify-content: flex-start;
  }
  @media (max-width: 560px) {
    select {
      width: 100%;
    }
  }
`;
const ManagementTable = styled(Table)`
  min-width: 1160px;
  th {
    padding: 16px 18px;
    color: #293b49;
    font-size: 12px;
    font-weight: 800;
  }
  td {
    padding: 18px;
    color: #243746;
    font-size: 14px;
    line-height: 1.45;
  }
  tbody tr {
    transition: background 180ms ease;
  }
`;
const InnovationManagementTable = styled(ManagementTable)`
  min-width: 1240px;
  table-layout: fixed;
  th:nth-of-type(1) {
    width: 190px;
  }
  th:nth-of-type(2) {
    width: 130px;
  }
  th:nth-of-type(3) {
    width: 100px;
  }
  th:nth-of-type(4) {
    width: 170px;
  }
  th:nth-of-type(5) {
    width: 110px;
  }
  th:nth-of-type(6) {
    width: 125px;
  }
  th:nth-of-type(7) {
    width: 115px;
  }
  th:nth-of-type(8) {
    width: 120px;
  }
  th:nth-of-type(9) {
    width: 180px;
  }
  td {
    overflow-wrap: anywhere;
  }
  td:nth-of-type(7) select {
    min-width: 105px;
  }
`;
const UserManagementTable = styled(ManagementTable)`
  min-width: 1030px;
  table-layout: fixed;
  th:nth-of-type(1) {
    width: 235px;
  }
  th:nth-of-type(2) {
    width: 175px;
  }
  th:nth-of-type(3) {
    width: 170px;
  }
  th:nth-of-type(4) {
    width: 130px;
  }
  th:nth-of-type(5) {
    width: 120px;
  }
  th:nth-of-type(6) {
    width: 120px;
  }
  th:nth-of-type(7) {
    width: 120px;
  }
  td {
    overflow-wrap: anywhere;
  }
`;
const IdentityCell = styled.div`
  min-width: 210px;
  display: flex;
  align-items: center;
  gap: 12px;
  span {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  strong {
    color: #102a27;
    font-size: 15px;
  }
  small {
    color: #526779;
    font-size: 13px;
  }
`;
const RowAvatar = styled.span`
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  display: grid !important;
  place-items: center;
  border-radius: 50%;
  background: ${palette.soft};
  color: ${palette.green};
  font-size: 14px;
  font-weight: 800;
`;
const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: max-content;
`;
const IconButtonLink = styled(ButtonLink)`
  width: 44px;
  padding: 0;
  border-color: #cfdad5;
  background: white;
  svg {
    width: 19px;
    height: 19px;
  }
`;
const IconButton = styled(Button)`
  width: 44px;
  padding: 0;
  border-color: #cfdad5;
  background: white;
  color: ${palette.ink};
  svg {
    width: 19px;
    height: 19px;
  }
`;
const TableFooter = styled.footer`
  min-height: 66px;
  padding: 16px 24px;
  border-top: 1px solid ${palette.line};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #415466;
  font-size: 14px;
  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;
const TableTitle = styled.div`
  min-width: 190px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  strong {
    color: #102a27;
    font-size: 15px;
  }
  small {
    color: #526779;
    font-size: 13px;
  }
  a {
    margin-top: 3px;
    font-size: 13px;
  }
`;
const CategoryPill = styled.span`
  display: inline-flex;
  width: max-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: ${palette.soft};
  color: ${palette.greenDark};
  font-size: 12px;
  font-weight: 700;
`;
const AssignedExpert = styled.div`
  min-width: 180px;
  display: flex;
  align-items: center;
  gap: 10px;
  > span:last-child {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-size: 14px;
  }
  small {
    color: #526779;
    font-size: 12px;
  }
`;
const MutedText = styled.span`
  color: #526779;
`;
const CompletionCell = styled.div`
  min-width: 110px;
  display: grid;
  gap: 7px;
  span {
    font-variant-numeric: tabular-nums;
  }
`;
const ProgressTrack = styled.span`
  width: 100%;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: #dfe9e4;
  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: ${palette.green};
  }
`;
const RowActionButton = styled(Button)`
  padding: 0 12px;
  white-space: nowrap;
  font-size: 13px;
  svg {
    width: 17px;
    height: 17px;
  }
`;
const LockedAssignment = styled.span`
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 11px;
  border: 1px solid #cfdad5;
  border-radius: 9px;
  color: #526779;
  background: #f4f7f5;
  font-size: 13px;
  font-weight: 700;
  svg {
    width: 16px;
    height: 16px;
  }
`;
const AssignmentLock = styled.div`
  margin: 22px 0;
  min-height: 76px;
  padding: 16px 18px;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border: 1px solid #b9d9ca;
  border-radius: 12px;
  background: ${palette.soft};
  color: ${palette.greenDark};
  > svg {
    width: 22px;
  }
  span {
    display: flex;
    flex-direction: column;
  }
  small {
    color: #415466;
    font-size: 13px;
  }
`;
const AssignmentNotice = styled.div`
  margin-bottom: 20px;
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 24px 1fr;
  gap: 10px;
  border: 1px solid #d9c58f;
  border-radius: 10px;
  background: ${palette.warningSoft};
  color: #694006;
  span {
    display: flex;
    flex-direction: column;
  }
  small {
    font-size: 13px;
  }
`;
const Scrim = styled.div<{ $open: boolean }>`
  display: none;
  @media (max-width: 960px) {
    display: ${({ $open }) => ($open ? "block" : "none")};
    position: fixed;
    inset: 0;
    background: #071e1b99;
    z-index: 30;
  }
`;
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
  h2 {
    font-size: 18px;
    margin: 13px 0 5px;
  }
  p {
    color: ${palette.muted};
    font-size: 13px;
  }
  small {
    color: ${palette.muted};
  }
  @media (max-width: 1000px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const PartnerSearch = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: ${palette.paper};
  border: 1px solid ${palette.line};
  border-radius: 12px;
  padding: 8px 12px;
  margin-bottom: 22px;
  svg {
    color: ${palette.green};
    flex: none;
  }
  input {
    border: 0;
    box-shadow: none;
    background: transparent;
  }
`;
const RecordList = styled.div`
  > a,
  > div,
  > button {
    min-height: 68px;
    padding: 13px 18px;
    border-bottom: 1px solid ${palette.line};
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 12px;
    align-items: center;
    &:last-child {
      border: 0;
    }
  }
  > button {
    width: 100%;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    grid-template-columns: auto 1fr auto auto;
    &:hover {
      background: ${palette.soft};
    }
  }
  span {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-size: 13px;
  }
  small {
    color: ${palette.muted};
    font-size: 11px;
  }
  svg {
    width: 17px;
    color: ${palette.green};
  }
  code {
    font-size: 10px;
    color: ${palette.muted};
  }
`;
const Meta = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${palette.muted};
  font-size: 11px;
  margin: 15px 0;
`;
const DraftRecovery = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 18px;
  padding: 16px 18px;
  border: 1px solid #b2ddff;
  background: ${palette.infoSoft};
  border-radius: 12px;
  span {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  strong {
    font-size: 14px;
  }
  small {
    color: ${palette.info};
  }
  @media (max-width: 620px) {
    align-items: stretch;
    flex-direction: column;
  }
`;
const StatusLine = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  color: ${palette.muted};
  font-size: 13px;
`;
const ErrorBox = styled.div`
  padding: 13px 15px;
  margin-bottom: 18px;
  border: 1px solid #fecdca;
  background: ${palette.dangerSoft};
  color: ${palette.danger};
  border-radius: 10px;
`;
const ValidationSummary = styled.div`
  display: grid;
  grid-template-columns: 22px 1fr;
  gap: 10px;
  padding: 14px 16px;
  margin-bottom: 18px;
  border: 1px solid #fda29b;
  background: ${palette.dangerSoft};
  color: ${palette.danger};
  border-radius: 10px;
  svg {
    margin-top: 1px;
  }
  strong {
    display: block;
  }
  ul {
    margin: 8px 0 0;
    padding-left: 18px;
  }
  button {
    border: 0;
    background: transparent;
    color: ${palette.danger};
    padding: 2px 0;
    text-align: left;
    text-decoration: underline;
    font-weight: 650;
  }
`;
const LocalSaveNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 13px 15px;
  border: 1px solid #a6f4c5;
  background: #ecfdf3;
  color: ${palette.success};
  border-radius: 10px;
  span {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }
  strong {
    font-size: 13px;
  }
`;
const ProfileNotice = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding: 14px 16px;
  border: 1px solid #b2ddff;
  background: ${palette.infoSoft};
  color: ${palette.info};
  border-radius: 10px;
  span {
    display: flex;
    flex-direction: column;
    font-size: 12px;
  }
  strong {
    font-size: 13px;
  }
`;
const Declarations = styled.div<{ $invalid?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 18px;
  padding: 16px;
  background: ${({ $invalid }) =>
    $invalid ? palette.dangerSoft : palette.soft};
  border: ${({ $invalid }) =>
    $invalid ? "1px solid #fda29b" : "1px solid transparent"};
  border-radius: 10px;
  label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }
  input {
    margin-top: 5px;
  }
`;
const InlineError = styled.small`
  color: ${palette.danger};
  font-weight: 700;
  margin: 0 0 3px 26px;
`;
const SectionTitle = styled.h3`
  font-size: 14px;
  margin: 24px 0 12px;
  padding-top: 20px;
  border-top: 1px solid ${palette.line};
  &:first-of-type {
    margin-top: 0;
    padding-top: 0;
    border-top: 0;
  }
`;
const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 20px;
  td & {
    margin-top: 0;
    justify-content: flex-start;
    align-items: center;
  }
`;
const AdminForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;
const CheckLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 13px;
  font-weight: 650;
  input {
    width: 18px;
    height: 18px;
  }
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  margin: 20px 0;
  overflow: hidden;
  border: 1px solid ${palette.line};
  border-radius: 10px;
  background: ${palette.line};
  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;
const DetailItem = styled.div`
  min-width: 0;
  padding: 14px;
  background: white;
  display: flex;
  flex-direction: column;
  gap: 4px;
  small {
    color: ${palette.muted};
    font-size: 11px;
  }
  strong {
    font-size: 13px;
    overflow-wrap: anywhere;
  }
`;
const NarrativeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 20px;
  section {
    padding: 16px;
    border: 1px solid ${palette.line};
    border-radius: 10px;
    background: ${palette.paper};
  }
  h3 {
    margin: 0 0 6px;
    font-size: 13px;
  }
  p {
    margin: 0;
    color: ${palette.muted};
    white-space: pre-wrap;
  }
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const SectionBlock = styled.section`
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid ${palette.line};
  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
  > p {
    color: ${palette.muted};
  }
`;
const MaterialGroup = styled.div`
  & + & {
    border-top: 1px solid ${palette.line};
    margin-top: 22px;
    padding-top: 22px;
  }
  h3 {
    font-size: 14px;
    margin: 0 0 4px;
  }
  p {
    color: ${palette.muted};
    font-size: 12px;
    margin: 0 0 16px;
  }
`;
const AttachmentNotice = styled.div`
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 13px 14px;
  margin-bottom: 16px;
  border: 1px solid #b2ddff;
  background: ${palette.infoSoft};
  border-radius: 10px;
  color: ${palette.info};
  span {
    display: flex;
    flex-direction: column;
  }
  strong {
    font-size: 13px;
  }
  small {
    font-size: 11px;
  }
  @media (max-width: 680px) {
    grid-template-columns: 24px 1fr;
    button {
      grid-column: 1/-1;
    }
  }
`;
const LinkForm = styled.div`
  display: grid;
  grid-template-columns: minmax(160px, 0.7fr) minmax(240px, 1.3fr) auto;
  gap: 10px;
  align-items: start;
  margin-bottom: 18px;
  button {
    margin-top: 20px;
  }
  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    button {
      margin-top: 0;
    }
  }
`;
const UploadRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 210px auto;
  gap: 10px;
  align-items: start;
  margin-bottom: 18px;
  button {
    margin-top: 20px;
  }
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    button {
      margin-top: 0;
    }
  }
`;
const FileList = styled.div`
  > div {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    gap: 10px;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid ${palette.line};
  }
  svg {
    color: ${palette.green};
  }
  span {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  strong {
    font-size: 13px;
  }
  small {
    color: ${palette.muted};
    font-size: 11px;
    overflow-wrap: anywhere;
  }
  a {
    color: ${palette.green};
    font-weight: 700;
    font-size: 12px;
  }
  button {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
  }
`;
const DecisionReason = styled.div`
  margin-top: 14px;
  padding: 10px;
  background: ${palette.paper};
  border-radius: 8px;
  font-size: 12px;
  color: ${palette.muted};
`;
const InlineForm = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr auto;
  gap: 10px;
  @media (max-width: 650px) {
    grid-template-columns: 1fr;
  }
`;
const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
  align-items: flex-end;
`;

const TaxonomyGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  button {
    border: 1px solid ${palette.line};
    background: ${palette.soft};
    color: ${palette.green};
    padding: 7px 9px;
    border-radius: 8px;
    font-weight: 700;
    display: flex;
    gap: 6px;
    align-items: center;
  }
  button.inactive {
    opacity: 0.55;
    background: white;
  }
  small {
    font-size: 9px;
    font-weight: 500;
  }
`;
const TaxonomyItem = styled.div`
  border: 1px solid ${palette.line};
  border-radius: 8px;
  background: ${palette.soft};
  &.inactive { opacity: 0.55; background: white; }
`;
const TaxonomyItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  .label-toggle {
    flex: 1;
    padding: 7px 9px;
    text-align: left;
    font-weight: 700;
    color: ${palette.green};
    display: flex;
    gap: 6px;
    align-items: center;
    background: none;
    border: none;
    cursor: pointer;
    small { font-size: 9px; font-weight: 500; }
  }
`;
const TaxonomyActions = styled.div`
  display: flex;
  gap: 2px;
  padding: 4px;
  .icon-btn {
    padding: 5px;
    border: none;
    background: none;
    border-radius: 6px;
    cursor: pointer;
    color: ${palette.muted};
    &:hover { background: ${palette.line}; color: ${palette.ink}; }
    &.danger:hover { color: #c0392b; }
  }
`;
const TaxonomyEditRow = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  padding: 4px;
  input { flex: 1; }
`;

const CriteriaBuilder = styled.div`
  display: grid;
  gap: 12px;
  margin-top: 22px;
`;
const CriterionEditor = styled.section`
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  border: 1px solid ${palette.line};
  border-radius: 12px;
  background: ${palette.paper};
`;
const CriterionNumber = styled.span`
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  background: ${palette.green};
  color: white;
  font-weight: 800;
`;
const CriterionFields = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(240px, 1.5fr) 120px;
  gap: 12px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;
const CriteriaBuilderFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;
const WeightSummary = styled.div<{ $valid: boolean }>`
  display: flex;
  flex-direction: column;
  color: ${({ $valid }) => ($valid ? palette.green : palette.danger)};
  span {
    color: ${palette.muted};
    font-size: 12px;
  }
`;
const CriteriaCardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  > div:first-of-type {
    min-width: 0;
  }
  button {
    flex: none;
  }
  @media (max-width: 520px) {
    flex-direction: column;
  }
`;
const ActiveCriteriaMark = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: 9px;
  background: ${palette.successSoft};
  color: ${palette.green};
  font-size: 12px;
  font-weight: 800;
  svg {
    width: 17px;
    height: 17px;
  }
`;
const CriteriaList = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 14px;
  > div {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    border-top: 1px solid ${palette.line};
    padding: 10px 0;
    font-size: 12px;
  }
  span {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  small {
    line-height: 1.45;
  }
`;
const CriteriaVersionMeta = styled.p`
  margin: 14px 0 0;
  padding-top: 12px;
  border-top: 1px solid ${palette.line};
`;
const ReportPre = styled.pre`
  white-space: pre-wrap;
  background: ${palette.ink};
  color: #d9e9df;
  border-radius: 14px;
  padding: 24px;
  overflow: auto;
  font-size: 13px;
`;
const ReportGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;
const ReportMeta = styled.p`
  color: ${palette.muted};
  font-size: 13px;
  margin-bottom: 12px;
`;
const ReportTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  th {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 2px solid ${palette.line};
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${palette.muted};
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid ${palette.line};
  }
  tr:last-child td {
    border-bottom: none;
  }
`;


const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 720px);
  gap: 16px;
`;
const Setting = styled.label`
  min-height: 66px;
  border-bottom: 1px solid ${palette.line};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  span {
    display: flex;
    flex-direction: column;
  }
  small {
    color: ${palette.muted};
  }
  input {
    width: 22px;
    height: 22px;
  }
`;
const Unread = styled.b`
  padding: 4px 7px;
  border-radius: 999px;
  background: ${palette.soft};
  color: ${palette.green};
  font-size: 10px;
`;
const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: #071e1b99;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
`;
const Modal = styled(Panel)`
  width: min(560px, 100%);
  max-height: calc(100dvh - 36px);
  overflow-y: auto;
  box-shadow: 0 24px 70px #071e1b55;
  > div:first-of-type button {
    min-width: 44px;
    min-height: 44px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
  }
`;
const WideModal = styled(Modal)`
  width: min(920px, 100%);
`;
const UserEditorModal = styled(Modal)`
  width: min(760px, 100%);
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
  @media (max-width: 680px) {
    input,
    select {
      font-size: 16px;
    }
  }
`;
