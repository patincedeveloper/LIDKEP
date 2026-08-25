import { useMemo, useState } from "react";
import styled from "@emotion/styled";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  FileText,
  Filter,
  HeartHandshake,
  Layers,
  LayoutDashboard,
  Leaf,
  LogOut,
  MapPin,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { usePlatform } from "../api";
import { palette } from "../styles";
import type { Innovation, Role } from "../types";

const roleWorkspace: Record<Role, string> = {
  SYSTEM_ADMINISTRATOR: "admin",
  INNOVATOR: "innovator",
  EXPERT: "expert",
  INVESTOR_PARTNER: "partner",
};

import {
  fullNameIsValid,
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
  Select,
  StatCard,
  StatGrid,
  StatusBadge,
  Textarea,
} from "../ui";

export function PublicHeader() {
  const { user, logout } = usePlatform();
  return (
    <PublicNav>
      <Brand />
      <nav>
        <Link to="/">Home</Link>
        {user && <Link to="/discover">Discover</Link>}
        <Link to="/about">How it works</Link>
        {user && (
          <Link to={`/${roleWorkspace[user.role]}/dashboard`}>
            My Workspace
          </Link>
        )}
      </nav>
      <div>
        {user ? (
          <>
            <ButtonLink
              to={`/${roleWorkspace[user.role]}/dashboard`}
              $variant="secondary"
            >
              <LayoutDashboard size={15} /> Dashboard
            </ButtonLink>
            <Button
              $variant="quiet"
              onClick={() => void logout()}
              title="Sign out"
            >
              <LogOut size={15} /> Sign out
            </Button>
          </>
        ) : (
          <>
            <ButtonLink to="/login" $variant="quiet">
              Sign in
            </ButtonLink>
            <ButtonLink to="/register">
              Get started <ArrowRight size={16} />
            </ButtonLink>
          </>
        )}
      </div>
    </PublicNav>
  );
}


export function HomePage() {
  const { user } = usePlatform();

  return (
    <HomeRoot>
      <PublicHeader />
      <main>
        {/* HERO SECTION */}
        <HeroSection>
          <HeroContainer>
            <HeroContent>
              <HeroBadge>
                <Sparkles size={14} />
                <span>Rwanda Innovation Platform · Verified Local Discovery</span>
              </HeroBadge>
              <h1>
                Local ideas. <em>Verified</em> solutions. Lasting impact.
              </h1>
              <p>
                A trusted national platform connecting Rwandan innovators, domain experts, administrators, and investors to discover, evaluate, and scale grassroots ingenuity across every sector.
              </p>
              <HeroActions>
                <ButtonLink
                  to={user ? `/${roleWorkspace[user.role]}/dashboard` : "/register"}
                >
                  {user ? "Go to Workspace" : "Submit Innovation"} <ArrowRight size={17} />
                </ButtonLink>
                <ButtonLink to={user ? "/discover" : "/about"} $variant="secondary">
                  {user ? "Explore Registry" : "How It Works"}
                </ButtonLink>
              </HeroActions>
              <HeroHighlights>
                <div>
                  <ShieldCheck size={18} />
                  <span>Immediate innovator access & draft workspace</span>
                </div>
                <div>
                  <Award size={18} />
                  <span>Objective multi-criteria expert scoring</span>
                </div>
              </HeroHighlights>
            </HeroContent>

            <HeroVisualCard>
              <HeroVisualImage src="/hero-green.jpg" alt="Rwanda innovation and sustainable development landscape" />
              <HeroFloatingTag>
                <HeroFloatingIcon>
                  <Sparkles size={20} />
                </HeroFloatingIcon>
                <div>
                  <strong>LIDKEP Innovation Hub</strong>
                  <small>Kigali, Rwanda · Verified National Knowledge Exchange</small>
                </div>
              </HeroFloatingTag>
            </HeroVisualCard>
          </HeroContainer>
        </HeroSection>

        {/* SERVICES / CORE CAPABILITIES SECTION (Inspired by Gardener sample UI) */}
        <ServiceSection>
          <ServiceSectionHeader>
            <Eyebrow>How LIDKEP Works</Eyebrow>
            <h2>A complete path from idea to verified scale</h2>
            <p>
              Structured workflows keep innovation ownership, expert evaluation, administrator publication, and partner collaboration transparent.
            </p>
          </ServiceSectionHeader>

          <ServiceGrid>
            <ServiceCard>
              <ServiceIconWrap>
                <FileText size={26} />
              </ServiceIconWrap>
              <h3>Innovation Documentation</h3>
              <p>
                Innovators capture local challenges, novel technical solutions, ownership declarations, and milestone evidence in structured, versioned drafts.
              </p>
              <ServiceLink to="/about">
                Read more <ArrowRight size={14} />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIconWrap>
                <ShieldCheck size={26} />
              </ServiceIconWrap>
              <h3>Expert Technical Review</h3>
              <p>
                Assigned domain specialists evaluate submissions against standardized criteria with transparent scoring, feedback notes, and revision guidance.
              </p>
              <ServiceLink to="/about">
                Read more <ArrowRight size={14} />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIconWrap>
                <Compass size={26} />
              </ServiceIconWrap>
              <h3>Multi-Sector Classification</h3>
              <p>
                Standardized categorization across Agriculture, Health, Renewable Energy, Water, ICT, Forestry, and Waste Management.
              </p>
              <ServiceLink to="/about">
                Read more <ArrowRight size={14} />
              </ServiceLink>
            </ServiceCard>

            <ServiceCard>
              <ServiceIconWrap>
                <HeartHandshake size={26} />
              </ServiceIconWrap>
              <h3>Partner & Investor Match</h3>
              <p>
                Verified institutional investors and industry partners discover validated projects and initiate transparent, non-binding collaborations.
              </p>
              <ServiceLink to="/about">
                Read more <ArrowRight size={14} />
              </ServiceLink>
            </ServiceCard>
          </ServiceGrid>
        </ServiceSection>

        {/* ABOUT / MISSION SECTION (Side-by-side with /eco-globe.jpg) */}
        <AboutMissionSection>
          <AboutMissionContainer>
            <AboutMissionCopy>
              <Eyebrow>About LIDKEP</Eyebrow>
              <h2>
                Empowering Rwanda's grassroots <em>innovators</em>.
              </h2>
              <p>
                Rwanda's socio-economic transformation is driven by local ingenuity. LIDKEP serves as the central bridge between grassroots inventors, technical specialists, and institutional supporters—ensuring promising local solutions are evidenced, objectively scored, and protected with immutable version history.
              </p>
              <MissionPoints>
                <MissionPoint>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Immediate Innovator Access</strong>
                    <p>Innovators create accounts and start drafting immediately without administrative waiting barriers.</p>
                  </div>
                </MissionPoint>
                <MissionPoint>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Objective Multi-Criteria Scoring</strong>
                    <p>Qualified experts assess problem relevance, solution quality, feasibility, impact potential, and evidence.</p>
                  </div>
                </MissionPoint>
                <MissionPoint>
                  <CheckCircle2 size={20} />
                  <div>
                    <strong>Consent-Controlled Partner Engagements</strong>
                    <p>Collaborations and funding inquiries are transparently managed with full innovator consent on contact reveals.</p>
                  </div>
                </MissionPoint>
              </MissionPoints>
              <ButtonLink to="/about" $variant="secondary">
                Learn more about our methodology <ArrowRight size={16} />
              </ButtonLink>
            </AboutMissionCopy>

            <AboutMissionVisual>
              <img src="/eco-globe.jpg" alt="Sustainable innovation and knowledge exchange" />
            </AboutMissionVisual>
          </AboutMissionContainer>
        </AboutMissionSection>

        {/* IMPACT NUMBERS BANNER (Dark Green container matching Gardener design) */}
        <NumbersBanner>
          <NumbersContainer>
            <NumbersHeader>
              <small>LIDKEP Registry Impact</small>
              <h3>Connecting local ingenuity across Rwanda</h3>
            </NumbersHeader>
            <NumbersGrid>
              <NumberItem>
                <strong>30</strong>
                <span>Districts & Coverage Levels</span>
              </NumberItem>
              <NumberItem>
                <strong>100%</strong>
                <span>Criteria Scored & Verified</span>
              </NumberItem>
              <NumberItem>
                <strong>4</strong>
                <span>Unified Stakeholder Roles</span>
              </NumberItem>
              <NumberItem>
                <strong>Active</strong>
                <span>Expert & Partner Network</span>
              </NumberItem>
            </NumbersGrid>
          </NumbersContainer>
        </NumbersBanner>

        {/* SHOWCASE SECTION ("A peak of our climate innovations" with image cards) */}
        <ShowcaseSection>
          <ShowcaseTop>
            <div>
              <Eyebrow>From the Registry</Eyebrow>
              <h2>Featured innovations worth knowing about</h2>
              <p>Real, evaluated solutions developed by local Rwandan innovators to solve authentic challenges.</p>
            </div>
            {user ? (
              <ButtonLink to="/discover" $variant="secondary">
                View full directory <ArrowRight size={16} />
              </ButtonLink>
            ) : (
              <ButtonLink to="/login" $variant="secondary">
                Sign in to view all <ArrowRight size={16} />
              </ButtonLink>
            )}
          </ShowcaseTop>

          <ShowcaseGrid>
            <ShowcaseCard>
              <ShowcaseImageWrap>
                <img src="/agri-solar.jpg" alt="Solar-powered terraced irrigation" />
                <ShowcaseTag>Agriculture & Food Security</ShowcaseTag>
              </ShowcaseImageWrap>
              <ShowcaseBody>
                <h3>Solar-Powered Terraced Drip Irrigation</h3>
                <p>Automated solar pumping and micro-irrigation system delivering water efficiently to terraced hillside farming cooperatives in Musanze.</p>
                <ShowcaseFoot>
                  <span><MapPin size={13} /> Northern Province</span>
                  <small>Status: Verified & Published</small>
                </ShowcaseFoot>
              </ShowcaseBody>
            </ShowcaseCard>

            <ShowcaseCard>
              <ShowcaseImageWrap>
                <img src="/community-solar.jpg" alt="Community solar microgrid" />
                <ShowcaseTag>Renewable Energy & Power</ShowcaseTag>
              </ShowcaseImageWrap>
              <ShowcaseBody>
                <h3>Community Solar Microgrid & Storage</h3>
                <p>Decentralized solar mini-grid with smart metering supplying clean, reliable energy to rural households and processing centers.</p>
                <ShowcaseFoot>
                  <span><MapPin size={13} /> Eastern Province</span>
                  <small>Status: Verified & Published</small>
                </ShowcaseFoot>
              </ShowcaseBody>
            </ShowcaseCard>

            <ShowcaseCallout>
              <Eyebrow>Registry Access</Eyebrow>
              <h3>Explore all verified Rwandan innovations</h3>
              <p>Sign in to browse complete technical briefs, evaluate evidence documents, and initiate partner collaborations.</p>
              <ButtonLink to={user ? "/discover" : "/register"}>
                {user ? "Browse Directory" : "Join the Registry"} <ArrowRight size={16} />
              </ButtonLink>
            </ShowcaseCallout>
          </ShowcaseGrid>
        </ShowcaseSection>

        {/* ECOSYSTEM ACTORS SECTION */}
        <RoleSection>
          <RoleSectionHeader>
            <Eyebrow>Ecosystem Architecture</Eyebrow>
            <h2>Built for every participant in the innovation ecosystem</h2>
            <p>Clear roles and structured permissions protect intellectual contribution while accelerating scale.</p>
          </RoleSectionHeader>
          <RoleGrid>
            <RoleCard>
              <span>01</span>
              <h3>Innovators</h3>
              <p>Immediate access to document solutions, upload evidence, declare ownership, respond to feedback, and manage partner requests.</p>
            </RoleCard>
            <RoleCard>
              <span>02</span>
              <h3>Technical Experts</h3>
              <p>Review assigned submissions, score against versioned criteria sets, and recommend approval or structured technical revisions.</p>
            </RoleCard>
            <RoleCard>
              <span>03</span>
              <h3>Investors & Partners</h3>
              <p>Discover vetted solutions, submit formal non-binding collaboration terms, and receive consented direct contacts.</p>
            </RoleCard>
            <RoleCard>
              <span>04</span>
              <h3>System Administrators</h3>
              <p>Oversee taxonomy, assign domain specialists, publish verified records, manage criteria versions, and export reports.</p>
            </RoleCard>
          </RoleGrid>
        </RoleSection>

        {/* CTA BANNER */}
        <CtaBanner>
          <CtaInner>
            <h2>Have an innovation that solves a local challenge?</h2>
            <p>Join Rwanda's Local Innovation Discovery and Knowledge Exchange Platform to document your work, receive expert feedback, and connect with partners.</p>
            <CtaActions>
              <ButtonLink to={user ? `/${roleWorkspace[user.role]}/dashboard` : "/register"}>
                {user ? "Go to Workspace" : "Register as an Innovator"} <ArrowRight size={16} />
              </ButtonLink>
              {!user && (
                <ButtonLink to="/login" $variant="secondary">
                  Sign In
                </ButtonLink>
              )}
            </CtaActions>
          </CtaInner>
        </CtaBanner>
      </main>
      <PublicFooter />
    </HomeRoot>
  );
}



