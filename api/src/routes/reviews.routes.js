import { Router } from 'express';
import * as controller from '../controllers/reviews.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { assignmentSchema, reviewEmptySchema, saveReviewSchema, submitReviewSchema } from '../validators/review.validator.js';

export const reviewsRouter = Router();
reviewsRouter.use(authenticate, authorize('EXPERT'));
reviewsRouter.get('/assignments', validate(reviewEmptySchema), controller.assignments);
reviewsRouter.get('/assignments/:assignmentId', validate(assignmentSchema), controller.assignment);
reviewsRouter.post('/assignments/:assignmentId/accept', validate(assignmentSchema), controller.accept);
reviewsRouter.put('/assignments/:assignmentId', validate(saveReviewSchema), controller.save);
reviewsRouter.post('/assignments/:assignmentId/submit', validate(submitReviewSchema), controller.submit);
