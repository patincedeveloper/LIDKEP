import { prisma } from '../config/database.js';

export const usersRepository = {
  findById(id, client = prisma) {
    return client.user.findUnique({
      where: { id },
      include: { role: true, profile: true, verificationRequests: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  },
  findByEmail(email, client = prisma) {
    return client.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { role: true, profile: true, verificationRequests: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  },
  create(data, client = prisma) {
    return client.user.create({
      data,
      include: { role: true, profile: true, verificationRequests: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });
  },
  updatePassword(id, data, client = prisma) {
    return client.user.update({ where: { id }, data });
  },
  listSafe(client = prisma) {
    return client.user.findMany({
      include: { role: true, profile: true },
      orderBy: { createdAt: 'desc' }
    });
  },
  updateProfile(userId, data, client = prisma) {
    return client.userProfile.update({ where: { userId }, data });
  }
};
