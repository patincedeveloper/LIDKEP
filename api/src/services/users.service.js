import { prisma } from '../config/database.js';
import { serializeUser } from './auth.service.js';
import { getPublicBootstrap, serializeInnovation } from './public.service.js';
import { usersRepository } from '../repositories/users.repository.js';

export async function getWorkspaceBootstrap(user) {
  const publicData = await getPublicBootstrap();
  const innovationWhere = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? {}
    : user.role.code === 'INNOVATOR'
      ? { ownerId: user.id }
      : { status: 'PUBLISHED' };
  const innovations = await prisma.innovation.findMany({
    where: innovationWhere,
    include: { publishedVersion: true, versions: { orderBy: { versionNumber: 'desc' }, take: 1 }, milestones: true }
  });
  const users = user.role.code === 'SYSTEM_ADMINISTRATOR'
    ? (await usersRepository.listSafe()).map(serializeUser)
    : [];
  return {
    ...publicData,
    innovations: innovations.map((item) => serializeInnovation(item)).filter(Boolean),
    users,
    assignments: [],
    reviews: [],
    revisions: [],
    engagements: [],
    notifications: [],
    verifications: [],
    auditLogs: [],
    criteria: []
  };
}
