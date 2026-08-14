import { Router } from 'express';
import * as controller from '../controllers/innovations.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { uploadEvidence } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import {
  createInnovationSchema, createMilestoneSchema, innovationIdSchema,
  respondRevisionSchema, updateInnovationSchema
} from '../validators/innovation.validator.js';

export const innovationsRouter = Router();

innovationsRouter.use(authenticate);
innovationsRouter.get('/', authorize('INNOVATOR', 'SYSTEM_ADMINISTRATOR'), controller.list);
innovationsRouter.post('/', authorize('INNOVATOR'), validate(createInnovationSchema), controller.create);
innovationsRouter.get('/:id', authorize('INNOVATOR', 'SYSTEM_ADMINISTRATOR'), validate(innovationIdSchema), controller.show);
innovationsRouter.patch('/:id', authorize('INNOVATOR', 'SYSTEM_ADMINISTRATOR'), validate(updateInnovationSchema), controller.update);
innovationsRouter.post('/:id/submit', authorize('INNOVATOR'), validate(innovationIdSchema), controller.submit);
innovationsRouter.post('/:id/milestones', authorize('INNOVATOR'), validate(createMilestoneSchema), controller.addMilestone);
innovationsRouter.post('/:id/evidence', authorize('INNOVATOR'), uploadEvidence.single('file'), controller.uploadEvidence);
innovationsRouter.get('/:id/evidence/:evidenceId/download', authorize('INNOVATOR', 'SYSTEM_ADMINISTRATOR'), controller.downloadEvidence);
innovationsRouter.post('/:id/revisions/:revisionId/respond', authorize('INNOVATOR'), validate(respondRevisionSchema), controller.respondRevision);
