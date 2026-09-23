import { Router } from 'express';
import * as controller from '../controllers/engagements.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { createEngagementSchema, engagementEmptySchema, engagementSchema, respondEngagementSchema } from '../validators/engagement.validator.js';

export const engagementsRouter = Router();
engagementsRouter.use(authenticate);
engagementsRouter.get('/', authorize('INNOVATOR', 'INVESTOR_PARTNER'), validate(engagementEmptySchema), controller.list);
engagementsRouter.post('/', authorize('INVESTOR_PARTNER'), validate(createEngagementSchema), controller.create);
engagementsRouter.get('/:engagementId', authorize('INNOVATOR', 'INVESTOR_PARTNER'), validate(engagementSchema), controller.show);
engagementsRouter.post('/:engagementId/respond', authorize('INNOVATOR'), validate(respondEngagementSchema), controller.respond);
engagementsRouter.post('/:engagementId/withdraw', authorize('INVESTOR_PARTNER'), validate(engagementSchema), controller.withdraw);
