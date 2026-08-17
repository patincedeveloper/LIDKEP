import { prisma } from '../config/database.js';
import { AppError } from '../lib/http.js';

export async function assertProfileIdentifiersAvailable(
  { identificationNumber, phoneNumber },
  excludeUserId,
  client = prisma
) {
  const identifiers = [
    identificationNumber ? { identificationNumber } : null,
    phoneNumber ? { privatePhone: phoneNumber } : null
  ].filter(Boolean);
  if (!identifiers.length) return;
  const conflicts = await client.userProfile.findMany({
    where: {
      userId: excludeUserId ? { not: excludeUserId } : undefined,
      OR: identifiers
    },
    select: { identificationNumber: true, privatePhone: true }
  });

  if (identificationNumber && conflicts.some((item) => item.identificationNumber === identificationNumber)) {
    throw new AppError(409, 'IDENTIFICATION_NUMBER_ALREADY_USED', 'This identification number is already registered.', {
      fieldErrors: [{ field: 'identificationNumber', message: 'This identification number is already registered.', code: 'not_unique' }]
    });
  }
  if (phoneNumber && conflicts.some((item) => item.privatePhone === phoneNumber)) {
    throw new AppError(409, 'PHONE_NUMBER_ALREADY_USED', 'This phone number is already registered.', {
      fieldErrors: [{ field: 'phoneNumber', message: 'This phone number is already registered.', code: 'not_unique' }]
    });
  }
}
