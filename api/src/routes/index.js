import { Router } from 'express';
import { health } from '../controllers/health.controller.js';
import { validate } from '../middleware/validate.js';
import { emptyRequestSchema } from '../validators/public.validator.js';
import { adminRouter } from './admin.routes.js';
import { authRouter } from './auth.routes.js';
import { engagementsRouter } from './engagements.routes.js';
import { innovationsRouter } from './innovations.routes.js';
import { publicRouter } from './public.routes.js';
import { reviewsRouter } from './reviews.routes.js';
import { usersRouter } from './users.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', validate(emptyRequestSchema), health);
apiRouter.use(publicRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/innovations', innovationsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/engagements', engagementsRouter);
apiRouter.use('/admin', adminRouter);
