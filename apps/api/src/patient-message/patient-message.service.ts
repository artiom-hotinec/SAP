import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { CreatePatientMessageDto, PatientMessageDto } from './dto.js';
import { Prisma } from '../generated/prisma/client.js';

const messageInclude = {
  provider: {
    select: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  },
} satisfies Prisma.ProviderMessageInclude;

type MessageWithAuthor = Prisma.ProviderMessageGetPayload<{
  include: typeof messageInclude;
}>;

function toDto(m: MessageWithAuthor): PatientMessageDto {
  const name = [m.provider.user.firstName, m.provider.user.lastName]
    .filter(Boolean)
    .join(' ');
  return {
    id: m.id,
    body: m.body,
    direction: m.direction,
    createdAt: m.createdAt,
    providerId: m.providerId,
    providerName: name || m.provider.user.email,
  };
}

@Injectable()
export class PatientMessageService {
  constructor(private db: DbService) {}

  private async assertPatientExists(id: string) {
    const found = await this.db.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException();
  }

  async getMessages(patientId: string) {
    await this.assertPatientExists(patientId);
    const messages = await this.db.providerMessage.findMany({
      where: { patientId },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
    });
    return messages.map(toDto);
  }

  async sendMessage(
    patientId: string,
    userId: string,
    dto: CreatePatientMessageDto,
  ) {
    await this.assertPatientExists(patientId);
    const provider = await this.db.provider.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!provider) {
      throw new ForbiddenException('Only providers can message patients');
    }

    const message = await this.db.providerMessage.create({
      data: {
        body: dto.body,
        direction: 'PROVIDER_TO_PATIENT',
        patientId,
        providerId: provider.id,
      },
      include: messageInclude,
    });

    return toDto(message);
  }
}
