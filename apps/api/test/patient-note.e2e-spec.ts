import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import { PatientNoteDto } from './../src/patient-note/dto.js';

// PatientNoteDto as it arrives over HTTP (dates are ISO strings).
type NoteJson = Omit<PatientNoteDto, 'createdAt'> & { createdAt: string };
const asNote = (res: { body: unknown }) => res.body as NoteJson;
const asNotes = (res: { body: unknown }) => res.body as NoteJson[];

/**
 * E2E contract for /patients/:patientId/notes (every route requires the
 * `access-token` cookie, see PatientNoteController and patient-note/dto.ts).
 *
 * GET  /patients/:patientId/notes            -> 200 PatientNoteDto[]
 * POST /patients/:patientId/notes { body }   -> 201 PatientNoteDto
 *
 * Decisions this spec pins down:
 * - The author is the signed-in user (`session.id`); an `authorId` in the body is ignored.
 * - `authorName` is "firstName lastName", falling back to the author's email.
 * - The list is newest first and only holds the given patient's notes.
 * - `body` is a required non-empty string, at most 5000 characters.
 * - Non-UUID patientId -> 400, unknown patient -> 404 (nothing is created).
 * - No edit/delete routes (notes are append-only, per the Figma Notes card).
 *
 * POST /patients isn't implemented yet, so the facility, provider and
 * patients are created through Prisma. Everything created here is removed
 * in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `note${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;

describe('Patient notes (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;
  let me: { id: string; email: string };
  let facilityId: string;
  let providerId: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (url: string) => http().get(url).set('Cookie', cookie),
    post: (url: string) => http().post(url).set('Cookie', cookie),
  };
  const notesUrl = (patientId: string) => `/patients/${patientId}/notes`;

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
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    db = app.get(DbService);

    // Signed-in user (the note author). Registered users have no name yet.
    const email = `${uniq('user')}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    created.users.push(user.id);
    me = { id: user.id, email };

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

    const providerUser = await db.user.create({
      data: {
        email: `${uniq('provider')}@example.com`,
        passwordHash: 'x',
        salt: 'x',
        role: 'PROVIDER',
        firstName: 'Elayne',
        lastName: 'Badrigian',
      },
    });
    created.users.push(providerUser.id);
    const provider = await db.provider.create({
      data: {
        npi: `${Date.now()}${counter++}`.slice(-10),
        phone: '(303) 941-3333',
        address: '1 Main St',
        dateHired: new Date('2024-01-15'),
        userId: providerUser.id,
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
      // Notes go with their patient (onDelete: Cascade); patients must go before
      // their provider/facility (Restrict), and notes before their author (Restrict).
      if (created.patients.length) {
        await db.patientNote.deleteMany({
          where: { patientId: { in: created.patients } },
        });
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
    }
  });

  describe('authorization', () => {
    it('GET returns 401 without a token', async () => {
      await http().get(notesUrl(randomUUID())).expect(401);
    });

    it('POST returns 401 without a token', async () => {
      await http()
        .post(notesUrl(randomUUID()))
        .send({ body: 'Hello' })
        .expect(401);
    });
  });

  describe('GET /patients/:patientId/notes', () => {
    it('returns an empty list for a patient without notes', async () => {
      const patient = await createPatient();

      const res = await authed.get(notesUrl(patient.id)).expect(200);

      expect(res.body).toEqual([]);
    });

    it("returns only this patient's notes, newest first", async () => {
      const patient = await createPatient();
      const other = await createPatient();
      const [oldest, middle, newest] = await Promise.all(
        [
          ['first', '2022-10-02T11:14:00.000Z'],
          ['second', '2023-01-15T09:00:00.000Z'],
          ['third', '2023-08-08T10:23:00.000Z'],
        ].map(([body, at]) =>
          db.patientNote.create({
            data: {
              body,
              patientId: patient.id,
              authorId: me.id,
              createdAt: new Date(at),
            },
          }),
        ),
      );
      await db.patientNote.create({
        data: { body: 'not mine', patientId: other.id, authorId: me.id },
      });

      const res = await authed.get(notesUrl(patient.id)).expect(200);

      expect(asNotes(res).map((n) => n.id)).toEqual([
        newest.id,
        middle.id,
        oldest.id,
      ]);
      expect(asNotes(res)[0]).toEqual({
        id: newest.id,
        body: 'third',
        createdAt: '2023-08-08T10:23:00.000Z',
        authorId: me.id,
        authorName: me.email,
      });
    });

    it('returns 404 for an unknown patient', async () => {
      await authed.get(notesUrl(randomUUID())).expect(404);
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await authed.get(notesUrl('not-a-uuid')).expect(400);
    });
  });

  describe('POST /patients/:patientId/notes', () => {
    it('creates a note authored by the signed-in user', async () => {
      const patient = await createPatient();
      const body = 'Patient reports mask discomfort, refit scheduled.';

      const res = await authed
        .post(notesUrl(patient.id))
        .send({ body })
        .expect(201);

      const note = asNote(res);
      expect(note).toMatchObject({
        body,
        authorId: me.id,
        authorName: me.email, // registered without a name -> email fallback
      });
      expect(typeof note.id).toBe('string');
      expect(Number.isNaN(Date.parse(note.createdAt))).toBe(false);

      const saved = await db.patientNote.findUniqueOrThrow({
        where: { id: note.id },
      });
      expect(saved).toMatchObject({
        body,
        patientId: patient.id,
        authorId: me.id,
      });

      const list = await authed.get(notesUrl(patient.id)).expect(200);
      expect(asNotes(list).map((n) => n.id)).toEqual([note.id]);
    });

    it('uses "firstName lastName" as authorName when the author has a name', async () => {
      const patient = await createPatient();
      await db.user.update({
        where: { id: me.id },
        data: { firstName: 'Elayne', lastName: 'Badrigian' },
      });

      try {
        const res = await authed
          .post(notesUrl(patient.id))
          .send({ body: 'Named author' })
          .expect(201);

        expect(asNote(res).authorName).toBe('Elayne Badrigian');
      } finally {
        await db.user.update({
          where: { id: me.id },
          data: { firstName: null, lastName: null },
        });
      }
    });

    it('ignores an authorId sent in the body', async () => {
      const patient = await createPatient();

      const res = await authed
        .post(notesUrl(patient.id))
        .send({ body: 'Spoof attempt', authorId: randomUUID() })
        .expect(201);

      expect(asNote(res).authorId).toBe(me.id);
    });

    it('accepts a body of exactly 5000 characters', async () => {
      const patient = await createPatient();

      await authed
        .post(notesUrl(patient.id))
        .send({ body: 'a'.repeat(5000) })
        .expect(201);
    });

    it.each([
      ['missing', {}],
      ['empty', { body: '' }],
      ['not a string', { body: 123 }],
      ['longer than 5000 characters', { body: 'a'.repeat(5001) }],
    ])('returns 400 when body is %s', async (_, payload) => {
      const patient = await createPatient();

      await authed.post(notesUrl(patient.id)).send(payload).expect(400);

      expect(
        await db.patientNote.count({ where: { patientId: patient.id } }),
      ).toBe(0);
    });

    it('returns 404 for an unknown patient and creates nothing', async () => {
      const before = await db.patientNote.count({ where: { authorId: me.id } });

      await authed
        .post(notesUrl(randomUUID()))
        .send({ body: 'Lost note' })
        .expect(404);

      expect(await db.patientNote.count({ where: { authorId: me.id } })).toBe(
        before,
      );
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await authed
        .post(notesUrl('not-a-uuid'))
        .send({ body: 'Hello' })
        .expect(400);
    });
  });
});
