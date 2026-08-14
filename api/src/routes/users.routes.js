import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { markNotificationsRead, notifications, profile, submitProfile, updateProfile } from '../controllers/users.controller.js';
import { emptyUserSchema, updateProfileSchema } from '../validators/user.validator.js';

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get('/me/profile', validate(emptyUserSchema), profile);
usersRouter.put('/me/profile', validate(updateProfileSchema), updateProfile);
usersRouter.post('/me/profile/submit', validate(emptyUserSchema), submitProfile);
usersRouter.get('/me/notifications', validate(emptyUserSchema), notifications);
usersRouter.post('/me/notifications/read', validate(emptyUserSchema), markNotificationsRead);
