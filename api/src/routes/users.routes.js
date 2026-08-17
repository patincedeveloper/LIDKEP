import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { downloadProfileEvidence, markNotificationRead, markNotificationsRead, notifications, profile, submitProfile, updateProfile, uploadProfileEvidence } from '../controllers/users.controller.js';
import { emptyUserSchema, notificationIdSchema, profileEvidenceIdSchema, updateProfileSchema } from '../validators/user.validator.js';
import { uploadEvidence } from '../middleware/upload.js';

export const usersRouter = Router();
usersRouter.use(authenticate);
usersRouter.get('/me/profile', validate(emptyUserSchema), profile);
usersRouter.put('/me/profile', validate(updateProfileSchema), updateProfile);
usersRouter.post('/me/profile/evidence', uploadEvidence.single('file'), uploadProfileEvidence);
usersRouter.get('/profile/evidence/:id/download', validate(profileEvidenceIdSchema), downloadProfileEvidence);
usersRouter.post('/me/profile/submit', validate(emptyUserSchema), submitProfile);
usersRouter.get('/me/notifications', validate(emptyUserSchema), notifications);
usersRouter.post('/me/notifications/read', validate(emptyUserSchema), markNotificationsRead);
usersRouter.post('/me/notifications/:id/read', validate(notificationIdSchema), markNotificationRead);
