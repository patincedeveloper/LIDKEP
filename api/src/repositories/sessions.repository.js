import { prisma } from '../config/database.js';

export const sessionsRepository = {
  create(data, client = prisma) {
    return client.session.create({ data });
  },
  findActiveByTokenHash(tokenHash, client = prisma) {
    return client.session.findUnique({
      where: { tokenHash },
      include: { user: { include: { role: true, profile: true } } }
    });
  },
  touch(id, idleExpiresAt, client = prisma) {
    return client.session.update({ where: { id }, data: { lastSeenAt: new Date(), idleExpiresAt } });
  },
  revoke(id, reason, client = prisma) {
    return client.session.update({ where: { id }, data: { revokedAt: new Date(), revokeReason: reason } });
  },
  revokeAllForUser(userId, reason, client = prisma) {
    return client.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason }
    });
  }
};
