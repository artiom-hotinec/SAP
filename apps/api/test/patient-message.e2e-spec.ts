import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import { PatientMessageDto } from './../src/patient-message/dto.js';

// PatientMessageDto as it arrives over HTTP (dates are ISO strings).
type MessageJson = Omit<PatientMessageDto, 'createdAt'> & {
  createdAt: string;
};
const asMessage = (res: { body: unknown }) => res.body as MessageJson;
const asMessages = (res: { body: unknown }) => res.body as MessageJson[];

/**
 * E2E contract for /patients/:patientId/messages (every route requires the
 * `access-token` cookie, see PatientMessageController and patient-message/dto.ts).
 *
 * GET  /patients/:patientId/messages            -> 200 PatientMessageDto[]
 * POST /patients/:patientId/messages { body }   -> 201 PatientMessageDto
 *
 * Decisions this spec pins down:
 * - Only providers can send: the sender is the Provider linked to the
 *   signed-in user; a user without a Provider row gets 403.
 * - `direction` is always PROVIDER_TO_PATIENT on POST; `direction` and
 *   `providerId` in the body are ignored.
 * - `providerName` is "firstName lastName", falling back to the provider's email.
 * - The list is newest first, holds both directions and only the given
 *   patient's messages.
 * - `body` is a required non-empty string, at most 2000 characters.
 * - Non-UUID patientId -> 400, unknown patient -> 404 (nothing is created).
 *
 * POST /patients isn't implemented yet, so the facility, providers and
 * patients are created through Prisma. Everything created here is removed
 * in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `msg${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;
const uniqNpi = () => `${Date.now()}${counter++}`.slice(-10);

describe('Patient messages (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string; // signed-in provider
  let patientCookie: string; // signed-in user without a Provider row
  let me: { userId: string; email: string; providerId: string };
  let otherProviderId: string;
  let facilityId: string;

  const http = () => request(app.getHttpServer());
  const as = (c: string) => ({
    get: (url: string) => http().get(url).set('Cookie', c),
    post: (url: string) => http().post(url).set('Cookie', c),
  });
  const authed = {
    get: (url: string) => as(cookie).get(url),
    post: (url: string) => as(cookie).post(url),
  };
  const messagesUrl = (patientId: string) => `/patients/${patientId}/messages`;

  const created = {
    patients: [] as string[],
    providers: [] as string[],
    users: [] as string[],
    facilities: [] as string[],
  };

  const registerAndLogin = async () => {
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
    const token = ([] as string[])
      .concat(login.headers['set-cookie'] as unknown as string[])
      .find((c) => c.startsWith('access-token='))!
      .split(';')[0];

    return { user, email, cookie: token };
  };

  const createProvider = async (userId: string) => {
    const provider = await db.provider.create({
      data: {
        npi: uniqNpi(),
        phone: '(303) 941-3333',
        address: '1 Main St',
        dateHired: new Date('2024-01-15'),
        userId,
        facilityId,
      },
    });
    created.providers.push(provider.id);
    return provider;
  };

  const createPatient = async () => {
    const p = await db.patient.create({
      data: {
        firstName: `Wayne${run}`,
        lastName: 'Bernard',
        email: `${uniq('patient')}@example.com`,
        phone: '(303) 941-5555',
        providerId: me.providerId,
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

    // Signed-in provider (the sender). Registered users have no name yet.
    const signedIn = await registerAndLogin();
    const myProvider = await createProvider(signedIn.user.id);
    cookie = signedIn.cookie;
    me = {
      userId: signedIn.user.id,
      email: signedIn.email,
      providerId: myProvider.id,
    };

    // Signed-in user with no Provider row (can read, can't send).
    patientCookie = (await registerAndLogin()).cookie;

    // Another provider, author of seeded messages.
    const otherUser = await db.user.create({
      data: {
        email: `${uniq('provider')}@example.com`,
        passwordHash: 'x',
        salt: 'x',
        role: 'PROVIDER',
        firstName: 'Elayne',
        lastName: 'Badrigian',
      },
    });
    created.users.push(otherUser.id);
    otherProviderId = (await createProvider(otherUser.id)).id;
  });

  afterAll(async () => {
    // Only delete what was actually created: if beforeAll failed (e.g. the DB
    // is down), this keeps the real error from being buried under a cleanup one.
    try {
      // Messages restrict deleting their provider, so they go first; patients
      // must go before their provider/facility (Restrict).
      if (created.patients.length) {
        await db.providerMessage.deleteMany({
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
      await http().get(messagesUrl(randomUUID())).expect(401);
    });

    it('POST returns 401 without a token', async () => {
      await http()
        .post(messagesUrl(randomUUID()))
        .send({ body: 'Hello' })
        .expect(401);
    });
  });

  describe('GET /patients/:patientId/messages', () => {
    it('returns an empty list for a patient without messages', async () => {
      const patient = await createPatient();

      const res = await authed.get(messagesUrl(patient.id)).expect(200);

      expect(res.body).toEqual([]);
    });

    it("returns only this patient's messages in both directions, newest first", async () => {
      const patient = await createPatient();
      const other = await createPatient();
      const [oldest, middle, newest] = await Promise.all(
        (
          [
            [
              'Hello I just got my KAM device',
              'PATIENT_TO_PROVIDER',
              '2023-08-08T10:23:00.000Z',
            ],
            [
              'How do I connect it to my phone?',
              'PATIENT_TO_PROVIDER',
              '2023-08-08T10:24:00.000Z',
            ],
            [
              'Hello. Yes, I can help you with that.',
              'PROVIDER_TO_PATIENT',
              '2023-08-08T10:30:00.000Z',
            ],
          ] as const
        ).map(([body, direction, at]) =>
          db.providerMessage.create({
            data: {
              body,
              direction,
              patientId: patient.id,
              providerId: otherProviderId,
              createdAt: new Date(at),
            },
          }),
        ),
      );
      await db.providerMessage.create({
        data: {
          body: 'not mine',
          direction: 'PROVIDER_TO_PATIENT',
          patientId: other.id,
          providerId: otherProviderId,
        },
      });

      const res = await authed.get(messagesUrl(patient.id)).expect(200);

      expect(asMessages(res).map((m) => m.id)).toEqual([
        newest.id,
        middle.id,
        oldest.id,
      ]);
      expect(asMessages(res)[0]).toEqual({
        id: newest.id,
        body: 'Hello. Yes, I can help you with that.',
        direction: 'PROVIDER_TO_PATIENT',
        createdAt: '2023-08-08T10:30:00.000Z',
        providerId: otherProviderId,
        providerName: 'Elayne Badrigian',
      });
      expect(asMessages(res)[2].direction).toBe('PATIENT_TO_PROVIDER');
    });

    it('is readable by a signed-in user who is not a provider', async () => {
      const patient = await createPatient();

      await as(patientCookie).get(messagesUrl(patient.id)).expect(200);
    });

    it('returns 404 for an unknown patient', async () => {
      await authed.get(messagesUrl(randomUUID())).expect(404);
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await authed.get(messagesUrl('not-a-uuid')).expect(400);
    });
  });

  describe('POST /patients/:patientId/messages', () => {
    it('sends a message from the signed-in provider to the patient', async () => {
      const patient = await createPatient();
      const body = 'Hello. Yes, I can help you with that.';

      const res = await authed
        .post(messagesUrl(patient.id))
        .send({ body })
        .expect(201);

      const message = asMessage(res);
      expect(message).toMatchObject({
        body,
        direction: 'PROVIDER_TO_PATIENT',
        providerId: me.providerId,
        providerName: me.email, // registered without a name -> email fallback
      });
      expect(typeof message.id).toBe('string');
      expect(Number.isNaN(Date.parse(message.createdAt))).toBe(false);

      const saved = await db.providerMessage.findUniqueOrThrow({
        where: { id: message.id },
      });
      expect(saved).toMatchObject({
        body,
        direction: 'PROVIDER_TO_PATIENT',
        patientId: patient.id,
        providerId: me.providerId,
      });

      const list = await authed.get(messagesUrl(patient.id)).expect(200);
      expect(asMessages(list).map((m) => m.id)).toEqual([message.id]);
    });

    it('uses "firstName lastName" as providerName when the provider has a name', async () => {
      const patient = await createPatient();
      await db.user.update({
        where: { id: me.userId },
        data: { firstName: 'Elayne', lastName: 'Badrigian' },
      });

      try {
        const res = await authed
          .post(messagesUrl(patient.id))
          .send({ body: 'Named sender' })
          .expect(201);

        expect(asMessage(res).providerName).toBe('Elayne Badrigian');
      } finally {
        await db.user.update({
          where: { id: me.userId },
          data: { firstName: null, lastName: null },
        });
      }
    });

    it('ignores direction and providerId sent in the body', async () => {
      const patient = await createPatient();

      const res = await authed
        .post(messagesUrl(patient.id))
        .send({
          body: 'Spoof attempt',
          direction: 'PATIENT_TO_PROVIDER',
          providerId: otherProviderId,
        })
        .expect(201);

      expect(asMessage(res)).toMatchObject({
        direction: 'PROVIDER_TO_PATIENT',
        providerId: me.providerId,
      });
    });

    it('returns 403 for a signed-in user who is not a provider and creates nothing', async () => {
      const patient = await createPatient();

      await as(patientCookie)
        .post(messagesUrl(patient.id))
        .send({ body: 'Hi from a patient' })
        .expect(403);

      expect(
        await db.providerMessage.count({ where: { patientId: patient.id } }),
      ).toBe(0);
    });

    it('accepts a body of exactly 2000 characters', async () => {
      const patient = await createPatient();

      await authed
        .post(messagesUrl(patient.id))
        .send({ body: 'a'.repeat(2000) })
        .expect(201);
    });

    it.each([
      ['missing', {}],
      ['empty', { body: '' }],
      ['not a string', { body: 123 }],
      ['longer than 2000 characters', { body: 'a'.repeat(2001) }],
    ])('returns 400 when body is %s', async (_, payload) => {
      const patient = await createPatient();

      await authed.post(messagesUrl(patient.id)).send(payload).expect(400);

      expect(
        await db.providerMessage.count({ where: { patientId: patient.id } }),
      ).toBe(0);
    });

    it('returns 404 for an unknown patient and creates nothing', async () => {
      const before = await db.providerMessage.count({
        where: { providerId: me.providerId },
      });

      await authed
        .post(messagesUrl(randomUUID()))
        .send({ body: 'Lost message' })
        .expect(404);

      expect(
        await db.providerMessage.count({
          where: { providerId: me.providerId },
        }),
      ).toBe(before);
    });

    it('returns 400 for a non-UUID patientId', async () => {
      await authed
        .post(messagesUrl('not-a-uuid'))
        .send({ body: 'Hello' })
        .expect(400);
    });
  });
});
