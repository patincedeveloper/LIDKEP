import { Router } from 'express';
import { bootstrap, changePassword, login, logout, me, register } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, emptyAuthSchema, loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), register);
authRouter.post('/login', validate(loginSchema), login);
authRouter.get('/me', validate(emptyAuthSchema), authenticate, me);
authRouter.get('/bootstrap', validate(emptyAuthSchema), authenticate, bootstrap);
authRouter.post('/logout', validate(emptyAuthSchema), authenticate, logout);
authRouter.post('/change-password', validate(changePasswordSchema), authenticate, changePassword);
