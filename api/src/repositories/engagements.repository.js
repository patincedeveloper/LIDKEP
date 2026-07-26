import { prisma } from '../config/database.js';

export const engagementsRepository = {
  findForPartner(id, partnerId, client = prisma) {
    return client.engagement.findFirst({ where: { id, partnerId }, include: { consents: true } });
  }
};
