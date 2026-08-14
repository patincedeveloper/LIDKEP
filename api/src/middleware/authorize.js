import { AppError } from '../lib/http.js';
import { hasRole } from '../lib/permissions.js';

export function authorize(...roles) {
  return (req, _res, next) => {
    if (!hasRole(req.user, roles)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action.'));
    }
    if (req.user?.status !== 'ACTIVE') {
      return next(new AppError(403, 'ACCOUNT_APPROVAL_REQUIRED', 'Submit your completed profile and wait for System Administrator approval.'));
    }
    return next();
  };
}
