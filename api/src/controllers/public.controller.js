import { env } from '../config/env.js';
import { AppError, successResponse } from '../lib/http.js';
import { paginationMeta } from '../lib/pagination.js';
import {
  getDemoBootstrap,
  getPublicInnovation,
  getPublicStatistics,
  getPublicTaxonomies,
  listPublicInnovations,
  recordDemoAction
} from '../services/public.service.js';

export function listInnovations(req, res) {
  const { items, total } = listPublicInnovations(req.validated.query);
  const { page, pageSize } = req.validated.query;
  res.json(successResponse(req, items, paginationMeta({ total, page, pageSize })));
}

export function showInnovation(req, res) {
  res.json(successResponse(req, getPublicInnovation(req.validated.params.slug)));
}

export function statistics(req, res) {
  res.json(successResponse(req, getPublicStatistics()));
}

export function taxonomies(req, res) {
  res.json(successResponse(req, getPublicTaxonomies()));
}

export function demoBootstrap(req, res) {
  if (!env.ENABLE_DEMO_ROUTES) throw new AppError(404, 'ROUTE_NOT_FOUND', 'The requested API route does not exist.');
  res.json(successResponse(req, getDemoBootstrap()));
}

export function demoAction(req, res) {
  if (!env.ENABLE_DEMO_ROUTES) throw new AppError(404, 'ROUTE_NOT_FOUND', 'The requested API route does not exist.');
  res.status(201).json(successResponse(req, recordDemoAction(req.validated.body)));
}
