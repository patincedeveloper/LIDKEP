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
