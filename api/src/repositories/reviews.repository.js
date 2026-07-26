import { prisma } from '../config/database.js';

export const reviewsRepository = {
  findAssignedReview(assignmentId, reviewerId, client = prisma) {
    return client.review.findFirst({
      where: { assignmentId, reviewerId },
      include: { assignment: true, version: true, scores: true, revisionRequests: true }
    });
  }
};
