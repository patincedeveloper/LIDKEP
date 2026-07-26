import { prisma } from '../config/database.js';

export const usersRepository = {
  findById(id, client = prisma) {
    return client.user.findUnique({ where: { id }, include: { role: true, profile: true } });
  },
  findByEmail(email, client = prisma) {
    return client.user.findUnique({ where: { email: email.toLowerCase() }, include: { role: true, profile: true } });
  }
};
