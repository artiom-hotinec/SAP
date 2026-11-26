import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service.js';
import { PatientDocumentDto } from './dto.js';
import { Prisma, type PatientDocument } from '../generated/prisma/client.js';
import { StorageService } from '../storage/storage.service.js';
import { randomUUID } from 'node:crypto';
import { basename } from 'node:path';

// Multer decodes the multipart filename as latin1, so "Result.pdf" arrives
// garbled; re-decode as UTF-8, drop any path parts, cap the length.
function displayName(originalname: string): string {
  const name = basename(
    Buffer.from(originalname, 'latin1').toString('utf8'),
  ).trim();
  return (name || 'document').slice(0, 255);
}

function toDto(doc: PatientDocument): PatientDocumentDto {
  return {
    id: doc.id,
    name: doc.name,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
  };
}

@Injectable()
export class PatientDocumentService {
  private readonly logger = new Logger(PatientDocumentService.name);

  constructor(
    private db: DbService,
    private storage: StorageService,
  ) {}

  private async assertPatientExists(id: string): Promise<void> {
    const found = await this.db.patient.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException();
  }

  async getDocuments(patientId: string): Promise<PatientDocumentDto[]> {
    const patient = await this.db.patient.findUnique({
      where: { id: patientId },
      select: { documents: { orderBy: { uploadedAt: 'desc' } } },
    });
    if (!patient) throw new NotFoundException();
    return patient.documents.map(toDto);
  }

  async uploadDocument(
    patientId: string,
    file: Express.Multer.File,
  ): Promise<PatientDocumentDto> {
    await this.assertPatientExists(patientId);

    const id = randomUUID();
    const storageKey = `patients/${patientId}/documents/${id}`;

    await this.storage.put(storageKey, file.buffer);

    try {
      const doc = await this.db.patientDocument.create({
        data: {
          id,
          name: displayName(file.originalname),
          storageKey,
          mimeType: file.mimetype,
          size: file.size,
          patientId,
        },
      });
      return toDto(doc);
    } catch (err) {
      // Don't leave a file nobody can reach.
      await this.storage
        .delete(storageKey)
        .catch((e) => this.logger.warn(`Orphaned upload ${storageKey}: ${e}`));
      throw err;
    }
  }

  async downloadDocument(patientId: string, documentId: string) {
    const doc = await this.db.patientDocument.findFirst({
      where: { id: documentId, patientId },
    });
    if (!doc) throw new NotFoundException();

    try {
      const stream = await this.storage.get(doc.storageKey);
      return { doc, stream };
    } catch (err) {
      if (err instanceof NotFoundException) {
        // Row exists but the file is gone: the DB and the disk disagree.
        this.logger.error(
          `Missing file for document ${doc.id}: ${doc.storageKey}`,
        );
      }
      throw err;
    }
  }

  async deleteDocument(patientId: string, documentId: string) {
    const doc = await this.db.patientDocument
      .delete({ where: { id: documentId, patientId } })
      .catch((err: unknown) => {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2025' // record to delete does not exist
        ) {
          throw new NotFoundException();
        }
        throw err;
      });

    await this.storage
      .delete(doc.storageKey)
      .catch((e) => this.logger.warn(`Orphaned file ${doc.storageKey}: ${e}`));
  }
}