export function InnovationCard({
  item,
  index = 0,
}: {
  item: Innovation;
  index?: number;
}) {
  return (
    <Card>
      <CardArt $tone={item.imageTone}>
        <StatusBadge status={item.status} />
        <b>0{index + 1}</b>
      </CardArt>
      <CardBody>
        <CardMeta>
          <span>{item.sector}</span>
          <span>
            <MapPin size={13} />
            {item.district}
          </span>
        </CardMeta>
        <h3>
          <Link to={`/innovations/${item.slug}`}>{item.title}</Link>
        </h3>
        <p>{item.summary}</p>
        <CardFoot>
          <div>
            <small>Led by</small>
            <strong>{item.owner}</strong>
          </div>
          <Link
            aria-label={`Open ${item.title}`}
            to={`/innovations/${item.slug}`}
          >
            <ArrowRight size={17} />
          </Link>
        </CardFoot>
      </CardBody>
    </Card>
  );
}

export function DirectoryPage() {
  const { data, user } = usePlatform();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("");
  const [district, setDistrict] = useState("");
  const [maturity, setMaturity] = useState("");
  const published = useMemo(
    () =>
      data!.innovations.filter(
        (i) =>
          i.status === "PUBLISHED" &&
          (!query ||
            `${i.title} ${i.summary} ${i.problem} ${i.solution}`
              .toLowerCase()
              .includes(query.toLowerCase())) &&
          (!sector || i.sector === sector) &&
          (!district || i.district === district) &&
          (!maturity || i.maturity === maturity),
      ),
    [data, query, sector, district, maturity],
  );
  const clear = () => {
    setQuery("");
    setSector("");
    setDistrict("");
    setMaturity("");
  };
  return (
    <>
      <PublicHeader />
      <PageSurface>
        <PageHeader
          eyebrow="Verified registry"
          title="Discover local green innovations"
          description="Search approved, published innovation knowledge. Restricted fields and private files are protected by verified role permissions."
        />
        <FilterPanel>
          <SearchField>
            <Search size={19} />
            <Input
              aria-label="Search innovations"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search problems, ideas or solutions"
            />
          </SearchField>
          <Select
            aria-label="Sector filter"
            value={sector}
            onChange={(e) => setSector(e.target.value)}
          >
            <option value="">All sectors</option>
            {data!.taxonomies.sectors.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Select
            aria-label="Project coverage filter"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
          >
            <option value="">All coverage levels</option>
            {projectCoverageLevels.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Select
            aria-label="Maturity filter"
            value={maturity}
            onChange={(e) => setMaturity(e.target.value)}
          >
            <option value="">All maturity levels</option>
            {data!.taxonomies.maturityLevels.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </Select>
          <Button $variant="quiet" onClick={clear}>
            <Filter size={16} /> Reset
          </Button>
        </FilterPanel>
        <ResultLine>
          <strong>{published.length} innovations</strong>
          <span>Published and verified for discovery</span>
        </ResultLine>
        {published.length ? (
          <InnovationGrid>
            {published.map((item, index) => (
              <InnovationCard key={item.id} item={item} index={index} />
            ))}
          </InnovationGrid>
        ) : (
          <EmptyState
            title="No innovation matches those filters"
            copy="Try a broader keyword, another coverage level, or reset all filters."
            action={<Button onClick={clear}>Reset filters</Button>}
          />
        )}
      </PageSurface>
      <PublicFooter />
    </>
  );
}

export function InnovationDetailPage() {
  const { slug } = useParams();
  const { data, user, notify } = usePlatform();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const item = data!.innovations.find(
    (i) => i.slug === slug && i.status === "PUBLISHED",
  );
  if (!item)
    return (
      <SystemStatePage
        code="404"
        title="Innovation not found"
        copy="This public innovation does not exist, is unpublished, or has been archived."
      />
    );

  return (
    <>
      <PublicHeader />
      <DetailHero $tone={item.imageTone}>
        <DetailHeroInner>
          <DetailBackLink to="/discover">
            <ArrowLeft size={16} /> Back to discovery
          </DetailBackLink>
          <HeroMeta aria-label="Innovation classification">
            <StatusBadge status={item.status} />
            <MetaPill>
              <Leaf size={14} />
              {item.sector}
            </MetaPill>
            <MetaPill>
              <Compass size={14} />
              {item.district}
            </MetaPill>
          </HeroMeta>
          <HeroCopy>
            <h1>{item.title}</h1>
            <p>{item.summary}</p>
          </HeroCopy>
          <HeroFooter>
            <DetailActions>
              <Button
                onClick={() =>
                  notify("Innovation saved to your opportunities")
                }
              >
                <Bookmark size={17} /> Save opportunity
              </Button>
              <Button
                $variant="secondary"
                onClick={() => {
                  navigator.clipboard?.writeText(location.href);
                  notify("Share link copied");
                }}
              >
                <Share2 size={17} /> Share
              </Button>
            </DetailActions>
            <HeroFacts aria-label="Innovation highlights">
              <div>
                <small>Maturity</small>
                <strong>{item.maturity}</strong>
              </div>
              <div>
                <small>Published version</small>
                <strong>Version {item.version}</strong>
              </div>
            </HeroFacts>
          </HeroFooter>
        </DetailHeroInner>
      </DetailHero>
      <DetailPageSurface id="innovation-content">
        <DetailGrid>
          <StoryColumn>
            {[
              ["01", "The local challenge", "Problem", item.problem],
              ["02", "The innovation", "Solution", item.solution],
              ["03", "Who benefits", "Beneficiaries", item.beneficiaries],
            ].map(([number, eyebrow, title, copy]) => (
              <ContentSection key={number}>
                <SectionIndex aria-hidden="true">{number}</SectionIndex>
                <div>
                  <Eyebrow>{eyebrow}</Eyebrow>
                  <h2>{title}</h2>
                  <p>{copy}</p>
                </div>
              </ContentSection>
            ))}

            <HighlightGrid>
              <HighlightCard>
                <span>
                  <TrendingUp size={18} />
                </span>
                <Eyebrow>Expected impact</Eyebrow>
                <h2>What changes</h2>
                <p>{item.impact}</p>
              </HighlightCard>
              <HighlightCard $accent>
                <span>
                  <HeartHandshake size={18} />
                </span>
                <Eyebrow>Support requested</Eyebrow>
                <h2>How to help</h2>
                <p>{item.supportNeeded}</p>
              </HighlightCard>
            </HighlightGrid>

            <SupportingDetailSection>
              <SectionHeading>
                <span>
                  <Sparkles size={18} />
                </span>
                <div>
                  <Eyebrow>Inside the innovation</Eyebrow>
                  <h2>Readiness and growth</h2>
                  <p>
                    Open a topic to explore the evidence, delivery plan, and
                    long-term direction.
                  </p>
                </div>
              </SectionHeading>
              <DisclosureGrid>
                {[
                  ["What is new or different", item.novelty],
                  ["Evidence so far", item.currentEvidence],
                  ["Implementation plan", item.implementationPlan],
                  ["Potential to scale", item.scalability],
                  ["Sustainability", item.sustainability],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <DetailDisclosure key={label}>
                      <summary>
                        <span>{label}</span>
                        <span aria-hidden="true">+</span>
                      </summary>
                      <p>{value}</p>
                    </DetailDisclosure>
                  ))}
              </DisclosureGrid>
            </SupportingDetailSection>

            {item.milestones.length > 0 && (
              <SupportingDetailSection>
                <SectionHeading>
                  <span>
                    <CheckCircle2 size={18} />
                  </span>
                  <div>
                    <Eyebrow>Evidence and progress</Eyebrow>
                    <h2>Documented milestones</h2>
                  </div>
                </SectionHeading>
                <Timeline>
                  {item.milestones.map((m) => (
                    <div key={m.title}>
                      <CheckCircle2 size={18} />
                      <span>
                        <strong>{m.title}</strong>
                        <small>{m.date}</small>
                      </span>
                      <StatusBadge status={m.status} />
                    </div>
                  ))}
                </Timeline>
              </SupportingDetailSection>
            )}

            <SupportingDetailSection>
              <SectionHeading>
                <span>
                  <FileText size={18} />
                </span>
                <div>
                  <Eyebrow>Supporting materials</Eyebrow>
                  <h2>Documents and links</h2>
                  <p>Review the public material shared by the innovator.</p>
                </div>
              </SectionHeading>
              {item.supportingLinks.length || item.evidence.length ? (
                <ResourceList>
                  {item.supportingLinks.map((link) => (
                    <a key={link.url} href={link.url} target="_blank" rel="noreferrer">
                      <FileText size={18} />
                      <span>
                        <strong>{link.title}</strong>
                        <small>Open supporting link</small>
                      </span>
                      <ArrowRight size={17} />
                    </a>
                  ))}
                  {item.evidence.map((file) => (
                    <a
                      key={file.id}
                      href={`/api/v1/public/innovations/${item.slug}/evidence/${file.id}/download`}
                    >
                      <FileText size={18} />
                      <span>
                        <strong>{file.name}</strong>
                        <small>{file.mimeType}</small>
                      </span>
                      <ArrowRight size={17} />
                    </a>
                  ))}
                </ResourceList>
              ) : (
                <p>No public supporting documents or links were attached.</p>
              )}
            </SupportingDetailSection>
          </StoryColumn>
          <DetailAside aria-label="Innovation summary">
            <AsideCard>
              <AsideCardHeader>
                <span>
                  <Compass size={18} />
                </span>
                <div>
                  <small>At a glance</small>
                  <h2>Innovation snapshot</h2>
                </div>
              </AsideCardHeader>
              <SnapshotList>
                {[
                  ["Maturity", item.maturity],
                  ["Primary impact area", item.impactArea],
                  ["Innovation type", item.category],
                  ["Project coverage", item.district],
                  ["Published version", `Version ${item.version}`],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{value || "Not specified"}</strong>
                  </div>
                ))}
              </SnapshotList>
            </AsideCard>
            {item.metrics.length > 0 && (
              <AsideCard>
                <AsideCardHeader>
                  <span>
                    <BarChart3 size={18} />
                  </span>
                  <div>
                    <small>Measured results</small>
                    <h2>Verified impact signals</h2>
                  </div>
                </AsideCardHeader>
                <MetricStack>
                  {item.metrics.map((m) => (
                    <div key={m.label}>
                      <strong>{m.value}</strong>
                      <span>{m.label}</span>
                    </div>
                  ))}
                </MetricStack>
              </AsideCard>
            )}
            <AsideCard>
              <AsideCardHeader>
                <span>
                  <Building2 size={18} />
                </span>
                <div>
                  <small>Published by</small>
                  <h2>About the innovator</h2>
                </div>
              </AsideCardHeader>
              <Owner>
                <span>
                  {item.owner
                    .split(" ")
                    .map((v) => v[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div>
                  <strong>{item.owner}</strong>
                  <small>{item.organization || "Independent innovator"}</small>
                </div>
              </Owner>
            </AsideCard>
            <Notice>
              <ShieldCheck size={18} />
              <p>
                Publication on LIDKEP is not patent protection or investment
                advice. Engagement offers are non-binding and funds are never
                transferred on the platform.
              </p>
            </Notice>
          </DetailAside>
        </DetailGrid>
      </DetailPageSurface>
      <PublicFooter />
    </>
  );
}


export function AuthPage({ mode }: { mode: "login" | "register" | "reset" }) {
  const navigate = useNavigate();
  const { notify, login, register } = usePlatform();
  const [role, setRole] = useState<Role>("INNOVATOR");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const destination = (nextRole: Role) =>
    nextRole === "SYSTEM_ADMINISTRATOR"
      ? "/admin/dashboard"
      : nextRole === "INNOVATOR"
        ? "/innovator/dashboard"
        : nextRole === "EXPERT"
          ? "/expert/dashboard"
          : nextRole === "INVESTOR_PARTNER"
            ? "/partner/dashboard"
            : "/discover";

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    const form = new FormData(e.currentTarget);
    try {
      if (mode === "reset") {
        notify(
          "Password recovery will be sent when email delivery is configured.",
        );
        return;
      }
      if (mode === "login") {
        const user = await login(
          String(form.get("email")),
          String(form.get("password")),
        );
        notify("Signed in securely.");
        navigate(destination(user.role));
        return;
      }
      const displayName = String(form.get("displayName"));
      if (!fullNameIsValid(displayName)) {
        setFormError(
          "Full name must use letters, spaces, apostrophes, or hyphens only.",
        );
        return;
      }
      const result = await register({
        email: String(form.get("email")),
        password: String(form.get("password")),
        displayName,
        role: role as Exclude<Role, "SYSTEM_ADMINISTRATOR">,
      });
      if (result.requiresApproval) {
        notify("Account created. Complete your profile to request approval.");
        navigate(destination(result.user.role));
      } else {
        notify("Account created.");
        navigate(destination(result.user.role));
      }
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "The request failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <AuthBrand>
        <Brand />
        <ButtonLink to="/" $variant="quiet">
          Back to public site
        </ButtonLink>
      </AuthBrand>
      <AuthGrid>
        <AuthIntro>
          <Eyebrow>Secure participation</Eyebrow>
          <h1>
            {mode === "login"
              ? "Welcome back."
              : mode === "register"
                ? "Choose how you participate."
                : "Recover access securely."}
          </h1>
          <p>
            {mode === "login"
              ? "Sign in to continue your role-specific journey."
              : mode === "register"
                ? "Register as an Innovator, Expert, or Investor / Industry Partner. Innovators can access their workspace immediately. Expert and Partner accounts require System Administrator approval."
                : "Enter your verified email to request recovery."}

          </p>
          <AuthTrust>
            <ShieldCheck />
            <div>
              <b>Clear role responsibilities</b>
              <span>
                Your selected role controls the workspace and information you
                can access.
              </span>
            </div>
          </AuthTrust>
        </AuthIntro>
        <Panel>
          <PanelHeader>
            <div>
              <h2>
                {mode === "login"
                  ? "Sign in"
                  : mode === "register"
                    ? "Create an account"
                    : "Reset password"}
              </h2>
              <p>
                Credentials are protected with Argon2id and secure server-side
                sessions.
              </p>
            </div>
          </PanelHeader>
          <PanelBody>
            <AuthForm onSubmit={submit}>
              {mode === "register" && (
                <fieldset>
                  <legend>Choose your account type</legend>
                  <RoleChoices>
                    {(
                      [
                        [
                          "INNOVATOR",
                          "Innovator",
                          "Submit innovations and track progress.",
                        ],
                        ["EXPERT", "Expert", "Review submitted innovations."],
                        [
                          "INVESTOR_PARTNER",
                          "Investor / Industry Partner",
                          "Discover and support innovations.",
                        ],
                      ] as const
                    ).map(([value, label, copy]) => (
                      <label
                        key={value}
                        className={role === value ? "selected" : ""}
                      >
                        <input
                          type="radio"
                          name="roleChoice"
                          value={value}
                          checked={role === value}
                          onChange={() => setRole(value)}
                        />
                        <span>
                          <b>{label}</b>
                          <small>{copy}</small>
                        </span>
                      </label>
                    ))}
                  </RoleChoices>
                </fieldset>
              )}
              {mode === "register" && (
                <Field label="Full name">
                  <Input
                    name="displayName"
                    required
                    minLength={2}
                    maxLength={120}
                    placeholder="Enter your names as shown on your identification"
                    autoComplete="name"
                  />
                </Field>
              )}
              <Field label="Email address">
                <Input
                  name="email"
                  type="email"
                  required
                  placeholder="name@example.rw"
                  autoComplete="email"
                />
              </Field>
              {mode !== "reset" && (
                <Field label="Password">
                  <Input
                    name="password"
                    type="password"
                    required
                    minLength={12}
                    placeholder="At least 12 characters"
                    autoComplete={
                      mode === "login" ? "current-password" : "new-password"
                    }
                  />
                </Field>
              )}
              {formError && <FormError role="alert">{formError}</FormError>}
              <Button type="submit" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : mode === "register"
                      ? "Create account"
                      : "Request reset"}{" "}
                <ArrowRight size={16} />
              </Button>
              {mode === "login" && (
                <AuthLinks>
                  <Link to="/forgot-password">Forgot password?</Link>
                  <Link to="/register">Create account</Link>
                </AuthLinks>
              )}
            </AuthForm>
          </PanelBody>
        </Panel>
      </AuthGrid>
    </AuthShell>
  );
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, changePassword, notify } = usePlatform();
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.mustChangePassword) {
    const workspace =
      user.role === "SYSTEM_ADMINISTRATOR"
        ? "admin"
        : user.role === "INNOVATOR"
          ? "innovator"
          : user.role === "EXPERT"
            ? "expert"
            : "partner";
    return <Navigate to={`/${workspace}/dashboard`} replace />;
  }
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");
    const form = new FormData(e.currentTarget);
    const currentPassword = String(form.get("currentPassword"));
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== String(form.get("confirmPassword"))) {
      setFormError("The new passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      notify("Password changed. Sign in with your new password.");
      navigate("/login");
    } catch (cause) {
      setFormError(
        cause instanceof Error ? cause.message : "The request failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <AuthShell>
      <AuthBrand>
        <Brand />
        <span>Required security step</span>
      </AuthBrand>
      <AuthGrid>
        <AuthIntro>
          <Eyebrow>Protect your account</Eyebrow>
          <h1>Choose your own password.</h1>
          <p>
            The initial credential is temporary. Set a new strong password
            before entering the workspace.
          </p>
          <AuthTrust>
            <ShieldCheck />
            <div>
              <b>All sessions are revoked</b>
              <span>
                After this change, sign in again with your new password.
              </span>
            </div>
          </AuthTrust>
        </AuthIntro>
        <Panel>
          <PanelHeader>
            <div>
              <h2>Change password</h2>
              <p>
                Use at least 12 characters with upper and lower case letters, a
                number, and a symbol.
              </p>
            </div>
          </PanelHeader>
          <PanelBody>
            <AuthForm onSubmit={submit}>
              <Field label="Current password">
                <Input
                  name="currentPassword"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <Field label="New password">
                <Input
                  name="newPassword"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
              </Field>
              {formError && <FormError role="alert">{formError}</FormError>}
              <Button type="submit" disabled={busy}>
                {busy ? "Please wait…" : "Change password"}{" "}
                <ArrowRight size={16} />
              </Button>
            </AuthForm>
          </PanelBody>
        </Panel>
      </AuthGrid>
    </AuthShell>
  );
}

export function AboutPage() {
  const { user } = usePlatform();

  return (
    <>
      <PublicHeader />
      <PageSurface>
        <PageHeader
          eyebrow="Platform Architecture & Lifecycle"
          title="How LIDKEP Works"
          description="Rwanda's Local Innovation Discovery & Knowledge Exchange Platform connects grassroots innovators, verified technical experts, institutional partners, and system administrators through structured, auditable workflows."
        />

        {/* 5-STAGE INNOVATION LIFECYCLE */}
        <AboutSectionTitle>
          <Eyebrow>5-Stage Lifecycle</Eyebrow>
          <h2>From local challenge to verified national scale</h2>
          <p>
            Every innovation follows a transparent journey designed to protect intellectual ownership while verifying technical credibility.
          </p>
        </AboutSectionTitle>

        <ProcessTimeline>
          <ProcessStepCard>
            <ProcessStepNum>01</ProcessStepNum>
            <ProcessStepContent>
              <ProcessStepHeader>
                <FileText size={20} />
                <h3>Draft & Document (Innovator)</h3>
              </ProcessStepHeader>
              <p>
                Innovators self-register with instant active access and document their project. They capture the local challenge, technical solution, beneficiaries, novelty, scalability, sustainability, and milestones.
              </p>
              <ProcessPoints>
                <div><CheckCircle2 size={15} /><span>Granular file visibility (Review-team, Public, or Admin-only)</span></div>
                <div><CheckCircle2 size={15} /><span>Ownership and accuracy declarations required before submission</span></div>
                <div><CheckCircle2 size={15} /><span>Submission creates a locked, immutable version for review</span></div>
              </ProcessPoints>
            </ProcessStepContent>
          </ProcessStepCard>

          <ProcessStepCard>
            <ProcessStepNum>02</ProcessStepNum>
            <ProcessStepContent>
              <ProcessStepHeader>
                <ShieldCheck size={20} />
                <h3>Administrative Review & Expert Assignment (Administrator)</h3>
              </ProcessStepHeader>
              <p>
                System Administrators review the complete submitted version for completeness and assign exactly one approved domain Expert based on sector taxonomy (Agriculture, Health, Energy, Water, ICT, etc.).
              </p>
              <ProcessPoints>
                <div><CheckCircle2 size={15} /><span>Administrative completeness checks prevent premature scoring</span></div>
                <div><CheckCircle2 size={15} /><span>Direct matching to vetted technical specialists by sector</span></div>
              </ProcessPoints>
            </ProcessStepContent>
          </ProcessStepCard>

          <ProcessStepCard>
            <ProcessStepNum>03</ProcessStepNum>
            <ProcessStepContent>
              <ProcessStepHeader>
                <Award size={20} />
                <h3>Technical Criteria Scoring & Feedback (Expert)</h3>
              </ProcessStepHeader>
              <p>
                The assigned Expert reviews the immutable version, opening technical evidence and supporting materials. They evaluate the submission against active weighted criteria (scored 0 to 5) with qualitative feedback.
              </p>
              <ProcessPoints>
                <div><CheckCircle2 size={15} /><span>Standardized evaluation on feasibility, impact, novelty, and evidence</span></div>
                <div><CheckCircle2 size={15} /><span>Can request structured revisions or submit a publication recommendation</span></div>
                <div><CheckCircle2 size={15} /><span>Innovators improve and resubmit directly to the same Expert</span></div>
              </ProcessPoints>
            </ProcessStepContent>
          </ProcessStepCard>

          <ProcessStepCard>
            <ProcessStepNum>04</ProcessStepNum>
            <ProcessStepContent>
              <ProcessStepHeader>
                <Compass size={20} />
                <h3>Publication & Verified Directory (Administrator)</h3>
              </ProcessStepHeader>
              <p>
                When an Expert recommends approval, the innovation enters the verified national registry directory. A public-facing immutable record is published while keeping private evidence and contact details securely protected.
              </p>
              <ProcessPoints>
                <div><CheckCircle2 size={15} /><span>Full audit trail of versions, scores, and evaluation comments</span></div>
                <div><CheckCircle2 size={15} /><span>Multi-sector indexing across Rwanda's 30 districts and coverage levels</span></div>
              </ProcessPoints>
            </ProcessStepContent>
          </ProcessStepCard>

          <ProcessStepCard>
            <ProcessStepNum>05</ProcessStepNum>
            <ProcessStepContent>
              <ProcessStepHeader>
                <HeartHandshake size={20} />
                <h3>Partner Discovery & Consent-Gated Engagement (Investor / Partner)</h3>
              </ProcessStepHeader>
              <p>
                Approved institutional investors and industry partners browse published innovations and send non-binding collaboration proposals (funding, pilot testing, technical assistance).
              </p>
              <ProcessPoints>
                <div><CheckCircle2 size={15} /><span>Innovator explicitly reviews and consents before email/phone are shared</span></div>
                <div><CheckCircle2 size={15} /><span>Non-binding framework: funds are never transferred directly on-platform</span></div>
              </ProcessPoints>
            </ProcessStepContent>
          </ProcessStepCard>
        </ProcessTimeline>

        {/* 4 ECOSYSTEM WORKSPACES */}
        <AboutSectionTitle>
          <Eyebrow>Role Responsibilities</Eyebrow>
          <h2>Four unified stakeholder workspaces</h2>
          <p>Each participant has a dedicated workspace tailored to their exact function in the ecosystem.</p>
        </AboutSectionTitle>

        <WorkspaceGrid>
          <WorkspaceCard>
            <WorkspaceCardHeader>
              <span>01</span>
              <h3>Innovator Workspace</h3>
            </WorkspaceCardHeader>
            <p>For Rwandan inventors and grassroots problem-solvers.</p>
            <ul>
              <li>Immediate account registration and dashboard access</li>
              <li>Structured draft builder with word limits & guidance</li>
              <li>File manager for review-team & public evidence files</li>
              <li>Live evaluation tracker with full Expert feedback</li>
              <li>Collaboration request manager with consent controls</li>
            </ul>
          </WorkspaceCard>

          <WorkspaceCard>
            <WorkspaceCardHeader>
              <span>02</span>
              <h3>Expert Workspace</h3>
            </WorkspaceCardHeader>
            <p>For verified domain specialists and technical evaluators.</p>
            <ul>
              <li>Assignment queue created by System Administrators</li>
              <li>Read-only access to assigned immutable version and files</li>
              <li>Interactive criteria scoring sheet (0–5) with weighted math</li>
              <li>Formal recommendation or structured revision requests</li>
              <li>Historical evaluation log and notification center</li>
            </ul>
          </WorkspaceCard>

          <WorkspaceCard>
            <WorkspaceCardHeader>
              <span>03</span>
              <h3>Investor & Partner Workspace</h3>
            </WorkspaceCardHeader>
            <p>For development partners, NGOs, and impact investors.</p>
            <ul>
              <li>Search and filter approved, published innovations</li>
              <li>Review verified technical briefs and public evidence</li>
              <li>Submit non-binding collaboration and funding proposals</li>
              <li>Track pending, accepted, or clarification requests</li>
              <li>Receive direct innovator contact upon mutual consent</li>
            </ul>
          </WorkspaceCard>

          <WorkspaceCard>
            <WorkspaceCardHeader>
              <span>04</span>
              <h3>Administrator Workspace</h3>
            </WorkspaceCardHeader>
            <p>For system governance and platform oversight.</p>
            <ul>
              <li>Account approval queues for Experts and Partners</li>
              <li>Expert assignment to submitted innovation versions</li>
              <li>Full CRUD for classification taxonomies (sectors, categories)</li>
              <li>Evaluation criteria version management with weight checks</li>
              <li>PDF summary report generation and printable analytics</li>
            </ul>
          </WorkspaceCard>
        </WorkspaceGrid>

        {/* GOVERNANCE & INTEGRITY PRINCIPLES */}
        <AboutSectionTitle>
          <Eyebrow>Platform Integrity</Eyebrow>
          <h2>Built on trust, transparency, and data safety</h2>
          <p>Core governance safeguards embedded into the architecture.</p>
        </AboutSectionTitle>

        <PrincipleGrid>
          <PrincipleCard>
            <ShieldCheck size={24} />
            <div>
              <h3>Immutable Versioning</h3>
              <p>Submitted versions are locked and frozen to guarantee that review scores reflect the exact evidence evaluated.</p>
            </div>
          </PrincipleCard>

          <PrincipleCard>
            <Award size={24} />
            <div>
              <h3>Standardized Weighted Criteria</h3>
              <p>Active evaluation criteria versions (2–12 criteria) ensure consistent, transparent scoring across all sectors.</p>
            </div>
          </PrincipleCard>

          <PrincipleCard>
            <HeartHandshake size={24} />
            <div>
              <h3>Consent-Controlled Disclosure</h3>
              <p>Innovator contact details remain confidential until the innovator explicitly accepts a collaboration proposal.</p>
            </div>
          </PrincipleCard>

          <PrincipleCard>
            <FileText size={24} />
            <div>
              <h3>Non-Binding Financial Safety</h3>
              <p>Collaborations are informational and non-binding; the platform does not hold funds or enforce financial contracts.</p>
            </div>
          </PrincipleCard>
        </PrincipleGrid>

        {/* CTA */}
        <AboutCta>
          <h2>Ready to participate in Rwanda's innovation ecosystem?</h2>
          <p>Whether you are documenting a local solution, evaluating technical merit, or looking to partner, LIDKEP is built for you.</p>
          <div>
            <ButtonLink to={user ? `/${roleWorkspace[user.role]}/dashboard` : "/register"}>
              {user ? "Go to Workspace" : "Create an Account"} <ArrowRight size={16} />
            </ButtonLink>
            {!user && (
              <ButtonLink to="/login" $variant="secondary">
                Sign In
              </ButtonLink>
            )}
          </div>
        </AboutCta>
      </PageSurface>
      <PublicFooter />
    </>
  );
}

export function SystemStatePage({
  code,
  title,
  copy,
}: {
  code: string;
  title: string;
  copy: string;
}) {
  return (
    <StatePage>
      <Brand />
      <strong>{code}</strong>
      <h1>{title}</h1>
      <p>{copy}</p>
      <ButtonLink to="/">Return home</ButtonLink>
    </StatePage>
  );
}

export function PublicFooter() {
  const { user } = usePlatform();
  return (
    <Footer>
      <Brand />
      <p>Local Innovation Discovery & Knowledge Exchange Platform (LIDKEP)</p>
      <div>
        <Link to="/">Home</Link>
        <Link to="/about">How it works</Link>
        {user ? (
          <Link to={`/${roleWorkspace[user.role]}/dashboard`}>Workspace</Link>
        ) : (
          <Link to="/login">Sign in</Link>
        )}
      </div>
    </Footer>
  );
}

const PublicNav = styled.header`
  height: 76px;
  max-width: 1240px;
  margin: auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  nav {
    display: flex;
    gap: 28px;
    color: ${palette.muted};
    font-weight: 600;
    font-size: 14px;
  }
  div {
    display: flex;
    gap: 8px;
  }
  @media (max-width: 760px) {
    nav {
      display: none;
    }
    div > a:first-of-type {
      display: none;
    }
  }
`;
const HomeRoot = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const HeroSection = styled.section`
  background: linear-gradient(180deg, #f2f7f4 0%, #ffffff 100%);
  padding: 48px 24px 72px;
  position: relative;
  overflow: hidden;
`;

const HeroContainer = styled.div`
  max-width: 1240px;
  margin: auto;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 56px;
  align-items: center;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 36px;
  }
`;

const HeroContent = styled.div`
  h1 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(34px, 3.8vw, 54px);
    letter-spacing: -0.045em;
    line-height: 1.08;
    margin: 18px 0 20px;
    font-weight: 800;
    color: ${palette.ink};
  }
  em {
    color: ${palette.green};
    font-style: normal;
  }
  p {
    font-size: 18px;
    color: ${palette.muted};
    line-height: 1.65;
    max-width: 580px;
    margin: 0;
  }
`;

const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #e5f2e8;
  color: ${palette.green};
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  svg {
    color: ${palette.green};
  }
`;

const HeroActions = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 28px 0;
`;

const HeroHighlights = styled.div`
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e1ece4;
  div {
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${palette.ink};
    font-size: 13px;
    font-weight: 600;
    svg {
      color: ${palette.green};
    }
  }
`;

const HeroVisualCard = styled.div`
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 48px #102a2718;
  border: 1px solid #d8e8dc;
  height: 440px;
  background: ${palette.soft};
  @media (max-width: 900px) {
    height: 320px;
  }
`;

const HeroVisualImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const HeroFloatingTag = styled.div`
  position: absolute;
  left: 20px;
  bottom: 20px;
  right: 20px;
  background: rgba(20, 46, 43, 0.92);
  backdrop-filter: blur(10px);
  color: white;
  padding: 16px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
  }
  small {
    color: #cbe0d8;
    font-size: 12px;
  }
`;

const HeroFloatingIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${palette.lime};
  color: ${palette.ink};
  display: grid;
  place-items: center;
  flex-shrink: 0;
`;

const ServiceSection = styled.section`
  max-width: 1240px;
  margin: auto;
  padding: 80px 24px;
`;

const ServiceSectionHeader = styled.div`
  text-align: center;
  max-width: 640px;
  margin: 0 auto 52px;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(28px, 3vw, 40px);
    font-weight: 800;
    letter-spacing: -0.04em;
    margin: 10px 0 14px;
    color: ${palette.ink};
  }
  p {
    color: ${palette.muted};
    font-size: 16px;
    line-height: 1.6;
    margin: 0;
  }
`;

const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 22px;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const ServiceCard = styled.div`
  background: white;
  border: 1px solid #e2ebe4;
  border-radius: 20px;
  padding: 30px 24px;
  display: flex;
  flex-direction: column;
  transition: all 0.22s ease;
  box-shadow: 0 6px 18px #102a2705;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px #102a2710;
    border-color: ${palette.green};
  }
  h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 18px 0 10px;
    color: ${palette.ink};
  }
  p {
    color: ${palette.muted};
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 20px;
    flex: 1;
  }
