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
  DISTRICT: ['Gasabo', 'Huye', 'Kicukiro', 'Musanze', 'Nyagatare', 'Nyarugenge', 'Rubavu'],
  MATURITY_LEVEL: ['M1 Idea', 'M2 Concept', 'M3 Prototype', 'M4 Pilot', 'M5 Operational', 'M6 Scaling'],
  IMPACT_AREA: ['Food security', 'Green jobs', 'Health access', 'Learning outcomes', 'Climate resilience', 'Financial inclusion']
};
const argonOptions = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1, outputLen: 32 };

function codeFor(label) {
  return label.toUpperCase().replace(/&/g, 'AND').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

async function createInitialUser({ email, password, roleCode, name, organization, district }) {
  const normalizedEmail = email.toLowerCase();
  if (await prisma.user.findUnique({ where: { email: normalizedEmail } })) return;
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash: await hash(password, argonOptions),
      roleId: role.id,
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
      mustChangePassword: true,
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
  if (!await prisma.evaluationCriteriaVersion.findUnique({ where: { version: 'v1.0' } })) {
    await prisma.evaluationCriteriaVersion.create({
      data: {
        version: 'v1.0',
        name: 'National innovation evaluation',
        status: 'ACTIVE',
        createdById: admin.id,
        activatedAt: new Date(),
        criteria: {
          create: ['Problem relevance', 'Solution quality', 'Feasibility', 'Potential impact', 'Maturity and evidence']
            .map((name, sortOrder) => ({ key: codeFor(name), name, weight: 20, sortOrder }))
        }
      }
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
