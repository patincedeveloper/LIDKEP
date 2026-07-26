import { prisma } from '../config/database.js';

export const innovationsRepository = {
  findOwnedById(id, ownerId, client = prisma) {
    return client.innovation.findFirst({ where: { id, ownerId }, include: { versions: true } });
  },
  findPublishedBySlug(slug, client = prisma) {
    return client.innovation.findFirst({
      where: { slug, status: 'PUBLISHED', publishedVersionId: { not: null } },
      include: { publishedVersion: true, milestones: { where: { visibility: 'PUBLIC' } } }
    });
  }
};
