import { Router } from 'express';
import {
  listInnovations,
  downloadEvidence,
  publicBootstrap,
  showInnovation,
  statistics,
  taxonomies
} from '../controllers/public.controller.js';
import { validate } from '../middleware/validate.js';
import {
  emptyRequestSchema,
  publicEvidenceDownloadSchema,
  publicInnovationDetailSchema,
  publicInnovationListSchema
} from '../validators/public.validator.js';

export const publicRouter = Router();

publicRouter.get('/public/bootstrap', validate(emptyRequestSchema), publicBootstrap);
publicRouter.get('/public/innovations', validate(publicInnovationListSchema), listInnovations);
publicRouter.get('/public/innovations/:slug/evidence/:evidenceId/download', validate(publicEvidenceDownloadSchema), downloadEvidence);
publicRouter.get('/public/innovations/:slug', validate(publicInnovationDetailSchema), showInnovation);
publicRouter.get('/public/statistics', validate(emptyRequestSchema), statistics);
publicRouter.get('/taxonomies', validate(emptyRequestSchema), taxonomies);
