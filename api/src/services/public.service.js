import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';

const taxonomyKeys = {
  SECTOR: 'sectors',
  CATEGORY: 'categories',
  DISTRICT: 'districts',
  MATURITY_LEVEL: 'maturityLevels',
  IMPACT_AREA: 'impactAreas'
};

export function serializeInnovation(innovation, version = innovation.publishedVersion ?? innovation.versions?.[0]) {
  if (!version) return null;
  return {
    id: innovation.id,
    slug: innovation.slug,
    title: version.title,
    summary: version.summary,
    problem: version.problem,
    solution: version.solution,
    beneficiaries: version.beneficiaries,
    sector: version.sector,
    category: version.category,
    district: version.district,
    maturity: version.maturity,
    status: innovation.status,
    impact: version.impact,
    supportNeeded: version.supportNeeded,
    owner: version.ownerDisplaySnapshot ?? 'LIDKEP innovator',
    organization: version.organizationSnapshot ?? '',
    publishedAt: innovation.publishedAt?.toISOString() ?? '',
    version: version.versionNumber,
    completion: version.completionPercent,
    views: 0,
    saves: 0,
    imageTone: 'mint',
    evidence: [],
    metrics: Array.isArray(version.metrics) ? version.metrics : [],
    milestones: (innovation.milestones ?? []).map((item) => ({
      title: item.title,
      date: item.completedAt?.toISOString() ?? item.targetDate?.toISOString() ?? '',
      status: item.status
    }))
  };
}

export async function listPublicInnovations(filters) {
  const where = {
    status: 'PUBLISHED',
    publishedVersion: {
      is: {
        ...(filters.q ? {
          OR: [
            { title: { contains: filters.q, mode: 'insensitive' } },
            { summary: { contains: filters.q, mode: 'insensitive' } },
            { problem: { contains: filters.q, mode: 'insensitive' } },
            { solution: { contains: filters.q, mode: 'insensitive' } }
          ]
        } : {}),
        ...(filters.sector ? { sector: filters.sector } : {}),
        ...(filters.district ? { district: filters.district } : {}),
        ...(filters.maturity ? { maturity: filters.maturity } : {})
      }
    }
  };
  const [total, records] = await prisma.$transaction([
    prisma.innovation.count({ where }),
    prisma.innovation.findMany({
      where,
      include: { publishedVersion: true, milestones: { where: { visibility: 'PUBLIC' } } },
      orderBy: { publishedAt: 'desc' },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize
    })
  ]);
  return { items: records.map((item) => serializeInnovation(item)), total };
}

export async function getPublicInnovation(slug) {
  const innovation = await prisma.innovation.findFirst({
    where: { slug, status: 'PUBLISHED', publishedVersionId: { not: null } },
    include: { publishedVersion: true, milestones: { where: { visibility: 'PUBLIC' } } }
  });
  if (!innovation) throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The published innovation was not found.');
  return serializeInnovation(innovation);
}

export async function getPublicStatistics() {
  const [publishedInnovations, districts, activeExperts, collaborationRequests] = await Promise.all([
    prisma.innovation.count({ where: { status: 'PUBLISHED' } }),
    prisma.innovationVersion.findMany({
      where: { publishedFor: { isNot: null } },
      distinct: ['district'],
      select: { district: true }
    }),
    prisma.user.count({ where: { role: { code: 'EXPERT' }, status: 'ACTIVE' } }),
    prisma.engagement.count()
  ]);
  return {
    publishedInnovations,
    districtsReached: districts.length,
    activeExperts,
    collaborationRequests,
    monthlySubmissions: [0, 0, 0, 0, 0, publishedInnovations],
    sectorDistribution: []
  };
}

export async function getPublicTaxonomies() {
  const records = await prisma.taxonomy.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }]
  });
  const result = { sectors: [], categories: [], districts: [], maturityLevels: [], impactAreas: [] };
  for (const item of records) {
    const key = taxonomyKeys[item.type];
    if (key) result[key].push(item.label);
  }
  return result;
}

export async function getPublicBootstrap() {
  const [listed, statistics, taxonomies] = await Promise.all([
    listPublicInnovations({ q: '', sector: '', district: '', maturity: '', page: 1, pageSize: 100 }),
    getPublicStatistics(),
    getPublicTaxonomies()
  ]);
  return { innovations: listed.items, statistics, taxonomies };
}
