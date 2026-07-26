import { z } from 'zod';

const password = z.string()
  .min(12)
  .max(128)
  .regex(/[a-z]/, 'Password must contain a lowercase letter.')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter.')
  .regex(/[0-9]/, 'Password must contain a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character.');

const request = (body) => z.object({
  body,
  params: z.object({}).strict(),
  query: z.object({}).strict()
});

export const registerSchema = request(z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password,
  displayName: z.string().trim().min(2).max(120),
  organization: z.string().trim().max(160).optional(),
  district: z.string().trim().max(100).optional(),
  role: z.enum(['INNOVATOR', 'EXPERT', 'INVESTOR_PARTNER', 'PUBLIC_USER'])
}).strict());

export const loginSchema = request(z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128)
}).strict());

export const changePasswordSchema = request(z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: password
}).strict());

export const emptyAuthSchema = z.object({
  body: z.unknown().optional(),
  params: z.object({}).strict(),
  query: z.object({}).strict()
});
