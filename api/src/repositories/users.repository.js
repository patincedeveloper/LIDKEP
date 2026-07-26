import { prisma } from '../config/database.js';

export const usersRepository = {
  findById(id, client = prisma) {
    return client.user.findUnique({ where: { id }, include: { role: true, profile: true } });
  },
  findByEmail(email, client = prisma) {
    return client.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true, profile: true } });
  },
  create(data, client = prisma) {
    return client.user.create({ data, include: { role: true, profile: true } });
  },
  updatePassword(id, data, client = prisma) {
    return client.user.update({ where: { id }, data });
  },
  listSafe(client = prisma) {
    return client.user.findMany({
      include: { role: true, profile: true },
      orderBy: { createdAt: 'desc' }
    });
  }
};