`;

const ServiceIconWrap = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: #f0f7f2;
  color: ${palette.green};
  display: grid;
  place-items: center;
`;

const ServiceLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: ${palette.green};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const AboutMissionSection = styled.section`
  background: #f9fbf9;
  border-top: 1px solid #e4ede6;
  border-bottom: 1px solid #e4ede6;
  padding: 88px 24px;
`;

const AboutMissionContainer = styled.div`
  max-width: 1240px;
  margin: auto;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 64px;
  align-items: center;
  @media (max-width: 880px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const AboutMissionCopy = styled.div`
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(28px, 3vw, 42px);
    letter-spacing: -0.04em;
    line-height: 1.15;
    margin: 12px 0 18px;
    font-weight: 800;
    color: ${palette.ink};
  }
  em {
    color: ${palette.green};
    font-style: normal;
  }
  > p {
    font-size: 16px;
    color: ${palette.muted};
    line-height: 1.68;
    margin-bottom: 28px;
  }
`;

const MissionPoints = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
`;

const MissionPoint = styled.div`
  display: flex;
  gap: 14px;
  align-items: flex-start;
  svg {
    color: ${palette.green};
    flex-shrink: 0;
    margin-top: 2px;
  }
  strong {
    display: block;
    font-size: 15px;
    font-weight: 700;
    color: ${palette.ink};
    margin-bottom: 2px;
  }
  p {
    font-size: 13px;
    color: ${palette.muted};
    margin: 0;
    line-height: 1.5;
  }
`;

