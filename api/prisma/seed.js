import 'dotenv/config';
import { Algorithm, hash } from '@node-rs/argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const required = [
  'DATABASE_URL',
  'INITIAL_ADMIN_EMAIL',
  'INITIAL_ADMIN_PASSWORD',
  'INITIAL_INNOVATOR_EMAIL',
  'INITIAL_INNOVATOR_PASSWORD'
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`${name} is required to seed LIDKEP.`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const roles = ['SYSTEM_ADMINISTRATOR', 'INNOVATOR', 'EXPERT', 'INVESTOR_PARTNER', 'PUBLIC_USER'];
const taxonomies = {
  SECTOR: ['Agriculture', 'Climate & Energy', 'Education', 'Health', 'Manufacturing', 'Digital Services', 'Water & Sanitation'],
  CATEGORY: ['Product innovation', 'Process innovation', 'Service innovation', 'Social innovation'],
  DISTRICT: [
    'Bugesera', 'Burera', 'Gakenke', 'Gasabo', 'Gatsibo', 'Gicumbi', 'Gisagara', 'Huye',
    'Kamonyi', 'Karongi', 'Kayonza', 'Kicukiro', 'Kirehe', 'Muhanga', 'Musanze', 'Ngoma',
    'Ngororero', 'Nyabihu', 'Nyagatare', 'Nyamagabe', 'Nyamasheke', 'Nyanza', 'Nyarugenge',
    'Nyaruguru', 'Rubavu', 'Ruhango', 'Rulindo', 'Rusizi', 'Rutsiro', 'Rwamagana'
  ],
  MATURITY_LEVEL: ['M1 Idea', 'M2 Concept', 'M3 Prototype', 'M4 Pilot', 'M5 Operational', 'M6 Scaling'],
  IMPACT_AREA: ['Food security', 'Green jobs', 'Health access', 'Learning outcomes', 'Climate resilience', 'Financial inclusion']
};
const argonOptions = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };
const defaultEvaluationCriteria = [
  { name: 'Problem relevance', guidance: 'Assess how clearly the submission defines an important, evidence-based problem.', weight: 20 },
  { name: 'Solution quality', guidance: 'Assess whether the proposed solution is coherent, appropriate, and meaningfully different.', weight: 20 },
  { name: 'Feasibility', guidance: 'Assess the implementation plan, resources, risks, and likelihood of successful delivery.', weight: 20 },
  { name: 'Potential impact', guidance: 'Assess the expected value for beneficiaries and the strength of the stated outcomes.', weight: 20 },
  { name: 'Maturity and evidence', guidance: 'Assess readiness, validation completed, and the quality of supporting evidence.', weight: 20 }
];

function codeFor(label) {
  return label.toUpperCase().replace(/&/g, 'AND').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function createInitialUser({ email, password, roleCode, name, organization, district }) {
  const normalizedEmail = email.toLowerCase();
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    // Prototype seed accounts should open their workspace immediately. Do not
    // reset their password when seeding an existing local database.
    if (existingUser.mustChangePassword) {
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { mustChangePassword: false }
      });
    }
    return;
  }
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hash(password, argonOptions),
      roleId: role.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      mustChangePassword: false,
      profile: {
        create: { displayName: name, organization, district, publicProfile: roleCode === 'INNOVATOR' }
      }
    }
  });
}

async function main() {
  for (const code of roles) {
    await prisma.role.upsert({
      where: { code },
      update: { isActive: true },
      create: { code, name: code.split('_').map((part) => part[0] + part.slice(1).toLowerCase()).join(' ') }
    });
  }
  for (const [type, labels] of Object.entries(taxonomies)) {
    for (const [sortOrder, label] of labels.entries()) {
      const code = codeFor(label);
      await prisma.taxonomy.upsert({
        where: { type_code: { type, code } },
        update: { label, sortOrder, isActive: true },
        create: { type, code, label, sortOrder }
      });
    }
  }
  await createInitialUser({
    email: process.env.INITIAL_ADMIN_EMAIL,
    password: process.env.INITIAL_ADMIN_PASSWORD,
    roleCode: 'SYSTEM_ADMINISTRATOR',
    name: 'LIDKEP Super Administrator',
    organization: 'LIDKEP Secretariat',
    district: 'Gasabo'
  });
  await createInitialUser({
    email: process.env.INITIAL_INNOVATOR_EMAIL,
    password: process.env.INITIAL_INNOVATOR_PASSWORD,
    roleCode: 'INNOVATOR',
    name: 'Initial Innovator',
    organization: 'Independent Innovator',
    district: 'Gasabo'
  });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: process.env.INITIAL_ADMIN_EMAIL.toLowerCase() } });
  let defaultCriteria = await prisma.evaluationCriteriaVersion.findUnique({ where: { version: 'v1.0' } });
  const activeCriteria = await prisma.evaluationCriteriaVersion.findFirst({ where: { status: 'ACTIVE' } });
  if (!defaultCriteria) {
    defaultCriteria = await prisma.evaluationCriteriaVersion.create({
      data: {
        version: 'v1.0',
        name: 'National innovation evaluation',
        status: activeCriteria ? 'DRAFT' : 'ACTIVE',
        createdById: admin.id,
        activatedAt: activeCriteria ? null : new Date(),
        criteria: {
          create: defaultEvaluationCriteria.map((criterion, sortOrder) => ({
            ...criterion,
            key: codeFor(criterion.name),
            sortOrder
          }))
        }
      }
    });
  }
  if (!activeCriteria && defaultCriteria.status !== 'ACTIVE') {
    await prisma.evaluationCriteriaVersion.update({
      where: { id: defaultCriteria.id },
      data: { status: 'ACTIVE', activatedAt: new Date(), retiredAt: null }
    });
  }
  console.log('LIDKEP production seed completed: reference data and two initial accounts.');
}

main()
  .catch((error) => {
    console.error('LIDKEP seed failed.', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
