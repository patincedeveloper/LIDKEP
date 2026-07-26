import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to seed LIDKEP.');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const fixture = JSON.parse(readFileSync(new URL('../../lidkep_mock_data.json', import.meta.url), 'utf8'));

const roleIds = {
  SYSTEM_ADMINISTRATOR: '10000000-0000-4000-8000-000000000001',
  INNOVATOR: '10000000-0000-4000-8000-000000000002',
  EXPERT: '10000000-0000-4000-8000-000000000003',
  INVESTOR_PARTNER: '10000000-0000-4000-8000-000000000004',
  PUBLIC_USER: '10000000-0000-4000-8000-000000000005'
};

const userIds = {
  'admin-1': '20000000-0000-4000-8000-000000000001',
  'innovator-1': '20000000-0000-4000-8000-000000000002',
  'expert-1': '20000000-0000-4000-8000-000000000003',
  'investor-1': '20000000-0000-4000-8000-000000000004',
  'public-1': '20000000-0000-4000-8000-000000000005'
};

const innovationIds = {
  'solar-cold-chain': '30000000-0000-4000-8000-000000000001',
  'maternal-care': '30000000-0000-4000-8000-000000000002',
  'circular-bricks': '30000000-0000-4000-8000-000000000003',
  'smart-irrigation': '30000000-0000-4000-8000-000000000004',
  'school-lab': '30000000-0000-4000-8000-000000000005',
  'water-kiosk': '30000000-0000-4000-8000-000000000006'
};

const versionIds = Object.fromEntries(
  Object.keys(innovationIds).map((key, index) => [key, `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`])
);

const taxonomyGroups = {
  sectors: 'SECTOR',
  categories: 'CATEGORY',
  districts: 'DISTRICT',
  maturityLevels: 'MATURITY_LEVEL',
  impactAreas: 'IMPACT_AREA'
};

function codeFor(label) {
  return label.toUpperCase().replace(/&/g, 'AND').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function seedRolesAndUsers() {
  for (const code of fixture.roles) {
    await prisma.role.upsert({
      where: { code },
      update: { isActive: true },
      create: { id: roleIds[code], code, name: code.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ') }
    });
  }

  for (const account of fixture.demoAccounts) {
    const userId = userIds[account.id];
    await prisma.user.upsert({
      where: { email: account.email.toLowerCase() },
      update: { roleId: roleIds[account.role], status: account.accountStatus, mfaEnabled: account.mfaEnabled },
      create: {
        id: userId,
        email: account.email.toLowerCase(),
        roleId: roleIds[account.role],
        status: account.accountStatus,
        emailVerifiedAt: account.verified ? new Date('2026-01-01T00:00:00.000Z') : null,
        mfaEnabled: account.mfaEnabled
      }
    });
    await prisma.userProfile.upsert({
      where: { userId },
      update: { displayName: account.name, organization: account.organization || null, district: account.district },
      create: {
        userId,
        displayName: account.name,
        organization: account.organization || null,
        district: account.district,
        publicProfile: account.role !== 'SYSTEM_ADMINISTRATOR'
      }
    });
  }
}

async function seedTaxonomies() {
  for (const [fixtureKey, type] of Object.entries(taxonomyGroups)) {
    for (const [sortOrder, label] of fixture.taxonomies[fixtureKey].entries()) {
      const code = codeFor(label);
      await prisma.taxonomy.upsert({
        where: { type_code: { type, code } },
        update: { label, sortOrder, isActive: true },
        create: { type, code, label, sortOrder }
      });
    }
  }
}

async function seedInnovations() {
  const ownerId = userIds['innovator-1'];
  for (const item of fixture.innovations) {
    const innovationId = innovationIds[item.id];
    const existing = await prisma.innovation.findUnique({ where: { id: innovationId } });
    if (existing) continue;

    const innovation = await prisma.innovation.create({
      data: {
        id: innovationId,
        ownerId,
        slug: item.slug,
        status: item.status,
        publishedAt: item.publishedAt ? new Date(`${item.publishedAt}T00:00:00.000Z`) : null
      }
    });
    const immutable = item.status === 'DRAFT' ? null : new Date('2026-07-01T00:00:00.000Z');
    const version = await prisma.innovationVersion.create({
      data: {
        id: versionIds[item.id],
        innovationId: innovation.id,
        versionNumber: Math.max(item.version, 1),
        title: item.title,
        summary: item.summary,
        problem: item.problem,
        solution: item.solution,
        beneficiaries: item.beneficiaries,
        sector: item.sector,
        category: item.category,
        district: item.district,
        maturity: item.maturity,
        impact: item.impact,
        supportNeeded: item.supportNeeded,
        organizationSnapshot: item.organization,
        ownerDisplaySnapshot: item.owner,
        metrics: item.metrics,
        completionPercent: item.completion,
        submittedAt: immutable,
        immutableAt: immutable
      }
    });
    if (item.status === 'PUBLISHED') {
      await prisma.innovation.update({ where: { id: innovation.id }, data: { publishedVersionId: version.id } });
    }
    for (const [index, milestone] of item.milestones.entries()) {
      await prisma.milestone.create({
        data: {
          id: `50000000-0000-4000-8000-${String(Object.keys(innovationIds).indexOf(item.id) * 10 + index + 1).padStart(12, '0')}`,
          innovationId: innovation.id,
          title: milestone.title,
          description: milestone.date,
          status: milestone.status,
          visibility: item.status === 'PUBLISHED' ? 'PUBLIC' : 'REVIEW_TEAM'
        }
      });
    }
  }
}

async function seedCriteria() {
  const source = fixture.criteria[0];
  const existing = await prisma.evaluationCriteriaVersion.findUnique({ where: { version: source.version } });
  if (existing) return;
  await prisma.evaluationCriteriaVersion.create({
    data: {
      id: '60000000-0000-4000-8000-000000000001',
      version: source.version,
      name: source.name,
      status: source.status,
      createdById: userIds['admin-1'],
      activatedAt: new Date('2026-01-01T00:00:00.000Z'),
      criteria: {
        create: Object.entries(source.weights).map(([name, weight], index) => ({
          key: codeFor(name),
          name,
          weight,
          sortOrder: index
        }))
      }
    }
  });
}

async function main() {
  await seedRolesAndUsers();
  await seedTaxonomies();
  await seedInnovations();
  await seedCriteria();
  console.log('LIDKEP Phase 1 seed completed.');
}

main()
  .catch((error) => {
    console.error('LIDKEP seed failed.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
