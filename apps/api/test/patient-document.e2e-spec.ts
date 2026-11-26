import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import { PatientDocumentDto } from './../src/patient-document/dto.js';

// PatientDocumentDto as it arrives over HTTP (dates are ISO strings).
type DocumentJson = Omit<PatientDocumentDto, 'uploadedAt'> & {
  uploadedAt: string;
};
const asDocument = (res: { body: unknown }) => res.body as DocumentJson;
const asDocuments = (res: { body: unknown }) => res.body as DocumentJson[];

/**
 * E2E contract for /patients/:patientId/documents (every route requires the
 * `access-token` cookie, see PatientDocumentController and patient-document/dto.ts).
 *
 * GET    /patients/:patientId/documents                    -> 200 PatientDocumentDto[]
 * POST   /patients/:patientId/documents  (multipart file)  -> 201 PatientDocumentDto
 * GET    /patients/:patientId/documents/:documentId/file   -> 200 file bytes
 * DELETE /patients/:patientId/documents/:documentId        -> 204
 *
 * Decisions this spec pins down:
 * - Files are stored under UPLOADS_DIR at `patients/<patientId>/documents/<id>`;
 *   the storage key never reaches the client.
 * - Only PDF, PNG and JPEG up to 20 MB are accepted, checked by content.
 * - `name` is the original filename (UTF-8 names survive, path parts are dropped).
 * - The list is newest first and only holds the given patient's documents.
 * - A document is only reachable through its own patient's URL; anything
 *   else is 404, and nothing is written or deleted.
 * - Downloads are attachments with an RFC 5987 `filename*`.
 * - DELETE removes both the row and the file.
 *
 * StorageService reads UPLOADS_DIR when it is created, so this spec points it
 * at a temp folder before the app starts. Everything created here (rows and
 * the temp folder) is removed in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `doc${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;

// Smallest files the content-based type check recognises.
const PDF = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n',
);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);
const JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
]);
const TEXT = Buffer.from('just some notes, not a document');

// Collect a response body as raw bytes (supertest doesn't buffer PDFs).
const binary = (
  res: request.Response,
  done: (err: Error | null, body: Buffer) => void,
) => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

describe('Patient documents (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;
  let uploadsDir: string;
  let previousUploadsDir: string | undefined;
  let facilityId: string;
  let providerId: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (url: string) => http().get(url).set('Cookie', cookie),
    post: (url: string) => http().post(url).set('Cookie', cookie),
    delete: (url: string) => http().delete(url).set('Cookie', cookie),
  };
  const docsUrl = (patientId: string) => `/patients/${patientId}/documents`;
  const docUrl = (patientId: string, documentId: string) =>
    `${docsUrl(patientId)}/${documentId}`;
  const fileUrl = (patientId: string, documentId: string) =>
    `${docUrl(patientId, documentId)}/file`;

  const filePath = (storageKey: string) => join(uploadsDir, storageKey);
  const patientFiles = async (patientId: string) =>
    readdir(join(uploadsDir, 'patients', patientId, 'documents')).catch(
      () => [] as string[],
    );

  const upload = (patientId: string, data: Buffer, filename: string) =>
    authed.post(docsUrl(patientId)).attach('file', data, filename);

  const created = {
    patients: [] as string[],
    providers: [] as string[],
    users: [] as string[],
    facilities: [] as string[],
  };

  const createPatient = async () => {
    const p = await db.patient.create({
      data: {
        firstName: `Wayne${run}`,
        lastName: 'Bernard',
        email: `${uniq('patient')}@example.com`,
        phone: '(303) 941-5555',
        providerId,
        facilityId,
      },
    });
    created.patients.push(p.id);
    return p;
  };

  beforeAll(async () => {
    previousUploadsDir = process.env.UPLOADS_DIR;
    uploadsDir = await mkdtemp(join(tmpdir(), 'sap-uploads-'));
    process.env.UPLOADS_DIR = uploadsDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    db = app.get(DbService);

    const email = `${uniq('user')}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    created.users.push(user.id);

    const login = await http()
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    cookie = ([] as string[])
      .concat(login.headers['set-cookie'] as unknown as string[])
      .find((c) => c.startsWith('access-token='))!
      .split(';')[0];

    const facility = await db.facility.create({
      data: {
        ein: `${Math.floor(10 + Math.random() * 90)}-${Math.floor(
          1_000_000 + Math.random() * 9_000_000,
        )}`,
        permit: '555333',
        npi: '1567890342',
        name: uniq('Clinic'),
        city: 'Denver',
        state: 'CO',
        phone: '(303) 941-3333',
        address: '13654 Kenzo Lane',
        zip: '80023',
        contactName: 'Conejo Jones',
        contactEmail: `${uniq('contact')}@example.com`,
      },
    });
    created.facilities.push(facility.id);
    facilityId = facility.id;

    const provider = await db.provider.create({
      data: {
        npi: `${Date.now()}${counter++}`.slice(-10),
        phone: '(303) 941-3333',
        address: '1 Main St',
        dateHired: new Date('2024-01-15'),
        userId: user.id,
        facilityId,
      },
    });
    created.providers.push(provider.id);
    providerId = provider.id;
  });

  afterAll(async () => {
    // Only delete what was actually created: if beforeAll failed (e.g. the DB
    // is down), this keeps the real error from being buried under a cleanup one.
    try {
      // Documents go with their patient (onDelete: Cascade); patients must go
      // before their provider/facility (Restrict).
      if (created.patients.length) {
        await db.patient.deleteMany({
          where: { id: { in: created.patients } },
        });
      }
      if (created.providers.length) {
        await db.provider.deleteMany({
          where: { id: { in: created.providers } },
        });
      }
      if (created.users.length) {
        await db.user.deleteMany({ where: { id: { in: created.users } } });
      }
      if (created.facilities.length) {
        await db.facility.deleteMany({
          where: { id: { in: created.facilities } },
        });
      }
    } finally {
      await app?.close();
      if (uploadsDir) await rm(uploadsDir, { recursive: true, force: true });
      if (previousUploadsDir === undefined) delete process.env.UPLOADS_DIR;
      else process.env.UPLOADS_DIR = previousUploadsDir;
    }
  });

  describe('authorization', () => {
    const p = randomUUID();
    const d = randomUUID();

    it('GET list returns 401 without a token', async () => {
      await http().get(docsUrl(p)).expect(401);
    });

    it('POST returns 401 without a token', async () => {
      await http()
        .post(docsUrl(p))
        .attach('file', PDF, 'report.pdf')
        .expect(401);
    });

    it('GET file returns 401 without a token', async () => {
      await http().get(fileUrl(p, d)).expect(401);
    });

    it('DELETE returns 401 without a token', async () => {
      await http().delete(docUrl(p, d)).expect(401);
    });
  });

  describe('GET /patients/:patientId/documents', () => {
    it('returns an empty list for a patient without documents', async () => {
      const patient = await createPatient();

      const res = await authed.get(docsUrl(patient.id)).expect(200);

      expect(res.body).toEqual([]);
    });

    it("returns only this patient's documents, newest first", async () => {
      const patient = await createPatient();
      const other = await createPatient();
      const seed = (patientId: string, name: string, at: string) =>
        db.patientDocument.create({
          data: {
            name,
            storageKey: `patients/${patientId}/documents/${randomUUID()}`,
            mimeType: 'application/pdf',
            size: 1234,
            patientId,
            uploadedAt: new Date(at),
          },
        });
      const oldest = await seed(
        patient.id,
        'a.pdf',
        '2022-10-02T11:14:00.000Z',
      );
      const newest = await seed(
        patient.id,
        'Sleep Study Results_01.15.23.pdf',
        '2023-01-15T09:00:00.000Z',
      );
      await seed(other.id, 'not mine.pdf', '2023-02-01T00:00:00.000Z');

      const res = await authed.get(docsUrl(patient.id)).expect(200);

      expect(asDocuments(res).map((d) => d.id)).toEqual([newest.id, oldest.id]);
      expect(asDocuments(res)[0]).toEqual({
        id: newest.id,
        name: 'Sleep Study Results_01.15.23.pdf',
        mimeType: 'application/pdf',
        size: 1234,
        uploadedAt: '2023-01-15T09:00:00.000Z',
      });
    });

    it('returns 404 for an unknown patient', async () => {
      await authed.get(docsUrl(randomUUID())).expect(404);
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await authed.get(docsUrl('not-a-uuid')).expect(400);
    });
  });

  describe('POST /patients/:patientId/documents', () => {
    it('stores the file and returns the document', async () => {
      const patient = await createPatient();

      const res = await upload(
        patient.id,
        PDF,
        'Sleep Study Results_01.15.23.pdf',
      ).expect(201);

      const doc = asDocument(res);
      expect(doc).toEqual({
        id: expect.any(String) as string,
        name: 'Sleep Study Results_01.15.23.pdf',
        mimeType: 'application/pdf',
        size: PDF.length,
        uploadedAt: expect.any(String) as string,
      });
      expect(Number.isNaN(Date.parse(doc.uploadedAt))).toBe(false);
      expect(res.body).not.toHaveProperty('storageKey');

      const saved = await db.patientDocument.findUniqueOrThrow({
        where: { id: doc.id },
      });
      expect(saved.patientId).toBe(patient.id);
      expect(saved.storageKey).toBe(
        `patients/${patient.id}/documents/${doc.id}`,
      );
      expect(await readFile(filePath(saved.storageKey))).toEqual(PDF);

      const list = await authed.get(docsUrl(patient.id)).expect(200);
      expect(asDocuments(list).map((d) => d.id)).toEqual([doc.id]);
    });

    it.each([
      ['PNG', PNG, 'scan.png', 'image/png'],
      ['JPEG', JPEG, 'scan.jpg', 'image/jpeg'],
    ])('accepts a %s image', async (_, data, filename, mimeType) => {
      const patient = await createPatient();

      const res = await upload(patient.id, data, filename).expect(201);

      expect(asDocument(res)).toMatchObject({ name: filename, mimeType });
    });

    it('keeps a non-ASCII filename intact', async () => {
      const patient = await createPatient();

      const res = await upload(patient.id, PDF, 'Результат сна.pdf').expect(
        201,
      );

      expect(asDocument(res).name).toBe('Результат сна.pdf');
    });

    it('drops path parts from the filename', async () => {
      const patient = await createPatient();

      const res = await upload(patient.id, PDF, '../../etc/report.pdf').expect(
        201,
      );

      expect(asDocument(res).name).toBe('report.pdf');
      expect(await patientFiles(patient.id)).toEqual([asDocument(res).id]);
    });

    it('returns 400 without a file', async () => {
      const patient = await createPatient();

      await authed.post(docsUrl(patient.id)).expect(400);
    });

    it.each([
      ['a text file', TEXT, 'notes.txt'],
      ['a text file named .pdf', TEXT, 'fake.pdf'],
      ['larger than 20 MB', Buffer.alloc(20 * 1024 * 1024 + 1), 'big.pdf'],
    ])('returns 400 for %s and stores nothing', async (_, data, filename) => {
      const patient = await createPatient();

      await upload(patient.id, data, filename).expect(400);

      expect(
        await db.patientDocument.count({ where: { patientId: patient.id } }),
      ).toBe(0);
      expect(await patientFiles(patient.id)).toEqual([]);
    });

    it('returns 404 for an unknown patient and stores nothing', async () => {
      const patientId = randomUUID();

      await upload(patientId, PDF, 'report.pdf').expect(404);

      expect(existsSync(join(uploadsDir, 'patients', patientId))).toBe(false);
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await upload('not-a-uuid', PDF, 'report.pdf').expect(400);
    });
  });

  describe('GET /patients/:patientId/documents/:documentId/file', () => {
    it('downloads the file as an attachment', async () => {
      const patient = await createPatient();
      const doc = asDocument(
        await upload(patient.id, PDF, 'Результат сна.pdf').expect(201),
      );

      const res = await authed
        .get(fileUrl(patient.id, doc.id))
        .buffer(true)
        .parse(binary)
        .expect(200);

      expect(res.body).toEqual(PDF);
      expect(res.headers['content-type']).toBe('application/pdf');
      expect(res.headers['content-length']).toBe(String(PDF.length));
      expect(res.headers['content-disposition']).toMatch(/^attachment;/);
      expect(res.headers['content-disposition']).toContain(
        `filename*=UTF-8''${encodeURIComponent('Результат сна.pdf')}`,
      );
    });

    it("returns 404 for another patient's document", async () => {
      const owner = await createPatient();
      const other = await createPatient();
      const doc = asDocument(
        await upload(owner.id, PDF, 'report.pdf').expect(201),
      );

      await authed.get(fileUrl(other.id, doc.id)).expect(404);
    });

    it('returns 404 for an unknown document', async () => {
      const patient = await createPatient();

      await authed.get(fileUrl(patient.id, randomUUID())).expect(404);
    });

    it('returns 404 when the file is missing from storage', async () => {
      const patient = await createPatient();
      const doc = asDocument(
        await upload(patient.id, PDF, 'report.pdf').expect(201),
      );
      const { storageKey } = await db.patientDocument.findUniqueOrThrow({
        where: { id: doc.id },
      });
      await rm(filePath(storageKey));

      await authed.get(fileUrl(patient.id, doc.id)).expect(404);
    });

    it('returns 400 for non-UUID ids', async () => {
      await authed.get(fileUrl('not-a-uuid', randomUUID())).expect(400);
      await authed.get(fileUrl(randomUUID(), 'not-a-uuid')).expect(400);
    });
  });

  describe('DELETE /patients/:patientId/documents/:documentId', () => {
    it('removes the row and the file', async () => {
      const patient = await createPatient();
      const doc = asDocument(
        await upload(patient.id, PDF, 'report.pdf').expect(201),
      );
      const { storageKey } = await db.patientDocument.findUniqueOrThrow({
        where: { id: doc.id },
      });

      const res = await authed.delete(docUrl(patient.id, doc.id)).expect(204);

      expect(res.text).toBe('');
      expect(
        await db.patientDocument.findUnique({ where: { id: doc.id } }),
      ).toBeNull();
      expect(existsSync(filePath(storageKey))).toBe(false);
      const list = await authed.get(docsUrl(patient.id)).expect(200);
      expect(list.body).toEqual([]);
    });

    it('returns 404 when deleting the same document twice', async () => {
      const patient = await createPatient();
      const doc = asDocument(
        await upload(patient.id, PDF, 'report.pdf').expect(201),
      );

      await authed.delete(docUrl(patient.id, doc.id)).expect(204);
      await authed.delete(docUrl(patient.id, doc.id)).expect(404);
    });

    it("returns 404 for another patient's document and keeps it", async () => {
      const owner = await createPatient();
      const other = await createPatient();
      const doc = asDocument(
        await upload(owner.id, PDF, 'report.pdf').expect(201),
      );

      await authed.delete(docUrl(other.id, doc.id)).expect(404);

      expect(
        await db.patientDocument.findUnique({ where: { id: doc.id } }),
      ).not.toBeNull();
      expect(await patientFiles(owner.id)).toEqual([doc.id]);
    });

    it('returns 400 for non-UUID ids', async () => {
      await authed.delete(docUrl('not-a-uuid', randomUUID())).expect(400);
      await authed.delete(docUrl(randomUUID(), 'not-a-uuid')).expect(400);
    });
  });
});
