import { prisma } from '../config/database.js';

export const auditRepository = {
  create(data, client = prisma) {
    return client.auditLog.create({ data });
  }
};
