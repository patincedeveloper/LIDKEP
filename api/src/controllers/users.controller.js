import { successResponse } from '../lib/http.js';
import { prisma } from '../config/database.js';
import { usersRepository } from '../repositories/users.repository.js';
import { serializeUser } from '../services/auth.service.js';
import { addProfileEvidence, getProfileEvidenceDownload, serializeProfileEvidence, submitProfileForReview } from '../services/users.service.js';
import { serializeNotification } from '../services/notification.service.js';

export async function profile(req, res) {
  const verification = await prisma.verificationRequest.findFirst({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { evidenceFiles: { orderBy: { createdAt: 'desc' } } }
  });
  res.json(successResponse(req, {
    ...serializeUser(req.user),
    identificationType: req.user.profile?.identificationType ?? '',
    identificationNumber: req.user.profile?.identificationNumber ?? '',
    phoneNumber: req.user.profile?.privatePhone ?? '',
    educationLevel: req.user.profile?.educationLevel ?? '',
    province: req.user.profile?.province ?? '',
    district: req.user.profile?.district ?? '',
    administrativeSector: req.user.profile?.administrativeSector ?? '',
    occupation: req.user.profile?.occupation ?? '',
    yearsOfExperience: req.user.profile?.yearsOfExperience ?? 0,
    preferredLanguage: req.user.profile?.preferredLanguage ?? 'en',
    publicProfile: req.user.profile?.publicProfile ?? false,
    identificationDocuments: (verification?.evidenceFiles ?? []).map(serializeProfileEvidence)
  }));
}

export async function updateProfile(req, res) {
  await prisma.$transaction(async (tx) => {
    await usersRepository.updateProfile(req.user.id, {
      displayName: req.validated.body.displayName,
      organization: req.validated.body.organization || null,
      identificationType: req.validated.body.identificationType,
      identificationNumber: req.validated.body.identificationNumber,
      privatePhone: req.validated.body.phoneNumber.startsWith('0')
        ? `+250${req.validated.body.phoneNumber.slice(1)}`
        : req.validated.body.phoneNumber.startsWith('+')
          ? req.validated.body.phoneNumber
          : `+${req.validated.body.phoneNumber}`,
      educationLevel: req.validated.body.educationLevel,
      province: req.validated.body.province,
      district: req.validated.body.district,
      administrativeSector: req.validated.body.administrativeSector,
      occupation: req.validated.body.occupation,
      yearsOfExperience: req.validated.body.yearsOfExperience ?? null,
      preferredLanguage: req.validated.body.preferredLanguage,
      publicProfile: req.validated.body.publicProfile
    }, tx);
    const verification = await tx.verificationRequest.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    if (verification?.status === 'REJECTED') {
      await tx.verificationRequest.update({
        where: { id: verification.id },
        data: {
          status: 'DRAFT', submittedAt: null, reviewedAt: null, reviewedById: null,
          decidedAt: null, decidedById: null
        }
      });
      await tx.user.update({ where: { id: req.user.id }, data: { status: 'PENDING_APPROVAL' } });
    }
  });
  const user = await usersRepository.findById(req.user.id);
  res.json(successResponse(req, serializeUser(user)));
}

export async function submitProfile(req, res) {
  res.json(successResponse(req, await submitProfileForReview(req.user, req.requestId)));
}

export async function uploadProfileEvidence(req, res) {
  res.status(201).json(successResponse(req, await addProfileEvidence(req.user, req.file)));
}

export async function downloadProfileEvidence(req, res) {
  const result = await getProfileEvidenceDownload(req.user, req.validated.params.id);
  res.download(result.filePath, result.evidence.originalName);
}

export async function notifications(req, res) {
  const items = await prisma.notification.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 100 });
  res.json(successResponse(req, items.map((item) => serializeNotification(item, req.user.role.code))));
}

export async function markNotificationsRead(req, res) {
  await prisma.notification.updateMany({ where: { userId: req.user.id, readAt: null }, data: { readAt: new Date() } });
  res.json(successResponse(req, { updated: true }));
}

export async function markNotificationRead(req, res) {
  const result = await prisma.notification.updateMany({
    where: { id: req.validated.params.id, userId: req.user.id, readAt: null },
    data: { readAt: new Date() }
  });
  res.json(successResponse(req, { updated: result.count > 0 }));
}
