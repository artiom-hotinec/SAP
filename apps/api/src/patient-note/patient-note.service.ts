import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { CreatePatientNoteDto, PatientNoteDto } from './dto.js';
import { Prisma } from '../generated/prisma/client.js';

const noteInclude = {
  author: { select: { firstName: true, lastName: true, email: true } },
} satisfies Prisma.PatientNoteInclude;

type NoteWithAuthor = Prisma.PatientNoteGetPayload<{
  include: typeof noteInclude;
}>;

function toDto(n: NoteWithAuthor): PatientNoteDto {
  const name = [n.author.firstName, n.author.lastName]
    .filter(Boolean)
    .join(' ');

  return {
    id: n.id,
    body: n.body,
    createdAt: n.createdAt,
    authorId: n.authorId,
    authorName: name || n.author.email,
  };
}

@Injectable()
export class PatientNoteService {
  constructor(private db: DbService) {}

  private async assertPatientExists(id: string) {
    const found = await this.db.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException();
  }

  async getNotes(patientId: string) {
    await this.assertPatientExists(patientId);
    const notes = await this.db.patientNote.findMany({
      where: { patientId },
      include: noteInclude,
      orderBy: { createdAt: 'desc' },
    });
    return notes.map(toDto);
  }

  async createNote(
    patientId: string,
    authorId: string,
    dto: CreatePatientNoteDto,
  ) {
    await this.assertPatientExists(patientId);
    const note = await this.db.patientNote.create({
      data: { body: dto.body, patientId, authorId },
      include: noteInclude,
    });
    return toDto(note);
  }
}
