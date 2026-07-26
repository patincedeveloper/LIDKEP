import { Prisma } from '@prisma/client';
import { AppError, errorResponse } from '../lib/http.js';

export function errorHandler(error, req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.status).json(errorResponse(req, error.code, error.message, error.fieldErrors));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    req.log?.error({ err: error, requestId: req.requestId }, 'Database request failed');
    return res.status(409).json(errorResponse(req, 'DATABASE_CONFLICT', 'The request conflicts with existing data.'));
  }

  req.log?.error({ err: error, requestId: req.requestId }, 'Unhandled request error');
  return res.status(500).json(errorResponse(req, 'INTERNAL_ERROR', 'An unexpected error occurred.'));
}