const AboutMissionVisual = styled.div`
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 24px 48px #102a2715;
  border: 1px solid #d5e5d8;
  height: 480px;
  background: white;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  @media (max-width: 880px) {
    height: 340px;
  }
`;

const NumbersBanner = styled.section`
  background: #122b27;
  color: white;
  padding: 56px 24px;
`;

const NumbersContainer = styled.div`
  max-width: 1240px;
  margin: auto;
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 48px;
  align-items: center;
  @media (max-width: 860px) {
    grid-template-columns: 1fr;
    gap: 32px;
  }
`;

const NumbersHeader = styled.div`
  small {
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-weight: 800;
    color: ${palette.lime};
    font-size: 11px;
    display: block;
    margin-bottom: 8px;
  }
  h3 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(24px, 2.5vw, 34px);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.2;
    margin: 0;
  }
`;

const NumbersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px 16px;
  }
`;

const NumberItem = styled.div`
  strong {
    font-family: "Roboto Mono", monospace;
    font-size: clamp(26px, 2.8vw, 36px);
    font-weight: 700;
    color: #e4b85c;
    display: block;
    line-height: 1.1;
  }
  span {
    color: #cbe0d8;
    font-size: 12px;
    font-weight: 500;
    margin-top: 4px;
    display: block;
  }
