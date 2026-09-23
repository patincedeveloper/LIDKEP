import { Prisma } from '@prisma/client';
import { AppError, errorResponse } from '../lib/http.js';
import multer from 'multer';

export function errorHandler(error, req, res, _next) {
  if (error instanceof AppError) {
    return res.status(error.status).json(errorResponse(req, error.code, error.message, error.fieldErrors));
  }

  if (error instanceof multer.MulterError) {
    return res.status(422).json(errorResponse(req, 'UPLOAD_ERROR', error.code === 'LIMIT_FILE_SIZE' ? 'The selected file is too large.' : error.message));
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    req.log?.error({ err: error, requestId: req.requestId }, 'Database request failed');
    if (error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(',')
        : String(error.meta?.target ?? error.meta?.constraint ?? '');
      if (target.includes('identificationNumber')) {
        return res.status(409).json(errorResponse(
          req,
          'IDENTIFICATION_NUMBER_ALREADY_USED',
          'This identification number is already registered.',
          [{ field: 'identificationNumber', message: 'This identification number is already registered.', code: 'not_unique' }]
        ));
      }
      if (target.includes('privatePhone')) {
        return res.status(409).json(errorResponse(
          req,
          'PHONE_NUMBER_ALREADY_USED',
          'This phone number is already registered.',
          [{ field: 'phoneNumber', message: 'This phone number is already registered.', code: 'not_unique' }]
        ));
      }
    }
    return res.status(409).json(errorResponse(req, 'DATABASE_CONFLICT', 'The request conflicts with existing data.'));
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    req.log?.error({ err: error, requestId: req.requestId }, 'Database unavailable');
    return res.status(503).json(errorResponse(req, 'DATABASE_UNAVAILABLE', 'The database is unavailable. Check the local PostgreSQL connection.'));
  }

  req.log?.error({ err: error, requestId: req.requestId }, 'Unhandled request error');
  return res.status(500).json(errorResponse(req, 'INTERNAL_ERROR', 'An unexpected error occurred.'));
}
