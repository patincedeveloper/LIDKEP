import { AppError } from '../lib/http.js';
import { env } from '../config/env.js';
import { hashSessionToken } from '../services/auth.service.js';
import { sessionsRepository } from '../repositories/sessions.repository.js';

export async function authenticate(req, _res, next) {
  try {
    const token = req.cookies?.[env.SESSION_COOKIE_NAME];
    if (!token) throw new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.');
    const session = await sessionsRepository.findActiveByTokenHash(hashSessionToken(token));
    const now = new Date();
    if (!session || session.revokedAt || session.expiresAt <= now || session.idleExpiresAt <= now) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Your session has expired. Sign in again.');
    }
    if (session.user.status !== 'ACTIVE') throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'This account is not active.');
    req.session = session;
    req.user = session.user;
    await sessionsRepository.touch(session.id, new Date(Date.now() + env.SESSION_IDLE_HOURS * 3600000));
    return next();
  } catch (error) {
    return next(error);
  }
}
