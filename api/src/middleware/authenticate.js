import { AppError } from '../lib/http.js';

export function authenticate(req, _res, next) {
  if (!req.user) return next(new AppError(401, 'AUTHENTICATION_REQUIRED', 'Authentication is required.'));
  return next();
}
