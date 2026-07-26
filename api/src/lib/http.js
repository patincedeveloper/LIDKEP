export class AppError extends Error {
  constructor(status, code, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fieldErrors = options.fieldErrors ?? [];
  }
}

export function successResponse(req, data, meta = {}) {
  return { data, meta: { ...meta, requestId: req.requestId } };
}

export function errorResponse(req, code, message, fieldErrors = []) {
  return { error: { code, message, fieldErrors, requestId: req.requestId } };
}
