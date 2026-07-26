import { AppError } from '../lib/http.js';

export function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code
      }));
      return next(new AppError(422, 'VALIDATION_ERROR', 'Review the supplied request.', { fieldErrors }));
    }
    req.validated = parsed.data;
    return next();
  };
}
