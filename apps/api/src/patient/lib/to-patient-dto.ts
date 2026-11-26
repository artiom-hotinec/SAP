import { Prisma } from '../../generated/prisma/client.js';
import { PatientDto } from '../dto/PatientDto.js';

export const patientInclude = {
  provider: { include: { user: true } },
  sessions: {
    orderBy: { endedAt: 'desc' },
    take: 1,
    select: { endedAt: true },
  },
} satisfies Prisma.PatientInclude;

type PatientWithRelations = Prisma.PatientGetPayload<{
  include: typeof patientInclude;
}>;

export function toPatientDto(p: PatientWithRelations): PatientDto {
  return {
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    email: p.email,
    phone: p.phone,
    dob: p.dob,
    sex: p.sex,
    heightIn: p.heightIn,
    weightLb: p.weightLb,
    address: p.address,
    city: p.city,
    state: p.state,
    unit: p.unit,
    zip: p.zip,
    providerId: p.providerId,
    providerName:
      `${p.provider.user.firstName ?? ''} ${p.provider.user.lastName ?? ''}`.trim(),
    lastAppointment: p.sessions[0]?.endedAt ?? null,
    registered: p.userId !== null,
    createdAt: p.createdAt,
  };
}
