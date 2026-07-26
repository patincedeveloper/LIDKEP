import { AppError } from '../lib/http.js';
import { hasRole } from '../lib/permissions.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!hasRole(req.user, roles)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    return next();
  };
}
