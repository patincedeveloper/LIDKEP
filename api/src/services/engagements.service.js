import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';
import { createNotification } from './notification.service.js';

const includeEngagement = {
  partner: { include: { profile: true } },
  innovation: { include: { owner: { include: { profile: true } }, publishedVersion: true } },
  innovationVersion: true,
  consents: true
};

export function serializeEngagement(item) {
  const owner = item.innovation.owner;
  const activeScopes = new Set(item.consents.filter((consent) => !consent.revokedAt).map((consent) => consent.scope));
  return {
    id: item.id,
    innovationId: item.innovationId,
    innovationSlug: item.innovation.slug,
    innovation: item.innovationVersion.title,
    partner: item.partner.profile?.displayName ?? item.partner.email,
    partnerId: item.partnerId,
    innovator: owner.profile?.displayName ?? owner.email,
    ownerId: owner.id,
    type: item.type,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    summary: item.summary,
    termsSummary: item.termsSummary ?? '',
    nonBindingAccepted: Boolean(item.nonBindingAcceptedAt),
    contact: item.status === 'ACCEPTED' ? {
      email: activeScopes.has('SHARE_EMAIL') ? owner.email : '',
      phone: activeScopes.has('SHARE_PHONE') ? owner.profile?.privatePhone ?? '' : '',
      organization: activeScopes.has('SHARE_ORGANIZATION_CONTACT') ? owner.profile?.organization ?? '' : ''
    } : { email: '', phone: '', organization: '' }
  };
}

async function findForParticipant(user, engagementId) {
  const record = await prisma.engagement.findFirst({
    where: { id: engagementId, OR: [{ partnerId: user.id }, { innovation: { ownerId: user.id } }] },
    include: includeEngagement
  });
  if (!record) throw new AppError(404, 'ENGAGEMENT_NOT_FOUND', 'The collaboration request was not found.');
  return record;
}

export async function listEngagements(user) {
  const where = user.role.code === 'INVESTOR_PARTNER' ? { partnerId: user.id } : { innovation: { ownerId: user.id } };
  const records = await prisma.engagement.findMany({ where, include: includeEngagement, orderBy: { createdAt: 'desc' } });
  return records.map(serializeEngagement);
}

export async function getEngagement(user, engagementId) {
  return serializeEngagement(await findForParticipant(user, engagementId));
}

export async function createEngagement(partner, input, requestId) {
  const innovation = await prisma.innovation.findFirst({
    where: { id: input.innovationId, status: 'PUBLISHED', publishedVersionId: { not: null } },
    include: { publishedVersion: true, owner: { include: { profile: true } } }
  });
  if (!innovation?.publishedVersion) throw new AppError(404, 'PUBLISHED_INNOVATION_NOT_FOUND', 'Choose a published innovation.');
  const existing = await prisma.engagement.findFirst({
    where: { innovationId: innovation.id, partnerId: partner.id }
  });
  if (existing) throw new AppError(409, 'ENGAGEMENT_ALREADY_REQUESTED', 'You have already sent a collaboration request for this innovation. Only one request is allowed.');
  let created;
  try {
    created = await prisma.$transaction(async (tx) => {
      const record = await tx.engagement.create({
        data: {
          requestKey: `${innovation.id}:${partner.id}`,
          innovationId: innovation.id,
          innovationVersionId: innovation.publishedVersion.id,
          partnerId: partner.id,
          type: input.type,
          status: 'PENDING',
          summary: input.summary,
          termsSummary: input.termsSummary || null,
          nonBindingAcceptedAt: new Date()
        }
      });
      await createNotification({
        userId: innovation.ownerId,
        type: 'ENGAGEMENT_REQUESTED',
        title: 'New collaboration request',
        message: `${partner.profile?.displayName ?? partner.email} sent a ${input.type.replaceAll('_', ' ').toLowerCase()} for ${innovation.publishedVersion.title}.`,
        entityType: 'Engagement', entityId: record.id
      }, tx);
      return record;
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new AppError(409, 'ENGAGEMENT_ALREADY_REQUESTED', 'You have already sent a collaboration request for this innovation. Only one request is allowed.');
    }
    throw error;
  }
  return getEngagement(partner, created.id);
}

export async function respondToEngagement(innovator, engagementId, input, requestId) {
  const engagement = await findForParticipant(innovator, engagementId);
  if (engagement.innovation.ownerId !== innovator.id) throw new AppError(403, 'FORBIDDEN', 'Only the innovation owner can respond to this request.');
  if (!['PENDING', 'CLARIFICATION_REQUESTED'].includes(engagement.status)) throw new AppError(409, 'ENGAGEMENT_NOT_RESPONDABLE', 'This request is no longer awaiting an Innovator response.');
  if (input.status === 'ACCEPTED' && !innovator.profile?.privatePhone?.trim()) {
    throw new AppError(422, 'INNOVATOR_CONTACT_INCOMPLETE', 'Add a contact phone number to your profile before accepting this request.');
  }
  await prisma.$transaction(async (tx) => {
    await tx.engagement.update({
      where: { id: engagementId },
      data: { status: input.status, contactSharedAt: input.status === 'ACCEPTED' ? new Date() : null }
    });
    await tx.engagementConsent.deleteMany({ where: { engagementId } });
    if (input.status === 'ACCEPTED') {
      await tx.engagementConsent.createMany({
        data: ['SHARE_EMAIL', 'SHARE_PHONE'].map((scope) => ({ engagementId, userId: innovator.id, scope, grantedAt: new Date() }))
      });
    }
    await createNotification({
      userId: engagement.partnerId,
      type: 'ENGAGEMENT_RESPONDED',
      title: 'Collaboration request updated',
      message: input.status === 'ACCEPTED'
        ? `${engagement.innovationVersion.title} was accepted. The Innovator's email and phone are now available.`
        : `${engagement.innovationVersion.title} is now ${input.status.replaceAll('_', ' ').toLowerCase()}.`,
      entityType: 'Engagement', entityId: engagementId
    }, tx);
  });
  return getEngagement(innovator, engagementId);
}

export async function withdrawEngagement(partner, engagementId, requestId) {
  const engagement = await findForParticipant(partner, engagementId);
  if (engagement.partnerId !== partner.id) throw new AppError(403, 'FORBIDDEN', 'Only the requesting Partner can withdraw this opportunity.');
  if (!['PENDING', 'CLARIFICATION_REQUESTED'].includes(engagement.status)) throw new AppError(409, 'ENGAGEMENT_NOT_WITHDRAWABLE', 'This request can no longer be withdrawn.');
  await prisma.$transaction(async (tx) => {
    await tx.engagement.update({ where: { id: engagementId }, data: { status: 'WITHDRAWN' } });
    await createNotification({ userId: engagement.innovation.ownerId, type: 'ENGAGEMENT_WITHDRAWN', title: 'Collaboration request withdrawn', message: `${engagement.innovationVersion.title} request was withdrawn.`, entityType: 'Engagement', entityId: engagementId }, tx);
  });
  return getEngagement(partner, engagementId);
}
