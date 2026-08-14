import { mkdirSync } from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';

const uploadDirectory = path.resolve(env.UPLOAD_DIR);
mkdirSync(uploadDirectory, { recursive: true });

const allowedTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg', 'image/png', 'image/webp'
]);

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDirectory),
  filename: (_req, file, callback) => callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

export const uploadEvidence = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) return callback(new AppError(422, 'UNSUPPORTED_FILE_TYPE', 'Upload a PDF, DOCX, XLSX, JPG, PNG, or WEBP file. Add videos as supporting links.'));
    return callback(null, true);
  }
});

export { uploadDirectory };
