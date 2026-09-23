import { prisma } from '../config/database.js';

export function createNotification(data, client = prisma) {
  return client.notification.create({ data });
}

export async function notifySystemAdministrators(data, client = prisma) {
  const administrators = await client.user.findMany({
    where: { role: { code: 'SYSTEM_ADMINISTRATOR' }, status: 'ACTIVE' },
    select: { id: true }
  });
  if (!administrators.length) return;
  await client.notification.createMany({
    data: administrators.map(({ id }) => ({ userId: id, ...data }))
  });
}

export function serializeNotification(item, role) {
  const workspace = {
    SYSTEM_ADMINISTRATOR: 'admin',
    INNOVATOR: 'innovator',
    EXPERT: 'expert',
    INVESTOR_PARTNER: 'partner'
  }[role] ?? '';
  let actionPath = workspace ? `/${workspace}/notifications` : '';
  if (item.entityType === 'ExpertAssignment' && role === 'EXPERT') actionPath = `/expert/assignments/${item.entityId}`;
  if (item.entityType === 'Innovation' && role === 'SYSTEM_ADMINISTRATOR') actionPath = `/admin/innovations/${item.entityId}`;
  if (item.entityType === 'Innovation' && role === 'INNOVATOR') {
    actionPath = item.type.includes('REVISION') ? `/innovator/revisions/${item.entityId}` : `/innovator/innovations/${item.entityId}`;
  }
  if (item.entityType === 'VerificationRequest' && role === 'SYSTEM_ADMINISTRATOR') actionPath = `/admin/verifications/${item.entityId}`;
  if (item.entityType === 'VerificationRequest' && role !== 'SYSTEM_ADMINISTRATOR') actionPath = `/${workspace}/profile`;
  if (item.entityType === 'Engagement' && role === 'INNOVATOR') actionPath = '/innovator/collaborations';
  if (item.entityType === 'Engagement' && role === 'INVESTOR_PARTNER') actionPath = '/partner/opportunities';
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    time: item.createdAt.toISOString(),
    read: Boolean(item.readAt),
    type: item.type,
    entityType: item.entityType ?? '',
    entityId: item.entityId ?? '',
    actionPath
  };
}
