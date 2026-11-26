import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import type { PatientDto } from './../src/patient/dto/PatientDto.js';

// PatientDto as it arrives over HTTP (dates are ISO strings).
type PatientJson = Omit<PatientDto, 'dob' | 'lastAppointment' | 'createdAt'> & {
  dob: string | null;
  lastAppointment: string | null;
  createdAt: string;
};
const one = (res: { body: unknown }) => res.body as PatientJson;
const many = (res: { body: unknown }) => res.body as PatientJson[];
const errorType = (res: { body: unknown }) =>
  (res.body as { type?: string }).type;

/**
 * E2E contract for /patients (every route requires the `access-token` cookie,
 * see PatientController and patient/dto/*).
 *
 * GET    /patients?q=&sortBy=&filterBy=  -> 200 PatientDto[]
 * GET    /patients/:id                   -> 200 PatientDto
 * POST   /patients                       -> 201 PatientDto
 * PATCH  /patients/:id                   -> 200 PatientDto
 * DELETE /patients/:id                   -> 200 PatientDto (the removed patient)
 * PUT    /patients/:id/photo (multipart) -> 200 PatientDto
 * GET    /patients/:id/photo             -> 200 image/jpeg
 * DELETE /patients/:id/photo             -> 200 PatientDto
 *
 * Decisions this spec pins down:
 * - The caller is a provider; every route is scoped to the caller's facility.
 *   A patient of another facility is a 404, never a 403, and is never changed.
 *   A signed-in user without a provider row gets 403.
 * - The facility always comes from the caller (a `facilityId` in the body is
 *   ignored); `providerId` defaults to the caller and must be in the facility.
 * - Create and update are all-or-nothing: a failed device claim leaves no
 *   patient behind, and a failed swap keeps the current device.
 * - A partial update never clears a field the request did not send.
 * - Deleting a patient frees its device and removes its files.
 * - Photos are stored as 512x512 JPEG without metadata under
 *   `patients/<id>/avatar/<uuid>.jpg`; a replaced photo's file is removed.
 *
 * StorageService reads UPLOADS_DIR when it is created, so this spec points it
 * at a temp folder before the app starts. Everything created here (rows and
 * the temp folder) is removed in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `pt${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;
const DAY = 86_400_000;

describe('Patients (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;
  let cookieNoProvider: string;
  let uploadsDir: string;
  let previousUploadsDir: string | undefined;

  let facilityId: string; // the caller's facility
  let otherFacilityId: string;
  let providerId: string; // the caller
  let colleagueId: string; // same facility
  let outsiderId: string; // other facility
  let deviceModelId: string;

  const http = () => request(app.getHttpServer());
  const as = (c: string) => ({
    get: (url: string) => http().get(url).set('Cookie', c),
    post: (url: string) => http().post(url).set('Cookie', c),
    patch: (url: string) => http().patch(url).set('Cookie', c),
    put: (url: string) => http().put(url).set('Cookie', c),
    delete: (url: string) => http().delete(url).set('Cookie', c),
  });
  const authed = {
    get: (url: string) => as(cookie).get(url),
    post: (url: string) => as(cookie).post(url),
    patch: (url: string) => as(cookie).patch(url),
    put: (url: string) => as(cookie).put(url),
    delete: (url: string) => as(cookie).delete(url),
  };
  const photoUrl = (id: string) => `/patients/${id}/photo`;
  const filePath = (key: string) => join(uploadsDir, key);

  const created = {
    patients: [] as string[],
    devices: [] as string[],
    providers: [] as string[],
    users: [] as string[],
    facilities: [] as string[],
  };

  const login = async (email: string) => {
    const res = await http()
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    return ([] as string[])
      .concat(res.headers['set-cookie'] as unknown as string[])
      .find((c) => c.startsWith('access-token='))!
      .split(';')[0];
  };

  const registerUser = async () => {
    const email = `${uniq('user')}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const user = await db.user.findUniqueOrThrow({ where: { email } });
    created.users.push(user.id);
    return { user, email };
  };

  const createFacility = async () => {
    const f = await db.facility.create({
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
    created.facilities.push(f.id);
    return f.id;
  };

  const createProvider = async (
    userId: string,
    facility: string,
    names: { firstName: string; lastName: string },
  ) => {
    await db.user.update({ where: { id: userId }, data: names });
    const p = await db.provider.create({
      data: {
        npi: `${Date.now()}${counter++}`.slice(-10),
        phone: '(303) 941-3333',
        address: '1 Main St',
        dateHired: new Date('2024-01-15'),
        userId,
        facilityId: facility,
      },
    });
    created.providers.push(p.id);
    return p.id;
  };

  const createExtraProvider = async (
    facility: string,
    names: { firstName: string; lastName: string },
  ) => {
    const user = await db.user.create({
      data: {
        email: `${uniq('provider')}@example.com`,
        passwordHash: 'x',
        salt: 'x',
        role: 'PROVIDER',
      },
    });
    created.users.push(user.id);
    return createProvider(user.id, facility, names);
  };

  // A patient straight in the DB (owned by the caller's facility by default).
  const seedPatient = async (
    data: {
      firstName?: string;
      lastName?: string;
      provider?: string;
      facility?: string;
      createdAt?: Date;
      avatar?: string;
      clinicalInfo?: Record<string, unknown>;
    } = {},
  ) => {
    const p = await db.patient.create({
      data: {
        firstName: data.firstName ?? 'Wayne',
        lastName: data.lastName ?? 'Bernard',
        email: `${uniq('patient')}@example.com`,
        phone: '(303) 941-5555',
        providerId: data.provider ?? providerId,
        facilityId: data.facility ?? facilityId,
        ...(data.createdAt && { createdAt: data.createdAt }),
        ...(data.avatar && { avatar: data.avatar }),
        ...(data.clinicalInfo && {
          clinicalInfo: { create: data.clinicalInfo },
        }),
      },
    });
    created.patients.push(p.id);
    return p;
  };

  const seedDevice = async (
    data: { facility?: string | null; patientId?: string } = {},
  ) => {
    const d = await db.device.create({
      data: {
        deviceId: uniq('(01)DEV'),
        manufactureDate: new Date('2021-08-21'),
        deviceModelId,
        facilityId: data.facility === undefined ? facilityId : data.facility,
        patientId: data.patientId ?? null,
      },
    });
    created.devices.push(d.id);
    return d;
  };

  // A request body the API accepts; override fields per test.
  const body = (over: Record<string, unknown> = {}) => ({
    firstName: 'Wayne',
    lastName: 'Bernard',
    email: `${uniq('new')}@example.com`,
    phone: '(303) 941-5555',
    address: '650 Hunt Club Lane',
    zip: '80014',
    city: 'Denver',
    state: 'CO',
    clinicalInfo: { maskFitting: false, sleepStudy: false },
    ...over,
  });

  const png = (width = 1200, height = 800) =>
    sharp({
      create: {
        width,
        height,
        channels: 3,
        background: { r: 200, g: 40, b: 40 },
      },
    })
      .png()
      .toBuffer();

  // Put a file where StorageService expects it, as the service would have.
  const seedFile = async (key: string, data = Buffer.from('file')) => {
    await mkdir(dirname(filePath(key)), { recursive: true });
    await writeFile(filePath(key), data);
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

    facilityId = await createFacility();
    otherFacilityId = await createFacility();

    // The caller, a provider in `facility`.
    const caller = await registerUser();
    cookie = await login(caller.email);
    providerId = await createProvider(caller.user.id, facilityId, {
      firstName: 'Elayne',
      lastName: 'Badrigian',
    });
    colleagueId = await createExtraProvider(facilityId, {
      firstName: 'Colin',
      lastName: 'Colleague',
    });
    outsiderId = await createExtraProvider(otherFacilityId, {
      firstName: 'Olga',
      lastName: 'Outsider',
    });

    // Signed in, but not a provider.
    const lone = await registerUser();
    cookieNoProvider = await login(lone.email);

    const model = await db.deviceModel.create({ data: { name: uniq('SAP') } });
    deviceModelId = model.id;
  });

  afterAll(async () => {
    // Only delete what was actually created: if beforeAll failed (e.g. the DB
    // is down), this keeps the real error from being buried under a cleanup one.
    try {
      // Patients (and their sessions, notes, documents) go first: devices,
      // providers and facilities are Restrict targets.
      if (created.patients.length) {
        await db.patient.deleteMany({
          where: { id: { in: created.patients } },
        });
      }
      // Patients created through the API were not registered above.
      await db.patient.deleteMany({
        where: { facilityId: { in: created.facilities } },
      });
      if (created.devices.length) {
        await db.device.deleteMany({ where: { id: { in: created.devices } } });
      }
      if (deviceModelId) {
        await db.deviceModel.deleteMany({ where: { id: deviceModelId } });
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
    const id = randomUUID();

    it.each([
      ['GET /patients', () => http().get('/patients')],
      ['GET /patients/:id', () => http().get(`/patients/${id}`)],
      ['POST /patients', () => http().post('/patients').send(body())],
      ['PATCH /patients/:id', () => http().patch(`/patients/${id}`).send({})],
      ['DELETE /patients/:id', () => http().delete(`/patients/${id}`)],
      [
        'PUT /patients/:id/photo',
        () =>
          http().put(photoUrl(id)).attach('file', Buffer.from('x'), 'a.png'),
      ],
      ['GET /patients/:id/photo', () => http().get(photoUrl(id))],
      ['DELETE /patients/:id/photo', () => http().delete(photoUrl(id))],
    ])('%s returns 401 without a token', async (_, send) => {
      await send().expect(401);
    });

    it('returns 403 for a signed-in user who is not a provider', async () => {
      const other = await seedPatient();

      await as(cookieNoProvider).get('/patients').expect(403);
      await as(cookieNoProvider).get(`/patients/${other.id}`).expect(403);
      await as(cookieNoProvider).post('/patients').send(body()).expect(403);
      await as(cookieNoProvider).delete(`/patients/${other.id}`).expect(403);
      expect(
        await db.patient.findUnique({ where: { id: other.id } }),
      ).not.toBeNull();
    });
  });

  describe('GET /patients', () => {
    it("lists the caller's facility, colleagues included, never another facility", async () => {
      const mine = await seedPatient();
      const colleagues = await seedPatient({ provider: colleagueId });
      const foreign = await seedPatient({
        provider: outsiderId,
        facility: otherFacilityId,
      });

      const res = await authed.get('/patients').expect(200);

      const ids = many(res).map((p) => p.id);
      expect(ids).toEqual(expect.arrayContaining([mine.id, colleagues.id]));
      expect(ids).not.toContain(foreign.id);
    });

    it('returns the patient fields and the derived ones', async () => {
      const p = await seedPatient({ firstName: 'Shape', lastName: 'Check' });
      await db.patient.update({
        where: { id: p.id },
        data: {
          dob: new Date('1971-02-20'),
          sex: 'MALE',
          heightIn: 71,
          weightLb: 220,
          address: '650 Hunt Club Lane',
          city: 'Denver',
          state: 'CO',
          unit: '4B',
          zip: '80014',
        },
      });

      const res = await authed.get('/patients?q=Shape').expect(200);

      const found = many(res).find((x) => x.id === p.id);
      expect(found).toEqual({
        id: p.id,
        firstName: 'Shape',
        lastName: 'Check',
        email: p.email,
        phone: '(303) 941-5555',
        dob: '1971-02-20T00:00:00.000Z',
        sex: 'MALE',
        heightIn: 71,
        weightLb: 220,
        address: '650 Hunt Club Lane',
        city: 'Denver',
        state: 'CO',
        unit: '4B',
        zip: '80014',
        providerId,
        providerName: 'Elayne Badrigian',
        lastAppointment: null,
        registered: false,
        createdAt: p.createdAt.toISOString(),
      });
    });

    it("reports the provider's name and the newest session as lastAppointment", async () => {
      const p = await seedPatient({
        firstName: 'Sessioned',
        provider: colleagueId,
      });
      const device = await seedDevice({ patientId: p.id });
      const now = Date.now();
      const at = (daysAgo: number) => new Date(now - daysAgo * DAY);
      await db.therapySession.createMany({
        data: [40, 3].map((d) => ({
          startedAt: at(d + 0.3),
          endedAt: at(d),
          usageHours: 7,
          patientId: p.id,
          deviceId: device.id,
        })),
      });

      const res = await authed.get('/patients?q=Sessioned').expect(200);

      const found = many(res).find((x) => x.id === p.id)!;
      expect(found.providerName).toBe('Colin Colleague');
      expect(found.lastAppointment).toBe(at(3).toISOString());
    });

    describe('q', () => {
      it('matches first or last name, case-insensitive', async () => {
        const p = await seedPatient({
          firstName: `Zelda${run}`,
          lastName: `Quimby${run}`,
        });

        for (const q of [`zelda${run}`, `QUIMBY${run}`.toUpperCase(), 'zeld']) {
          const res = await authed.get(`/patients?q=${q}`).expect(200);
          expect(many(res).map((x) => x.id)).toContain(p.id);
        }
      });

      it('matches a full name written first then last', async () => {
        const p = await seedPatient({
          firstName: `Ada${run}`,
          lastName: `Lovelace${run}`,
        });

        const res = await authed
          .get(`/patients?q=${encodeURIComponent(`ada${run} lovelace${run}`)}`)
          .expect(200);

        expect(many(res).map((x) => x.id)).toEqual([p.id]);
      });

      it('returns an empty list when nothing matches', async () => {
        const res = await authed.get(`/patients?q=nobody-${run}`).expect(200);

        expect(res.body).toEqual([]);
      });
    });

    describe('sortBy', () => {
      it('lastName sorts A-Z by last then first name', async () => {
        const tag = `Srt${counter++}${Date.now()}`;
        const c = await seedPatient({
          firstName: 'B',
          lastName: `${tag}-Beta`,
        });
        const b2 = await seedPatient({
          firstName: 'B',
          lastName: `${tag}-Alpha`,
        });
        const b1 = await seedPatient({
          firstName: 'A',
          lastName: `${tag}-Alpha`,
        });

        const res = await authed
          .get(`/patients?q=${tag}&sortBy=lastName`)
          .expect(200);

        expect(many(res).map((x) => x.id)).toEqual([b1.id, b2.id, c.id]);
      });

      it('dateAdded and the default sort newest first', async () => {
        const tag = `Dte${counter++}${Date.now()}`;
        const old = await seedPatient({
          lastName: tag,
          createdAt: new Date('2022-01-01'),
        });
        const mid = await seedPatient({
          lastName: tag,
          createdAt: new Date('2023-01-01'),
        });
        const recent = await seedPatient({
          lastName: tag,
          createdAt: new Date('2024-01-01'),
        });
        const expected = [recent.id, mid.id, old.id];

        const explicit = await authed
          .get(`/patients?q=${tag}&sortBy=dateAdded`)
          .expect(200);
        const byDefault = await authed.get(`/patients?q=${tag}`).expect(200);

        expect(many(explicit).map((x) => x.id)).toEqual(expected);
        expect(many(byDefault).map((x) => x.id)).toEqual(expected);
      });

      it('returns 400 for an unknown sortBy', async () => {
        await authed.get('/patients?sortBy=height').expect(400);
      });
    });

    describe('filterBy', () => {
      it("myPatients keeps only the caller's own patients", async () => {
        const tag = `Mine${counter++}${Date.now()}`;
        const mine = await seedPatient({ lastName: tag });
        await seedPatient({ lastName: tag, provider: colleagueId });

        const res = await authed
          .get(`/patients?q=${tag}&filterBy=myPatients`)
          .expect(200);

        expect(many(res).map((x) => x.id)).toEqual([mine.id]);
      });

      it('activePatients / inActivePatients split on a session in the last 30 days', async () => {
        const tag = `Act${counter++}${Date.now()}`;
        const active = await seedPatient({ lastName: tag });
        const stale = await seedPatient({ lastName: tag });
        const never = await seedPatient({ lastName: tag });
        const device = await seedDevice();
        const session = (patientId: string, daysAgo: number) =>
          db.therapySession.create({
            data: {
              startedAt: new Date(Date.now() - (daysAgo + 0.3) * DAY),
              endedAt: new Date(Date.now() - daysAgo * DAY),
              usageHours: 7,
              patientId,
              deviceId: device.id,
            },
          });
        await session(active.id, 2);
        await session(stale.id, 90);

        const on = await authed
          .get(`/patients?q=${tag}&filterBy=activePatients`)
          .expect(200);
        const off = await authed
          .get(`/patients?q=${tag}&filterBy=inActivePatients`)
          .expect(200);
        const all = await authed
          .get(`/patients?q=${tag}&filterBy=allPatients`)
          .expect(200);

        expect(many(on).map((x) => x.id)).toEqual([active.id]);
        expect(
          many(off)
            .map((x) => x.id)
            .sort(),
        ).toEqual([stale.id, never.id].sort());
        expect(many(all)).toHaveLength(3);
      });

      it('returns 400 for an unknown filterBy', async () => {
        await authed.get('/patients?filterBy=everyone').expect(400);
      });
    });
  });

  describe('GET /patients/:id', () => {
    it('returns the patient', async () => {
      const p = await seedPatient();

      const res = await authed.get(`/patients/${p.id}`).expect(200);

      expect(one(res)).toMatchObject({
        id: p.id,
        email: p.email,
        providerId,
        providerName: 'Elayne Badrigian',
        registered: false,
        lastAppointment: null,
      });
    });

    it("returns a colleague's patient from the same facility", async () => {
      const p = await seedPatient({ provider: colleagueId });

      const res = await authed.get(`/patients/${p.id}`).expect(200);

      expect(one(res).providerId).toBe(colleagueId);
    });

    it("returns 404 for another facility's patient", async () => {
      const p = await seedPatient({
        provider: outsiderId,
        facility: otherFacilityId,
      });

      await authed.get(`/patients/${p.id}`).expect(404);
    });

    it('returns 404 for an unknown patient', async () => {
      await authed.get(`/patients/${randomUUID()}`).expect(404);
    });

    it('returns 400 for a non-UUID id', async () => {
      await authed.get('/patients/not-a-uuid').expect(400);
    });
  });

  describe('POST /patients', () => {
    it('creates the patient and its clinical info for the caller', async () => {
      const data = body({
        dob: '1971-02-20',
        sex: 'MALE',
        heightIn: 71,
        weightLb: 220,
        unit: '4B',
        clinicalInfo: {
          lastAppointment: '2021-12-11',
          maskFitting: true,
          maskFittingDate: '2022-01-05',
          sleepStudy: true,
          sleepStudyDate: '2022-02-10',
          atHomeStudy: true,
          sleepStudyBloodOxygenPct: 90,
          sleepStudyHeartRateBpm: 56,
          sleepStudySnoringHours: 3,
        },
      });

      const res = await authed.post('/patients').send(data).expect(201);

      const dto = one(res);
      created.patients.push(dto.id);
      expect(dto).toMatchObject({
        firstName: 'Wayne',
        lastName: 'Bernard',
        email: data.email,
        dob: '1971-02-20T00:00:00.000Z',
        sex: 'MALE',
        unit: '4B',
        providerId,
        providerName: 'Elayne Badrigian',
        registered: false,
        lastAppointment: null,
      });

      const saved = await db.patient.findUniqueOrThrow({
        where: { id: dto.id },
        include: { clinicalInfo: true },
      });
      expect(saved.facilityId).toBe(facilityId);
      expect(saved.clinicalInfo).toMatchObject({
        lastAppointment: new Date('2021-12-11'),
        maskFitting: true,
        maskFittingDate: new Date('2022-01-05'),
        sleepStudy: true,
        sleepStudyDate: new Date('2022-02-10'),
        atHomeStudy: true,
        sleepStudyBloodOxygenPct: 90,
        sleepStudyHeartRateBpm: 56,
        sleepStudySnoringHours: 3,
        prescribedPressureMin: null,
        prescribedPressureMax: null,
      });
    });

    it('ignores a facilityId sent in the body', async () => {
      const res = await authed
        .post('/patients')
        .send(body({ facilityId: otherFacilityId }))
        .expect(201);

      created.patients.push(one(res).id);
      const saved = await db.patient.findUniqueOrThrow({
        where: { id: one(res).id },
      });
      expect(saved.facilityId).toBe(facilityId);
    });

    it('assigns a provider from the same facility', async () => {
      const res = await authed
        .post('/patients')
        .send(body({ providerId: colleagueId }))
        .expect(201);

      created.patients.push(one(res).id);
      expect(one(res)).toMatchObject({
        providerId: colleagueId,
        providerName: 'Colin Colleague',
      });
    });

    it('returns 404 for a provider of another facility and saves nothing', async () => {
      const data = body({ providerId: outsiderId });

      const res = await authed.post('/patients').send(data).expect(404);

      expect(errorType(res)).toBe('provider-not-found');
      expect(await db.patient.count({ where: { email: data.email } })).toBe(0);
    });

    describe('with a device', () => {
      it('assigns it and stores the prescribed pressure as min and max', async () => {
        const device = await seedDevice();

        const res = await authed
          .post('/patients')
          .send(
            body({
              device: { deviceId: device.deviceId, prescribedPressure: 10 },
            }),
          )
          .expect(201);

        const id = one(res).id;
        created.patients.push(id);
        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(id);
        const info = await db.patientClinicalInfo.findUniqueOrThrow({
          where: { patientId: id },
        });
        expect(info.prescribedPressureMin).toBe(10);
        expect(info.prescribedPressureMax).toBe(10);
      });

      it('accepts a device that belongs to no facility yet', async () => {
        const device = await seedDevice({ facility: null });

        const res = await authed
          .post('/patients')
          .send(
            body({
              device: { deviceId: device.deviceId, prescribedPressure: 8 },
            }),
          )
          .expect(201);

        created.patients.push(one(res).id);
      });

      it('returns 404 for an unknown device and saves nothing', async () => {
        const data = body({
          device: { deviceId: uniq('(01)NOPE'), prescribedPressure: 10 },
        });

        const res = await authed.post('/patients').send(data).expect(404);

        expect(errorType(res)).toBe('device-not-found');
        expect(await db.patient.count({ where: { email: data.email } })).toBe(
          0,
        );
      });

      it('returns 409 for a device that already has a patient and saves nothing', async () => {
        const holder = await seedPatient();
        const device = await seedDevice({ patientId: holder.id });
        const data = body({
          device: { deviceId: device.deviceId, prescribedPressure: 10 },
        });

        const res = await authed.post('/patients').send(data).expect(409);

        expect(errorType(res)).toBe('device-unavailable');
        expect(await db.patient.count({ where: { email: data.email } })).toBe(
          0,
        );
        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(holder.id);
      });

      it("returns 409 for another facility's device and saves nothing", async () => {
        const device = await seedDevice({ facility: otherFacilityId });
        const data = body({
          device: { deviceId: device.deviceId, prescribedPressure: 10 },
        });

        const res = await authed.post('/patients').send(data).expect(409);

        expect(errorType(res)).toBe('device-unavailable');
        expect(await db.patient.count({ where: { email: data.email } })).toBe(
          0,
        );
      });

      it('gives one device to only one of two simultaneous requests', async () => {
        const device = await seedDevice();
        const send = () =>
          authed.post('/patients').send(
            body({
              device: { deviceId: device.deviceId, prescribedPressure: 10 },
            }),
          );

        const [a, b] = await Promise.all([send(), send()]);

        expect([a.status, b.status].sort()).toEqual([201, 409]);
        const winner = a.status === 201 ? a : b;
        created.patients.push(one(winner).id);
        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(one(winner).id);
      });

      it('rejects a pressure outside 4-20 cmH2O', async () => {
        const device = await seedDevice();

        await authed
          .post('/patients')
          .send(
            body({
              device: { deviceId: device.deviceId, prescribedPressure: 30 },
            }),
          )
          .expect(400);
      });
    });

    it('returns 409 email-exists for a duplicate email', async () => {
      const first = await seedPatient();

      const res = await authed
        .post('/patients')
        .send(body({ email: first.email }))
        .expect(409);

      expect(errorType(res)).toBe('email-exists');
    });

    it.each([
      ['a missing firstName', { firstName: undefined }],
      ['an empty lastName', { lastName: '' }],
      ['an invalid email', { email: 'not-an-email' }],
      ['a bad zip', { zip: '1234' }],
      ['a lowercase state', { state: 'co' }],
      ['a too-short height', { heightIn: 5 }],
      ['an unknown sex', { sex: 'ROBOT' }],
      ['a non-UUID providerId', { providerId: 'nope' }],
      ['no clinicalInfo', { clinicalInfo: undefined }],
      [
        'maskFitting without its date',
        { clinicalInfo: { maskFitting: true, sleepStudy: false } },
      ],
      [
        'sleepStudy without its date',
        { clinicalInfo: { maskFitting: false, sleepStudy: true } },
      ],
    ])('returns 400 for %s', async (_, over) => {
      const data = body(over);

      await authed.post('/patients').send(data).expect(400);

      expect(await db.patient.count({ where: { email: data.email } })).toBe(0);
    });
  });

  describe('PATCH /patients/:id', () => {
    it('updates only the fields that were sent', async () => {
      const p = await seedPatient({ firstName: 'Old', lastName: 'Name' });

      const res = await authed
        .patch(`/patients/${p.id}`)
        .send({ firstName: 'New', dob: '1980-05-17', city: 'Boulder' })
        .expect(200);

      expect(one(res)).toMatchObject({
        id: p.id,
        firstName: 'New',
        lastName: 'Name',
        email: p.email,
        dob: '1980-05-17T00:00:00.000Z',
        city: 'Boulder',
        providerId,
      });
    });

    it('treats an empty body as a no-op', async () => {
      const p = await seedPatient();

      const res = await authed.patch(`/patients/${p.id}`).send({}).expect(200);

      expect(one(res)).toMatchObject({ id: p.id, firstName: p.firstName });
    });

    it('ignores a facilityId in the body', async () => {
      const p = await seedPatient();

      await authed
        .patch(`/patients/${p.id}`)
        .send({ facilityId: otherFacilityId })
        .expect(200);

      expect(
        (await db.patient.findUniqueOrThrow({ where: { id: p.id } }))
          .facilityId,
      ).toBe(facilityId);
    });

    describe('clinicalInfo', () => {
      it('never clears a field the request did not send', async () => {
        const p = await seedPatient({
          clinicalInfo: {
            lastAppointment: new Date('2021-12-11'),
            maskFitting: true,
            maskFittingDate: new Date('2022-01-05'),
            sleepStudy: true,
            sleepStudyDate: new Date('2022-02-10'),
          },
        });

        await authed
          .patch(`/patients/${p.id}`)
          .send({ clinicalInfo: { atHomeStudy: true } })
          .expect(200);

        const info = await db.patientClinicalInfo.findUniqueOrThrow({
          where: { patientId: p.id },
        });
        expect(info).toMatchObject({
          atHomeStudy: true,
          lastAppointment: new Date('2021-12-11'),
          maskFitting: true,
          maskFittingDate: new Date('2022-01-05'),
          sleepStudy: true,
          sleepStudyDate: new Date('2022-02-10'),
        });
      });

      it('changes a date that was sent', async () => {
        const p = await seedPatient({
          clinicalInfo: { lastAppointment: new Date('2021-12-11') },
        });

        await authed
          .patch(`/patients/${p.id}`)
          .send({ clinicalInfo: { lastAppointment: '2023-03-09' } })
          .expect(200);

        expect(
          (
            await db.patientClinicalInfo.findUniqueOrThrow({
              where: { patientId: p.id },
            })
          ).lastAppointment,
        ).toEqual(new Date('2023-03-09'));
      });

      it('clears a date when its flag is turned off', async () => {
        const p = await seedPatient({
          clinicalInfo: {
            maskFitting: true,
            maskFittingDate: new Date('2022-01-05'),
            sleepStudy: true,
            sleepStudyDate: new Date('2022-02-10'),
          },
        });

        await authed
          .patch(`/patients/${p.id}`)
          .send({ clinicalInfo: { maskFitting: false } })
          .expect(200);

        const info = await db.patientClinicalInfo.findUniqueOrThrow({
          where: { patientId: p.id },
        });
        expect(info.maskFitting).toBe(false);
        expect(info.maskFittingDate).toBeNull();
        expect(info.sleepStudyDate).toEqual(new Date('2022-02-10'));
      });

      it('creates the clinical info for a patient that has none', async () => {
        const p = await seedPatient();

        await authed
          .patch(`/patients/${p.id}`)
          .send({ clinicalInfo: { atHomeStudy: true } })
          .expect(200);

        expect(
          (
            await db.patientClinicalInfo.findUniqueOrThrow({
              where: { patientId: p.id },
            })
          ).atHomeStudy,
        ).toBe(true);
      });
    });

    describe('provider', () => {
      it('reassigns to a provider of the same facility', async () => {
        const p = await seedPatient();

        const res = await authed
          .patch(`/patients/${p.id}`)
          .send({ providerId: colleagueId })
          .expect(200);

        expect(one(res)).toMatchObject({
          providerId: colleagueId,
          providerName: 'Colin Colleague',
        });
      });

      it('keeps the provider when providerId is omitted', async () => {
        const p = await seedPatient({ provider: colleagueId });

        const res = await authed
          .patch(`/patients/${p.id}`)
          .send({ firstName: 'Same' })
          .expect(200);

        expect(one(res).providerId).toBe(colleagueId);
      });

      it('returns 404 for a provider of another facility and changes nothing', async () => {
        const p = await seedPatient();

        const res = await authed
          .patch(`/patients/${p.id}`)
          .send({ firstName: 'Changed', providerId: outsiderId })
          .expect(404);

        expect(errorType(res)).toBe('provider-not-found');
        const saved = await db.patient.findUniqueOrThrow({
          where: { id: p.id },
        });
        expect(saved.providerId).toBe(providerId);
        expect(saved.firstName).toBe('Wayne');
      });
    });

    describe('device', () => {
      it('assigns a device and stores the pressure', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const device = await seedDevice();

        await authed
          .patch(`/patients/${p.id}`)
          .send({
            device: { deviceId: device.deviceId, prescribedPressure: 12 },
          })
          .expect(200);

        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(p.id);
        const info = await db.patientClinicalInfo.findUniqueOrThrow({
          where: { patientId: p.id },
        });
        expect([
          info.prescribedPressureMin,
          info.prescribedPressureMax,
        ]).toEqual([12, 12]);
      });

      it('swaps to another device and frees the old one', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const oldDevice = await seedDevice({ patientId: p.id });
        const newDevice = await seedDevice();

        await authed
          .patch(`/patients/${p.id}`)
          .send({
            device: { deviceId: newDevice.deviceId, prescribedPressure: 9 },
          })
          .expect(200);

        const owner = (id: string) =>
          db.device
            .findUniqueOrThrow({ where: { id } })
            .then((d) => d.patientId);
        expect(await owner(oldDevice.id)).toBeNull();
        expect(await owner(newDevice.id)).toBe(p.id);
      });

      it('only updates the pressure when the same device is sent again', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const device = await seedDevice({ patientId: p.id });

        await authed
          .patch(`/patients/${p.id}`)
          .send({
            device: { deviceId: device.deviceId, prescribedPressure: 15 },
          })
          .expect(200);

        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(p.id);
        expect(
          (
            await db.patientClinicalInfo.findUniqueOrThrow({
              where: { patientId: p.id },
            })
          ).prescribedPressureMax,
        ).toBe(15);
      });

      it('unassigns the device with null and keeps the rest', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const device = await seedDevice({ patientId: p.id });

        await authed
          .patch(`/patients/${p.id}`)
          .send({ device: null })
          .expect(200);

        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBeNull();
      });

      it('leaves the device alone when device is omitted', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const device = await seedDevice({ patientId: p.id });

        await authed
          .patch(`/patients/${p.id}`)
          .send({ firstName: 'Other' })
          .expect(200);

        expect(
          (await db.device.findUniqueOrThrow({ where: { id: device.id } }))
            .patientId,
        ).toBe(p.id);
      });

      it('returns 404 for an unknown device and keeps the current one', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const current = await seedDevice({ patientId: p.id });

        const res = await authed
          .patch(`/patients/${p.id}`)
          .send({
            device: { deviceId: uniq('(01)NOPE'), prescribedPressure: 9 },
          })
          .expect(404);

        expect(errorType(res)).toBe('device-not-found');
        expect(
          (await db.device.findUniqueOrThrow({ where: { id: current.id } }))
            .patientId,
        ).toBe(p.id);
      });

      it('returns 409 for a taken device, keeps the current one and changes nothing', async () => {
        const p = await seedPatient({ clinicalInfo: {} });
        const current = await seedDevice({ patientId: p.id });
        const holder = await seedPatient();
        const taken = await seedDevice({ patientId: holder.id });

        const res = await authed
          .patch(`/patients/${p.id}`)
          .send({
            firstName: 'Changed',
            device: { deviceId: taken.deviceId, prescribedPressure: 9 },
          })
          .expect(409);

        expect(errorType(res)).toBe('device-unavailable');
        const owner = (id: string) =>
          db.device
            .findUniqueOrThrow({ where: { id } })
            .then((d) => d.patientId);
        expect(await owner(current.id)).toBe(p.id);
        expect(await owner(taken.id)).toBe(holder.id);
        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } }))
            .firstName,
        ).toBe('Wayne');
      });
    });

    it('returns 409 email-exists when the email belongs to another patient', async () => {
      const a = await seedPatient();
      const b = await seedPatient();

      const res = await authed
        .patch(`/patients/${b.id}`)
        .send({ email: a.email })
        .expect(409);

      expect(errorType(res)).toBe('email-exists');
    });

    it("returns 404 for another facility's patient and changes nothing", async () => {
      const p = await seedPatient({
        provider: outsiderId,
        facility: otherFacilityId,
      });

      await authed
        .patch(`/patients/${p.id}`)
        .send({ firstName: 'Hacked' })
        .expect(404);

      expect(
        (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).firstName,
      ).toBe('Wayne');
    });

    it('returns 404 for an unknown patient', async () => {
      await authed
        .patch(`/patients/${randomUUID()}`)
        .send({ firstName: 'X' })
        .expect(404);
    });

    it.each([
      ['a null firstName', { firstName: null }],
      ['an invalid email', { email: 'nope' }],
      ['a bad zip', { zip: 'abc' }],
      ['a non-UUID providerId', { providerId: 'nope' }],
    ])('returns 400 for %s', async (_, over) => {
      const p = await seedPatient();

      await authed.patch(`/patients/${p.id}`).send(over).expect(400);
    });

    it('returns 400 for a non-UUID id', async () => {
      await authed.patch('/patients/not-a-uuid').send({}).expect(400);
    });
  });

  describe('DELETE /patients/:id', () => {
    it('removes the patient with its data and returns it', async () => {
      const p = await seedPatient({ clinicalInfo: {} });
      const note = await db.patientDocument.create({
        data: {
          name: 'report.pdf',
          storageKey: `patients/${p.id}/documents/${randomUUID()}`,
          mimeType: 'application/pdf',
          size: 4,
          patientId: p.id,
        },
      });

      const res = await authed.delete(`/patients/${p.id}`).expect(200);

      expect(one(res)).toMatchObject({ id: p.id, email: p.email });
      expect(await db.patient.findUnique({ where: { id: p.id } })).toBeNull();
      expect(
        await db.patientClinicalInfo.findUnique({ where: { patientId: p.id } }),
      ).toBeNull();
      expect(
        await db.patientDocument.findUnique({ where: { id: note.id } }),
      ).toBeNull();
      await authed.get(`/patients/${p.id}`).expect(404);
    });

    it('frees the device instead of deleting it', async () => {
      const p = await seedPatient();
      const device = await seedDevice({ patientId: p.id });

      await authed.delete(`/patients/${p.id}`).expect(200);

      const kept = await db.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(kept.patientId).toBeNull();
    });

    it('keeps the linked user account', async () => {
      const { user } = await registerUser();
      const p = await seedPatient();
      await db.patient.update({
        where: { id: p.id },
        data: { userId: user.id },
      });

      await authed.delete(`/patients/${p.id}`).expect(200);

      expect(
        await db.user.findUnique({ where: { id: user.id } }),
      ).not.toBeNull();
    });

    it('removes the photo and document files', async () => {
      const key = `patients/pending/avatar/${randomUUID()}.jpg`;
      const p = await seedPatient({ avatar: key });
      const docKey = `patients/${p.id}/documents/${randomUUID()}`;
      await db.patientDocument.create({
        data: {
          name: 'r.pdf',
          storageKey: docKey,
          mimeType: 'application/pdf',
          size: 4,
          patientId: p.id,
        },
      });
      await seedFile(key);
      await seedFile(docKey);

      await authed.delete(`/patients/${p.id}`).expect(200);

      expect(existsSync(filePath(key))).toBe(false);
      expect(existsSync(filePath(docKey))).toBe(false);
    });

    it('returns 404 when deleting twice', async () => {
      const p = await seedPatient();

      await authed.delete(`/patients/${p.id}`).expect(200);
      await authed.delete(`/patients/${p.id}`).expect(404);
    });

    it("returns 404 for another facility's patient and keeps it", async () => {
      const p = await seedPatient({
        provider: outsiderId,
        facility: otherFacilityId,
      });

      await authed.delete(`/patients/${p.id}`).expect(404);

      expect(
        await db.patient.findUnique({ where: { id: p.id } }),
      ).not.toBeNull();
    });

    it('returns 400 for a non-UUID id', async () => {
      await authed.delete('/patients/not-a-uuid').expect(400);
    });
  });

  describe('photo', () => {
    describe('PUT /patients/:id/photo', () => {
      it('stores a 512x512 JPEG and points the patient at it', async () => {
        const p = await seedPatient();

        const res = await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'me.png')
          .expect(200);

        expect(one(res).id).toBe(p.id);
        const { avatar } = await db.patient.findUniqueOrThrow({
          where: { id: p.id },
        });
        expect(avatar).toMatch(
          new RegExp(`^patients/${p.id}/avatar/[0-9a-f-]{36}\\.jpg$`),
        );
        const meta = await sharp(await readFile(filePath(avatar!))).metadata();
        expect([meta.format, meta.width, meta.height]).toEqual([
          'jpeg',
          512,
          512,
        ]);
      });

      it('accepts a JPEG and a TIFF', async () => {
        const source = await png(300, 300);
        const jpeg = await sharp(source).jpeg().toBuffer();
        const tiff = await sharp(source).tiff().toBuffer();

        for (const [data, name] of [
          [jpeg, 'a.jpg'],
          [tiff, 'a.tiff'],
        ] as const) {
          const p = await seedPatient();
          await authed
            .put(photoUrl(p.id))
            .attach('file', data, name)
            .expect(200);
        }
      });

      it('strips metadata from the stored file', async () => {
        const p = await seedPatient();
        const withExif = await sharp(await png(200, 200))
          .jpeg()
          .withMetadata({ exif: { IFD0: { Copyright: 'secret-owner' } } })
          .toBuffer();
        expect((await sharp(withExif).metadata()).exif).toBeDefined();

        await authed
          .put(photoUrl(p.id))
          .attach('file', withExif, 'exif.jpg')
          .expect(200);

        const { avatar } = await db.patient.findUniqueOrThrow({
          where: { id: p.id },
        });
        const stored = await readFile(filePath(avatar!));
        expect((await sharp(stored).metadata()).exif).toBeUndefined();
        expect(stored.includes(Buffer.from('secret-owner'))).toBe(false);
      });

      it('replaces the photo and removes the old file', async () => {
        const p = await seedPatient();
        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'first.png')
          .expect(200);
        const first = (
          await db.patient.findUniqueOrThrow({ where: { id: p.id } })
        ).avatar!;

        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(400, 400), 'second.png')
          .expect(200);

        const second = (
          await db.patient.findUniqueOrThrow({ where: { id: p.id } })
        ).avatar!;
        expect(second).not.toBe(first);
        expect(existsSync(filePath(second))).toBe(true);
        expect(existsSync(filePath(first))).toBe(false);
      });

      it.each([
        ['a text file', Buffer.from('not an image'), 'notes.txt'],
        ['a text file named .png', Buffer.from('not an image'), 'fake.png'],
        ['a GIF', Buffer.from('R0lGODlhAQABAAAAACw=', 'base64'), 'a.gif'],
      ])(
        'returns 400 invalid-photo for %s and stores nothing',
        async (_, data, name) => {
          const p = await seedPatient();

          const res = await authed
            .put(photoUrl(p.id))
            .attach('file', data, name)
            .expect(400);

          expect(errorType(res)).toBe('invalid-photo');
          expect(
            (await db.patient.findUniqueOrThrow({ where: { id: p.id } }))
              .avatar,
          ).toBeNull();
        },
      );

      it('keeps the current photo when the new one is invalid', async () => {
        const p = await seedPatient();
        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'ok.png')
          .expect(200);
        const before = (
          await db.patient.findUniqueOrThrow({ where: { id: p.id } })
        ).avatar!;

        await authed
          .put(photoUrl(p.id))
          .attach('file', Buffer.from('nope'), 'bad.png')
          .expect(400);

        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).avatar,
        ).toBe(before);
        expect(existsSync(filePath(before))).toBe(true);
      });

      it('returns 400 without a file', async () => {
        const p = await seedPatient();

        const res = await authed.put(photoUrl(p.id)).expect(400);

        expect(errorType(res)).toBe('invalid-photo');
      });

      it('rejects a file over 5 MB and stores nothing', async () => {
        const p = await seedPatient();

        const res = await authed
          .put(photoUrl(p.id))
          .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), 'big.png');

        expect(res.status).toBe(413);
        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).avatar,
        ).toBeNull();
      });

      it("returns 404 for another facility's patient and stores nothing", async () => {
        const p = await seedPatient({
          provider: outsiderId,
          facility: otherFacilityId,
        });

        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'me.png')
          .expect(404);

        expect(existsSync(join(uploadsDir, 'patients', p.id))).toBe(false);
        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).avatar,
        ).toBeNull();
      });

      it('returns 404 for an unknown patient', async () => {
        await authed
          .put(photoUrl(randomUUID()))
          .attach('file', await png(), 'me.png')
          .expect(404);
      });

      it('returns 400 for a non-UUID id', async () => {
        await authed
          .put(photoUrl('not-a-uuid'))
          .attach('file', await png(), 'me.png')
          .expect(400);
      });
    });

    describe('GET /patients/:id/photo', () => {
      it('streams the stored JPEG inline', async () => {
        const p = await seedPatient();
        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'me.png')
          .expect(200);
        const { avatar } = await db.patient.findUniqueOrThrow({
          where: { id: p.id },
        });

        const res = await authed
          .get(photoUrl(p.id))
          .buffer(true)
          .parse((r, done) => {
            const chunks: Buffer[] = [];
            r.on('data', (c: Buffer) => chunks.push(c));
            r.on('end', () => done(null, Buffer.concat(chunks)));
          })
          .expect(200);

        expect(res.headers['content-type']).toBe('image/jpeg');
        expect(res.headers['content-disposition']).toMatch(/^inline/);
        expect(res.body).toEqual(await readFile(filePath(avatar!)));
      });

      it('returns 404 for a patient without a photo', async () => {
        const p = await seedPatient();

        await authed.get(photoUrl(p.id)).expect(404);
      });

      it('returns 404 when the file is missing from storage', async () => {
        const p = await seedPatient({
          avatar: `patients/${randomUUID()}/avatar/${randomUUID()}.jpg`,
        });

        await authed.get(photoUrl(p.id)).expect(404);
      });

      it("returns 404 for another facility's patient", async () => {
        const key = `patients/shared/avatar/${randomUUID()}.jpg`;
        await seedFile(key);
        const p = await seedPatient({
          provider: outsiderId,
          facility: otherFacilityId,
          avatar: key,
        });

        await authed.get(photoUrl(p.id)).expect(404);
      });

      it('returns 404 for an unknown patient and 400 for a non-UUID id', async () => {
        await authed.get(photoUrl(randomUUID())).expect(404);
        await authed.get(photoUrl('not-a-uuid')).expect(400);
      });
    });

    describe('DELETE /patients/:id/photo', () => {
      it('clears the photo, removes the file and returns the patient', async () => {
        const p = await seedPatient();
        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'me.png')
          .expect(200);
        const { avatar } = await db.patient.findUniqueOrThrow({
          where: { id: p.id },
        });

        const res = await authed.delete(photoUrl(p.id)).expect(200);

        expect(one(res).id).toBe(p.id);
        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).avatar,
        ).toBeNull();
        expect(existsSync(filePath(avatar!))).toBe(false);
        await authed.get(photoUrl(p.id)).expect(404);
      });

      it('returns 404 for a patient without a photo, and when deleting twice', async () => {
        const none = await seedPatient();
        await authed.delete(photoUrl(none.id)).expect(404);

        const p = await seedPatient();
        await authed
          .put(photoUrl(p.id))
          .attach('file', await png(), 'me.png')
          .expect(200);
        await authed.delete(photoUrl(p.id)).expect(200);
        await authed.delete(photoUrl(p.id)).expect(404);
      });

      it("returns 404 for another facility's patient and keeps the photo", async () => {
        const key = `patients/shared/avatar/${randomUUID()}.jpg`;
        await seedFile(key);
        const p = await seedPatient({
          provider: outsiderId,
          facility: otherFacilityId,
          avatar: key,
        });

        await authed.delete(photoUrl(p.id)).expect(404);

        expect(
          (await db.patient.findUniqueOrThrow({ where: { id: p.id } })).avatar,
        ).toBe(key);
        expect(existsSync(filePath(key))).toBe(true);
      });

      it('returns 404 for an unknown patient and 400 for a non-UUID id', async () => {
        await authed.delete(photoUrl(randomUUID())).expect(404);
        await authed.delete(photoUrl('not-a-uuid')).expect(400);
      });
    });
  });
});
