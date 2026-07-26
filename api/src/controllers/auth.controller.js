import { env } from '../config/env.js';
import { successResponse } from '../lib/http.js';
import * as authService from '../services/auth.service.js';
import { getWorkspaceBootstrap } from '../services/users.service.js';

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: 'lax',
  path: '/',
  maxAge: env.SESSION_TTL_HOURS * 3600000
};

const context = (req) => ({
  requestId: req.requestId,
  ip: req.ip,
  userAgent: req.get('user-agent')
});

export async function register(req, res) {
  const result = await authService.register(req.validated.body, context(req));
  if (result.token) res.cookie(env.SESSION_COOKIE_NAME, result.token, cookieOptions);
  res.status(201).json(successResponse(req, { user: result.user, requiresApproval: !result.token }));
}

export async function login(req, res) {
  const result = await authService.login(req.validated.body, context(req));
  res.cookie(env.SESSION_COOKIE_NAME, result.token, cookieOptions);
  res.json(successResponse(req, { user: result.user }));
}

export function me(req, res) {
  res.json(successResponse(req, { user: authService.serializeUser(req.user) }));
}

export async function logout(req, res) {
  await authService.logout(req.session, req.requestId);
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  res.json(successResponse(req, { loggedOut: true }));
}

export async function changePassword(req, res) {
  await authService.changePassword(req.user, req.validated.body, req.requestId);
  res.clearCookie(env.SESSION_COOKIE_NAME, cookieOptions);
  res.json(successResponse(req, { changed: true, signInRequired: true }));
}

export async function bootstrap(req, res) {
  res.json(successResponse(req, await getWorkspaceBootstrap(req.user)));
}