`;

const ShowcaseSection = styled.section`
  max-width: 1240px;
  margin: auto;
  padding: 88px 24px;
`;

const ShowcaseTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  margin-bottom: 36px;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(28px, 3vw, 38px);
    letter-spacing: -0.04em;
    font-weight: 800;
    margin: 10px 0 6px;
    color: ${palette.ink};
  }
  p {
    color: ${palette.muted};
    font-size: 15px;
    margin: 0;
  }
  @media (max-width: 680px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ShowcaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  @media (max-width: 960px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const ShowcaseCard = styled.article`
  background: white;
  border: 1px solid #e1ebe3;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 8px 22px #102a2708;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 36px #102a2712;
  }
`;

const ShowcaseImageWrap = styled.div`
  height: 200px;
  position: relative;
  overflow: hidden;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

const ShowcaseTag = styled.span`
  position: absolute;
  left: 14px;
  top: 14px;
  padding: 5px 10px;
  background: rgba(20, 46, 43, 0.88);
  backdrop-filter: blur(6px);
  color: white;
  font-size: 11px;
  font-weight: 700;
  border-radius: 8px;
`;

const ShowcaseBody = styled.div`
  padding: 22px;
  display: flex;
  flex-direction: column;
  flex: 1;
  h3 {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.35;
    margin: 0 0 10px;
    color: ${palette.ink};
  }
  p {
    font-size: 13px;
    color: ${palette.muted};
    line-height: 1.58;
    margin: 0 0 16px;
    flex: 1;
  }
`;

const ShowcaseFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid #f0f4f1;
  font-size: 12px;
  span {
    color: ${palette.green};
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  small {
    color: ${palette.muted};
  }
`;

const ShowcaseCallout = styled.div`
  background: linear-gradient(135deg, ${palette.greenDark} 0%, ${palette.green} 100%);
  color: white;
  border-radius: 20px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-shadow: 0 12px 30px #073f3825;
  h3 {
    font-size: 22px;
    font-weight: 800;
    line-height: 1.25;
    margin: 10px 0 12px;
  }
  p {
    color: #cbe0d8;
    font-size: 14px;
    line-height: 1.6;
    margin: 0 0 24px;
  }
  a {
    align-self: flex-start;
  }
`;

const RoleSection = styled.section`
  background: #f7faf8;
  border-top: 1px solid #e2ebe4;
  padding: 88px 24px;
`;

const RoleSectionHeader = styled.div`
  text-align: center;
  max-width: 680px;
  margin: 0 auto 52px;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(28px, 3vw, 38px);
    font-weight: 800;
    letter-spacing: -0.04em;
    margin: 10px 0 14px;
    color: ${palette.ink};
  }
  p {
    color: ${palette.muted};
    font-size: 16px;
    line-height: 1.6;
    margin: 0;
  }
`;

const RoleGrid = styled.div`
  max-width: 1240px;
  margin: auto;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const RoleCard = styled.article`
  background: white;
  border: 1px solid #e1ebe3;
  border-radius: 18px;
  padding: 28px 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 14px #102a2704;
  span {
    font-family: "Roboto Mono", monospace;
    font-size: 12px;
    font-weight: 800;
    color: ${palette.green};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 12px 0 8px;
    color: ${palette.ink};
  }
  p {
    font-size: 13px;
    color: ${palette.muted};
    line-height: 1.58;
    margin: 0;
  }
`;

const CtaBanner = styled.section`
  max-width: 1240px;
  margin: 72px auto;
  padding: 0 24px;
`;

const CtaInner = styled.div`
  background: #142f2b;
  color: white;
  border-radius: 26px;
  padding: 64px 40px;
  text-align: center;
  max-width: 980px;
  margin: auto;
  box-shadow: 0 24px 60px #102a2725;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(26px, 3.2vw, 42px);
    font-weight: 800;
    letter-spacing: -0.04em;
    margin: 0 0 14px;
    line-height: 1.15;
  }
  p {
    color: #cbe0d8;
    font-size: 16px;
    max-width: 580px;
    margin: 0 auto 32px;
    line-height: 1.6;
  }
`;

const CtaActions = styled.div`
  display: flex;
  justify-content: center;
  gap: 14px;
  flex-wrap: wrap;
`;

const InnovationGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  @media (max-width: 860px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.article`
  background: white;
  border: 1px solid ${palette.line};
  border-radius: 15px;
  overflow: hidden;
  transition: 0.18s;
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 30px #102a2710;
  }
`;

const CardArt = styled.div<{ $tone: string }>`
  height: 170px;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: start;
  background: ${({ $tone }) =>
    ({
      mint: "#b9ddbb",
      amber: "#f2d493",
      blue: "#bbd6de",
      sage: "#cbdca8",
      lavender: "#d9d0e8",
      aqua: "#b9e1dc",
    })[$tone] || "#cfe0d4"};
  position: relative;
  overflow: hidden;
  &:after {
    content: "";
    position: absolute;
    width: 190px;
    height: 190px;
    border-radius: 50%;
    border: 28px solid #ffffff80;
    right: -60px;
    bottom: -110px;
  }
  b {
    font-family: "Montserrat", sans-serif;
    font-size: 65px;
    color: #ffffffb5;
    position: absolute;
    right: 20px;
    bottom: 0;
  }
`;

const CardBody = styled.div`
  padding: 19px;
  h3 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 20px;
    line-height: 1.2;
    letter-spacing: -0.03em;
    margin: 9px 0 7px;
    font-weight: 700;
  }
  p {
    font-size: 13px;
    color: ${palette.muted};
    min-height: 60px;
    margin: 0;
    line-height: 1.55;
  }
`;

const CardMeta = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: ${palette.green};
  font-size: 10px;
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.05em;
  span:last-of-type {
    color: ${palette.muted};
    display: flex;
    align-items: center;
    gap: 3px;
  }
`;

const CardFoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid ${palette.line};
  margin-top: 16px;
  padding-top: 14px;
  div {
    display: flex;
    flex-direction: column;
  }
  small {
    color: ${palette.muted};
    font-size: 10px;
  }
  strong {
    font-size: 12px;
  }
  a {
    background: ${palette.green};
    color: white;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: grid;
    place-items: center;
  }
`;

const PageSurface = styled.main`

  max-width: 1240px;
  margin: auto;
  padding: 55px 24px 90px;
  min-height: 70vh;
`;
const FilterPanel = styled.div`
  display: grid;
  grid-template-columns: 1.5fr repeat(3, 1fr) auto;
  gap: 9px;
  padding: 11px;
  background: white;
  border: 1px solid ${palette.line};
  border-radius: 13px;
  @media (max-width: 920px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
const SearchField = styled.div`
  position: relative;
  svg {
    position: absolute;
    left: 13px;
    top: 13px;
    color: ${palette.muted};
  }
  input {
    padding-left: 41px;
  }
`;
const ResultLine = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 23px 0 14px;
  font-size: 13px;
  span {
    color: ${palette.muted};
  }
`;
const DetailHero = styled.section<{ $tone: string }>`
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 20%, rgba(184, 221, 114, 0.26), transparent 26%),
    radial-gradient(circle at 8% 95%, rgba(11, 98, 85, 0.12), transparent 32%),
    ${({ $tone }) =>
      ({ mint: "#eaf5e8", amber: "#fff6e7", blue: "#eef7f9" })[$tone] ||
      palette.soft};
  border-bottom: 1px solid ${palette.line};
  &::after {
    content: "";
    position: absolute;
    width: 420px;
    height: 420px;
    right: -115px;
    top: -180px;
    border: 1px solid rgba(11, 98, 85, 0.12);
    border-radius: 50%;
    box-shadow:
      0 0 0 46px rgba(11, 98, 85, 0.035),
      0 0 0 92px rgba(11, 98, 85, 0.025);
    pointer-events: none;
  }
`;
const DetailHeroInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1192px;
  margin: auto;
  padding: 34px 24px 64px;
  @media (max-width: 640px) {
    padding: 26px 20px 44px;
  }
`;
const DetailBackLink = styled(Link)`
  min-height: 44px;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${palette.greenDark};
  font-size: 13px;
  font-weight: 750;
  &:hover {
    color: ${palette.green};
    text-decoration: underline;
    text-underline-offset: 4px;
  }
`;
const HeroMeta = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 24px;
`;
const MetaPill = styled.span`
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid rgba(11, 98, 85, 0.16);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.58);
  color: ${palette.greenDark};
  font-size: 12px;
  font-weight: 650;
  backdrop-filter: blur(7px);
`;
const HeroCopy = styled.div`
  h1 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(38px, 5.2vw, 68px);
    line-height: 0.99;
    letter-spacing: -0.06em;
    margin: 20px 0 18px;
    max-width: 900px;
    font-weight: 760;
  }
  p {
    max-width: 770px;
    margin: 0;
    color: #314a45;
    font-size: clamp(17px, 1.7vw, 21px);
    line-height: 1.62;
  }
`;
const HeroFooter = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  margin-top: 34px;
  @media (max-width: 760px) {
    align-items: stretch;
    flex-direction: column;
    gap: 22px;
  }
`;
const DetailActions = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  button {
    min-height: 46px;
  }
  @media (max-width: 480px) {
    button {
      flex: 1;
    }
  }
`;
const HeroFacts = styled.div`
  display: flex;
  gap: 28px;
  padding: 0 2px 2px;
  div {
    min-width: 130px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  small {
    color: #53706a;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  strong {
    color: ${palette.greenDark};
    font-size: 14px;
  }
  @media (max-width: 480px) {
    justify-content: space-between;
    gap: 16px;
    div {
      min-width: 0;
    }
  }
`;
const DetailPageSurface = styled.main`
  max-width: 1192px;
  margin: auto;
  padding: 72px 24px 104px;
  @media (max-width: 760px) {
    padding: 44px 20px 72px;
  }
`;
const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: clamp(44px, 6vw, 78px);
  align-items: start;
  @media (max-width: 940px) {
    grid-template-columns: 1fr;
  }
`;
const StoryColumn = styled.article`
  min-width: 0;
`;
const ContentSection = styled.section`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: 22px;
  padding: 0 0 42px;
  margin-bottom: 42px;
  border-bottom: 1px solid ${palette.line};
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(28px, 3vw, 38px);
    line-height: 1.1;
    letter-spacing: -0.045em;
    margin: 8px 0 16px;
    font-weight: 740;
  }
  p {
    max-width: 70ch;
    margin: 0;
    color: #334b46;
    font-size: 17px;
    line-height: 1.82;
    white-space: pre-line;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
    gap: 14px;
    padding-bottom: 32px;
    margin-bottom: 32px;
  }
`;
const SectionIndex = styled.span`
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border: 1px solid #c8dacf;
  border-radius: 50%;
  background: white;
  color: ${palette.green};
  font-family: "Roboto Mono", monospace;
  font-size: 11px;
  font-weight: 750;
`;
const HighlightGrid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin: 0 0 52px;
  @media (max-width: 690px) {
    grid-template-columns: 1fr;
  }
`;
const HighlightCard = styled.article<{ $accent?: boolean }>`
  min-width: 0;
  padding: 26px;
  border: 1px solid ${({ $accent }) => ($accent ? "#f0d9a8" : "#cfe1d3")};
  border-radius: 18px;
  background: ${({ $accent }) => ($accent ? "#fffaf0" : "#edf7ef")};
  > span:first-of-type {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    margin-bottom: 22px;
    border-radius: 11px;
    background: ${({ $accent }) => ($accent ? "#f5dfaf" : "#d8ebdc")};
    color: ${({ $accent }) => ($accent ? palette.warning : palette.green)};
  }
  h2 {
    margin: 7px 0 12px;
    font-size: 23px;
    letter-spacing: -0.035em;
  }
  p {
    margin: 0;
    color: #40534f;
    font-size: 14px;
    line-height: 1.72;
    white-space: pre-line;
  }
`;
const SupportingDetailSection = styled.section`
  padding: 36px 0 44px;
  border-top: 1px solid ${palette.line};
  > p {
    color: ${palette.muted};
  }
`;
const SectionHeading = styled.div`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  margin-bottom: 22px;
  > span {
    width: 42px;
    height: 42px;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: ${palette.soft};
    color: ${palette.green};
  }
  h2 {
    margin: 6px 0 4px;
    font-size: 28px;
    letter-spacing: -0.04em;
  }
  p {
    margin: 0;
    color: ${palette.muted};
    font-size: 13px;
    line-height: 1.55;
  }
`;
const DisclosureGrid = styled.div`
  display: grid;
  gap: 9px;
`;
const DetailDisclosure = styled.details`
  border: 1px solid ${palette.line};
  border-radius: 13px;
  background: white;
  overflow: hidden;
  summary {
    min-height: 54px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 13px 16px;
    color: ${palette.greenDark};
    font-size: 14px;
    font-weight: 750;
    list-style: none;
    cursor: pointer;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:focus-visible {
    outline-offset: -3px;
  }
  summary > span:last-of-type {
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: ${palette.soft};
    color: ${palette.green};
    font-size: 18px;
    font-weight: 500;
    transition: transform 160ms ease;
  }
  &[open] summary > span:last-of-type {
    transform: rotate(45deg);
  }
  p {
    margin: 0;
    padding: 0 16px 18px;
    color: #40534f;
    font-size: 14px;
    line-height: 1.75;
    white-space: pre-line;
  }
  &:hover {
    border-color: #b9d2c1;
  }
`;
const Timeline = styled.div`
  > div {
    display: grid;
    grid-template-columns: 24px 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 14px 0;
    border-bottom: 1px solid ${palette.line};
  }
  svg {
    color: ${palette.green};
  }
  span {
    display: flex;
    flex-direction: column;
  }
  small {
    color: ${palette.muted};
  }
`;
const ResourceList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 18px;
  a {
    min-height: 72px;
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 20px;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid ${palette.line};
    border-radius: 13px;
    background: white;
    color: ${palette.ink};
    text-decoration: none;
  }
  a:hover {
    border-color: ${palette.green};
    background: ${palette.soft};
    transform: translateY(-1px);
  }
  span {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }
  strong,
  small {
    overflow-wrap: anywhere;
  }
  small {
    color: ${palette.muted};
    font-size: 12px;
  }
  svg {
    color: ${palette.green};
  }
`;
const DetailAside = styled.aside`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  @media (max-width: 940px) {
    position: static;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;
const AsideCard = styled.section`
  overflow: hidden;
  border: 1px solid ${palette.line};
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 9px 28px rgba(16, 42, 39, 0.055);
  padding: 20px;
`;
const AsideCardHeader = styled.div`
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  gap: 11px;
  align-items: center;
  margin-bottom: 18px;
  > span {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: ${palette.soft};
    color: ${palette.green};
  }
  div {
    min-width: 0;
  }
  small {
    color: ${palette.green};
    font-size: 9px;
    font-weight: 850;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }
  h2 {
    margin: 2px 0 0;
    font-size: 17px;
    letter-spacing: -0.03em;
  }
`;
const SnapshotList = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 13px 0;
    border-top: 1px solid ${palette.line};
    &:nth-of-type(odd) {
      padding-right: 13px;
    }
    &:nth-of-type(even) {
      padding-left: 13px;
      border-left: 1px solid ${palette.line};
    }
  }
  span {
    font-size: 9px;
    color: ${palette.muted};
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.05em;
  }
  strong {
    font-size: 13px;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }
