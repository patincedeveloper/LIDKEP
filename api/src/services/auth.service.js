import { createHash, randomBytes } from 'node:crypto';
import { Algorithm, hash, verify } from '@node-rs/argon2';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/http.js';
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

export function isProfileComplete(profile) {
  return Boolean(
    profile?.displayName?.trim() && profile?.identificationType?.trim() &&
    profile?.identificationNumber?.trim() && profile?.privatePhone?.trim() &&
    profile?.educationLevel?.trim() && profile?.province?.trim() &&
    profile?.district?.trim() && profile?.administrativeSector?.trim() &&
    profile?.occupation?.trim()
  );
}

export function serializeUser(user) {
  const approvalStatus = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? 'APPROVED'
    : user.verificationRequests?.[0]?.status ?? (user.status === 'ACTIVE' ? 'APPROVED' : 'DRAFT');
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
    mustChangePassword: user.mustChangePassword,
    profileComplete: user.role.code === 'SYSTEM_ADMINISTRATOR' || isProfileComplete(user.profile),
    approvalStatus
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
  const isInnovator = input.role === 'INNOVATOR';
  const status = isInnovator ? 'ACTIVE' : 'PENDING_APPROVAL';
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
          displayName: input.displayName
        }
      }
    }, tx);
    await tx.verificationRequest.create({
      data: {
        userId: user.id,
        requestedRole: input.role,
        status: isInnovator ? 'APPROVED' : 'DRAFT',
        ...(isInnovator ? { submittedAt: new Date(), decidedAt: new Date() } : {})
      }
    });
    const token = await issueSession(user.id, context, tx);
    const hydrated = await usersRepository.findById(user.id, tx);
    return { user: serializeUser(hydrated), token, requiresApproval: !isInnovator };
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
  if (!['ACTIVE', 'PENDING_APPROVAL'].includes(user.status)) {
    throw new AppError(403, 'ACCOUNT_NOT_ACTIVE', 'This account is not active.');
  }
  const token = await issueSession(user.id, context);
  return { user: serializeUser(user), token };
}

export async function logout(session, requestId) {
  await sessionsRepository.revoke(session.id, 'LOGOUT');
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
  });
}
