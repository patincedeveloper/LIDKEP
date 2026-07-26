import { Router } from 'express';
import {
  demoAction,
  demoBootstrap,
  listInnovations,
  showInnovation,
  statistics,
  taxonomies
} from '../controllers/public.controller.js';
import { validate } from '../middleware/validate.js';
import {
  demoActionSchema,
  emptyRequestSchema,
  publicInnovationDetailSchema,
  publicInnovationListSchema
} from '../validators/public.validator.js';

export const publicRouter = Router();

publicRouter.get('/demo/bootstrap', validate(emptyRequestSchema), demoBootstrap);
publicRouter.post('/demo/actions', validate(demoActionSchema), demoAction);
publicRouter.get('/public/innovations', validate(publicInnovationListSchema), listInnovations);
publicRouter.get('/public/innovations/:slug', validate(publicInnovationDetailSchema), showInnovation);
publicRouter.get('/public/statistics', validate(emptyRequestSchema), statistics);
publicRouter.get('/taxonomies', validate(emptyRequestSchema), taxonomies);
