import { Prisma } from '../../generated/prisma/client.js';
import { PatientFilterBy } from '../dto/PatientQueryDto.js';

export const ACTIVE_WINDOW_DAYS = 30; // placeholder, needs your number

export function activityFilter(
  filterBy: PatientFilterBy[],
): Prisma.PatientWhereInput {
  const since = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 86_400_000);
  const active = filterBy.includes(PatientFilterBy.ACTIVE_PATIENTS);
  const inactive = filterBy.includes(PatientFilterBy.INACTIVE_PATIENTS);

  if (active === inactive) return {}; // neither, or both = no restriction
  return active
    ? { sessions: { some: { endedAt: { gte: since } } } }
    : { sessions: { none: { endedAt: { gte: since } } } };
}
