import { successResponse } from '../lib/http.js';
import { checkHealth } from '../services/health.service.js';

export async function health(req, res) {
  const result = await checkHealth();
  res.json(successResponse(req, result));
}