`;
const MetricStack = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  div {
    display: flex;
    flex-direction: column;
    padding: 13px;
    border-radius: 11px;
    background: ${palette.soft};
  }
  strong {
    font-family: "Roboto Mono", monospace;
    font-size: 26px;
    color: ${palette.green};
    line-height: 1.15;
    font-weight: 600;
  }
  span {
    font-size: 11px;
    color: ${palette.muted};
  }
`;
const Owner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  > span {
    width: 48px;
    height: 48px;
    border-radius: 14px;
    display: grid;
    place-items: center;
    background: ${palette.green};
    color: white;
    font-weight: 800;
  }
  div {
    display: flex;
    flex-direction: column;
  }
  small {
    color: ${palette.muted};
  }
`;
const Notice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: ${palette.warningSoft};
  color: ${palette.warning};
  padding: 15px;
  border: 1px solid #fedf89;
  border-radius: 14px;
  font-size: 11px;
  p {
    margin: 0;
  }
  svg {
    flex: none;
  }
  @media (max-width: 940px) {
    grid-column: 1 / -1;
  }
  @media (max-width: 620px) {
    grid-column: auto;
  }
`;
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 18px;
  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
`;
const BarChart = styled.div`
  height: 250px;
  display: flex;
  align-items: end;
  gap: 12px;
  padding-top: 20px;
  border-bottom: 1px solid ${palette.line};
  > div {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
    gap: 7px;
  }
  span {
    display: block;
    width: min(46px, 80%);
    background: ${palette.green};
    border-radius: 7px 7px 0 0;
    min-height: 6px;
  }
  small {
    color: ${palette.muted};
  }
`;
const SectorList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 17px;
  > div > span {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-bottom: 6px;
  }
  small {
    color: ${palette.muted};
  }
  > div > div {
    height: 8px;
    border-radius: 999px;
    background: #ecf0ed;
    overflow: hidden;
  }
  i {
    display: block;
    height: 100%;
    background: ${palette.lime};
    border-radius: inherit;
  }
`;
const AuthShell = styled.main`
  min-height: 100dvh;
  max-width: 1240px;
  margin: auto;
  padding: 22px 24px;
`;
const AuthBrand = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;
const AuthGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 460px;
  gap: 80px;
  align-items: center;
  min-height: calc(100dvh - 90px);
  @media (max-width: 850px) {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 45px 0;
  }
`;
const AuthIntro = styled.div`
  h1 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(32px, 3.7vw, 48px);
    line-height: 1.08;
    letter-spacing: -0.05em;
    margin: 12px 0;
    font-weight: 700;
  }
  p {
    color: ${palette.muted};
    font-size: 17px;
    max-width: 580px;
  }
`;
const AuthTrust = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 30px;
  color: ${palette.green};
  max-width: 500px;
  div {
    display: flex;
    flex-direction: column;
  }
  span {
    font-size: 12px;
    color: ${palette.muted};
    margin-top: 2px;
  }
`;
const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 17px;
`;
const RoleChoices = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-top: 8px;
  label {
    min-height: 62px;
    border: 1px solid ${palette.line};
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
  }
  label.selected {
    border-color: ${palette.green};
    background: ${palette.soft};
  }
  input {
    width: 18px;
    height: 18px;
    accent-color: ${palette.green};
  }
  span {
    display: flex;
    flex-direction: column;
  }
  b {
    font-size: 13px;
  }
  small {
    color: ${palette.muted};
    font-size: 11px;
  }
  fieldset {
    border: 0;
    padding: 0;
    margin: 0;
  }
  legend {
    font-size: 13px;
    font-weight: 700;
  }
`;
const AuthLinks = styled.div`
  display: flex;
  justify-content: space-between;
  color: ${palette.green};
  font-size: 12px;
  font-weight: 700;
`;
const FormError = styled.div`
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef3f2;
  color: ${palette.danger};
  font-size: 12px;
`;
const DemoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;
const DemoCard = styled(Panel)`
  padding: 20px;
  display: grid;
  grid-template-columns: 50px 1fr;
  gap: 14px;
  align-items: start;
  > div h2 {
    font-size: 17px;
    margin: 7px 0 1px;
  }
  > div p {
    font-size: 12px;
    color: ${palette.muted};
    margin: 0;
  }
  > button {
    grid-column: 1/-1;
  }
`;
const Avatar = styled.span`
  width: 48px;
  height: 48px;
  border-radius: 13px;
  background: ${palette.green};
  color: white;
  display: grid;
  place-items: center;
  font-weight: 800;
`;
const RoleLabel = styled.div`
  grid-column: 1/-1;
  padding: 10px;
  border-radius: 8px;
  background: ${palette.soft};
  font-size: 11px;
  color: ${palette.green};
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.05em;
`;
const AboutSectionTitle = styled.div`
  margin: 64px 0 28px;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(24px, 2.5vw, 34px);
    letter-spacing: -0.04em;
    font-weight: 800;
    margin: 8px 0 8px;
    color: ${palette.ink};
  }
  p {
    color: ${palette.muted};
    font-size: 15px;
    margin: 0;
    max-width: 680px;
  }
`;

const ProcessTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ProcessStepCard = styled.div`
  background: white;
  border: 1px solid #e1ece4;
  border-radius: 20px;
  padding: 30px;
  display: grid;
  grid-template-columns: 70px 1fr;
  gap: 24px;
  box-shadow: 0 4px 16px #102a2705;
  transition: all 0.2s ease;
  &:hover {
    border-color: ${palette.green};
    box-shadow: 0 10px 28px #102a270c;
  }
  @media (max-width: 650px) {
    grid-template-columns: 1fr;
    gap: 16px;
  }
`;

const ProcessStepNum = styled.div`
  font-family: "Roboto Mono", monospace;
  font-size: 28px;
  font-weight: 800;
  color: ${palette.green};
  background: #f0f7f2;
  border-radius: 16px;
  height: 70px;
  display: grid;
  place-items: center;
  border: 1px solid #dcebdf;
`;

const ProcessStepContent = styled.div`
  > p {
    color: ${palette.muted};
    font-size: 14px;
    line-height: 1.6;
    margin: 8px 0 16px;
  }
`;

const ProcessStepHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  svg {
    color: ${palette.green};
  }
  h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: ${palette.ink};
  }
`;

const ProcessPoints = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  div {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: ${palette.ink};
    svg {
      color: ${palette.green};
      flex-shrink: 0;
    }
  }
`;

const WorkspaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 580px) {
    grid-template-columns: 1fr;
  }
`;

const WorkspaceCard = styled.div`
  background: white;
  border: 1px solid #e1ece4;
  border-radius: 20px;
  padding: 26px 22px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px #102a2705;
  p {
    font-size: 13px;
    color: ${palette.muted};
    margin: 0 0 16px;
    line-height: 1.5;
  }
  ul {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    li {
      font-size: 12px;
      color: ${palette.ink};
      line-height: 1.5;
    }
  }
`;

const WorkspaceCardHeader = styled.div`
  margin-bottom: 12px;
  span {
    font-family: "Roboto Mono", monospace;
    font-size: 12px;
    font-weight: 800;
    color: ${palette.green};
    text-transform: uppercase;
    display: block;
    margin-bottom: 4px;
  }
  h3 {
    font-size: 17px;
    font-weight: 700;
    margin: 0;
    color: ${palette.ink};
  }
`;

const PrincipleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const PrincipleCard = styled.div`
  background: white;
  border: 1px solid #e1ece4;
  border-radius: 18px;
  padding: 24px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  box-shadow: 0 4px 14px #102a2704;
  svg {
    color: ${palette.green};
    flex-shrink: 0;
    margin-top: 2px;
  }
  h3 {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px;
    color: ${palette.ink};
  }
  p {
    font-size: 13px;
    color: ${palette.muted};
    line-height: 1.55;
    margin: 0;
  }
`;

const AboutCta = styled.div`
  background: #142f2b;
  color: white;
  border-radius: 22px;
  padding: 48px 36px;
  text-align: center;
  margin-top: 64px;
  box-shadow: 0 20px 50px #102a2720;
  h2 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: clamp(22px, 2.8vw, 36px);
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0 0 12px;
  }
  p {
    color: #cbe0d8;
    font-size: 15px;
    max-width: 580px;
    margin: 0 auto 28px;
    line-height: 1.6;
  }
  div {
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }
`;

const StatePage = styled.main`

  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  > strong {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    color: ${palette.green};
    font-size: 64px;
    line-height: 1;
    margin-top: 40px;
    font-weight: 700;
  }
  h1 {
    font-family: Inter, "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    font-size: 34px;
    margin: 10px 0;
    font-weight: 700;
  }
  p {
    color: ${palette.muted};
    max-width: 550px;
    margin: 0 0 22px;
  }
`;
const Footer = styled.footer`
  max-width: 1240px;
  margin: auto;
  border-top: 1px solid ${palette.line};
  padding: 35px 24px;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 24px;
  color: ${palette.muted};
  font-size: 12px;
  div {
    display: flex;
    gap: 20px;
    font-weight: 700;
  }
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;
