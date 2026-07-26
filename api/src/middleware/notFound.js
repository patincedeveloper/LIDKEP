import { AppError } from '../lib/http.js';

export function notFound(req, _res, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'The requested API route does not exist.'));
}
