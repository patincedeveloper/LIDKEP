import { successResponse } from '../lib/http.js';
import { paginationMeta } from '../lib/pagination.js';
import {
  getPublicBootstrap,
  getPublicInnovation,
  getPublicStatistics,
  getPublicTaxonomies,
  listPublicInnovations,
} from '../services/public.service.js';

export async function listInnovations(req, res) {
  const { items, total } = await listPublicInnovations(req.validated.query);
  const { page, pageSize } = req.validated.query;
  res.json(successResponse(req, items, paginationMeta({ total, page, pageSize })));
}

export async function showInnovation(req, res) {
  res.json(successResponse(req, await getPublicInnovation(req.validated.params.slug)));
}

export async function statistics(req, res) {
  res.json(successResponse(req, await getPublicStatistics()));
}

export async function taxonomies(req, res) {
  res.json(successResponse(req, await getPublicTaxonomies()));
}

export async function publicBootstrap(req, res) {
  res.json(successResponse(req, await getPublicBootstrap()));
}
