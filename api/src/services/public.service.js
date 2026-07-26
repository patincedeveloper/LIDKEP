import { readFileSync } from 'node:fs';
import { AppError } from '../lib/http.js';

const fixturePath = new URL('../../../lidkep_mock_data.json', import.meta.url);
const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));

function publicInnovations() {
  return fixture.innovations.filter((innovation) => innovation.status === 'PUBLISHED');
}

function serializePublicInnovation(item) {
  // This allowlist is intentionally explicit: private contacts, verification evidence,
  // storage identifiers, and unpublished fields must never leak through object spreading.
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    summary: item.summary,
    problem: item.problem,
    solution: item.solution,
    beneficiaries: item.beneficiaries,
    sector: item.sector,
    category: item.category,
    district: item.district,
    maturity: item.maturity,
    status: item.status,
    impact: item.impact,
    supportNeeded: item.supportNeeded,
    owner: item.owner,
    organization: item.organization,
    publishedAt: item.publishedAt,
    version: item.version,
    views: item.views,
    saves: item.saves,
    imageTone: item.imageTone,
    metrics: item.metrics,
    milestones: item.milestones
  };
}

export function listPublicInnovations(filters) {
  const query = filters.q.toLowerCase();
  const filtered = publicInnovations().filter((item) => {
    const searchable = `${item.title} ${item.summary} ${item.problem} ${item.solution}`.toLowerCase();
    return (!query || searchable.includes(query))
      && (!filters.sector || item.sector === filters.sector)
      && (!filters.district || item.district === filters.district)
      && (!filters.maturity || item.maturity === filters.maturity);
  });
  const start = (filters.page - 1) * filters.pageSize;
  return {
    items: filtered.slice(start, start + filters.pageSize).map(serializePublicInnovation),
    total: filtered.length
  };
}

export function getPublicInnovation(slug) {
  const innovation = publicInnovations().find((item) => item.slug === slug);
  if (!innovation) {
    throw new AppError(404, 'INNOVATION_NOT_FOUND', 'The published innovation was not found.');
  }
  return serializePublicInnovation(innovation);
}

export function getPublicStatistics() {
  return fixture.statistics;
}

export function getPublicTaxonomies() {
  return fixture.taxonomies;
}

export function getDemoBootstrap() {
  return fixture;
}

export function recordDemoAction(input) {
  return { ...input, status: 'RECORDED_IN_DEMO', persisted: false, occurredAt: new Date().toISOString() };
}
