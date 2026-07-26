import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';
import { errorResponse } from '../lib/http.js';

export const globalRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(errorResponse(req, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
  }
});
