import { createHash, randomBytes } from 'node:crypto';
import { Algorithm, hash, verify } from '@node-rs/argon2';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';
import { auditRepository } from '../repositories/audit.repository.js';
import { sessionsRepository } from '../repositories/sessions.repository.js';
import { usersRepository } from '../repositories/users.repository.js';

const argonOptions = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32
};

export const hashPassword = (password) => hash(password, argonOptions);
export const hashSessionToken = (token) => createHash('sha256').update(token).digest('hex');

export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role.code,
    accountStatus: user.status,
    name: user.profile?.displayName ?? user.email,
    organization: user.profile?.organization ?? '',
    district: user.profile?.district ?? '',
    verified: Boolean(user.emailVerifiedAt),
    mfaEnabled: user.mfaEnabled,
    mustChangePassword: user.mustChangePassword
  };
}

async function issueSession(userId, context, client = prisma) {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  await sessionsRepository.create({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now + env.SESSION_TTL_HOURS * 3600000),
    idleExpiresAt: new Date(now + env.SESSION_IDLE_HOURS * 3600000),
    ipHash: context.ip ? createHash('sha256').update(context.ip).digest('hex') : null,
    userAgent: context.userAgent?.slice(0, 500)
  }, client);
  return token;
}

export async function register(input, context) {
  const existing = await usersRepository.findByEmail(input.email);
  if (existing) throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'An account already exists for this email.');
  const role = await prisma.role.findUnique({ where: { code: input.role } });
  if (!role || !role.isActive) throw new AppError(422, 'ROLE_UNAVAILABLE', 'The selected account type is unavailable.');
  const status = ['EXPERT', 'INVESTOR_PARTNER'].includes(input.role) ? 'PENDING_APPROVAL' : 'ACTIVE';
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await usersRepository.create({
      email: input.email,
      passwordHash,
      roleId: role.id,
      status,
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          displayName: input.displayName,
          organization: input.organization || null,
          district: input.district || null
        }
      }
    }, tx);
    const token = status === 'ACTIVE' ? await issueSession(user.id, context, tx) : null;
    await auditRepository.create({
      actorId: user.id,
      action: 'ACCOUNT_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      requestId: context.requestId,
      metadata: { role: input.role, status }
    }, tx);
    return { user: serializeUser(user), token };
  });
}

export async function login(input, context) {
  const user = await usersRepository.findByEmail(input.email);
  if (!user?.passwordHash) {
    await hashPassword(input.password);
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  const valid = await verify(user.passwordHash, input.password);
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  if (user.status !== 'ACTIVE') throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'This account is not active.');
  const token = await prisma.$transaction(async (tx) => {
    const issued = await issueSession(user.id, context, tx);
    await auditRepository.create({
      actorId: user.id,
      action: 'SESSION_CREATED',
      entityType: 'Session',
      requestId: context.requestId
    }, tx);
    return issued;
  });
  return { user: serializeUser(user), token };
}

export async function logout(session, requestId) {
  await prisma.$transaction(async (tx) => {
    await sessionsRepository.revoke(session.id, 'LOGOUT', tx);
    await auditRepository.create({
      actorId: session.userId,
      action: 'SESSION_REVOKED',
      entityType: 'Session',
      entityId: session.id,
      requestId
    }, tx);
  });
}

export async function changePassword(user, input, requestId) {
  const valid = user.passwordHash && await verify(user.passwordHash, input.currentPassword);
  if (!valid) throw new AppError(401, 'INVALID_CURRENT_PASSWORD', 'The current password is incorrect.');
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await usersRepository.updatePassword(user.id, {
      passwordHash,
      mustChangePassword: false,
      tokenVersion: { increment: 1 }
    }, tx);
    await sessionsRepository.revokeAllForUser(user.id, 'PASSWORD_CHANGED', tx);
    await auditRepository.create({
      actorId: user.id,
      action: 'PASSWORD_CHANGED',
      entityType: 'User',
      entityId: user.id,
      requestId
    }, tx);
  });
}
