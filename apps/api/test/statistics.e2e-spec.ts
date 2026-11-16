import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';

/**
 * E2E contract for GET /statistics (requires the `access-token` cookie).
 *
 * -> 200 { patients, facilities, providers, devices }, each a non-negative
 *    integer equal to the total row count of the matching table.
 * -> 401 without a valid token.
 *
 * Counts are global and the DB is shared, so tests assert on deltas against
 * a baseline instead of absolute numbers. Rows created here are removed in
 * afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';
const KEYS = ['patients', 'facilities', 'providers', 'devices'] as const;

const run = `stats-${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;

describe('Statistics (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;

  const http = () => request(app.getHttpServer());
  const getStats = async () =>
    (await http().get('/statistics').set('Cookie', cookie).expect(200)).body;

  // ids of rows created by the tests, for cleanup
  const created = {
    devices: [] as string[],
    patients: [] as string[],
    providers: [] as string[],
    users: [] as string[],
    facilities: [] as string[],
    deviceModels: [] as string[],
  };

  const createFacility = async () => {
    const f = await db.facility.create({
      data: {
        ein: uniq('ein'),
        permit: 'permit',
        npi: 'npi',
        name: uniq('facility'),
        city: 'City',
        state: 'ST',
        phone: '555-0100',
        address: '1 Main St',
        zip: '12345',
        contactName: 'Contact Person',
        contactEmail: `${uniq('contact')}@example.com`,
      },
    });
    created.facilities.push(f.id);
    return f;
  };

  const createProvider = async (facilityId: string) => {
    const user = await db.user.create({
      data: {
        email: `${uniq('provider')}@example.com`,
        passwordHash: 'x',
        salt: 'x',
        role: 'PROVIDER',
      },
    });
    created.users.push(user.id);
    const p = await db.provider.create({
      data: {
        npi: uniq('npi'),
        phone: '555-0101',
        address: '2 Main St',
        dateHired: new Date(),
        userId: user.id,
        facilityId,
      },
    });
    created.providers.push(p.id);
    return p;
  };

  const createPatient = async (providerId: string, facilityId: string) => {
    const p = await db.patient.create({
      data: {
        firstName: 'Pat',
        lastName: 'Ient',
        email: `${uniq('patient')}@example.com`,
        phone: '555-0102',
        providerId,
        facilityId,
      },
    });
    created.patients.push(p.id);
    return p;
  };

  const createDevice = async (facilityId: string) => {
    const model = await db.deviceModel.create({
      data: { name: uniq('model') },
    });
    created.deviceModels.push(model.id);
    const d = await db.device.create({
      data: {
        deviceId: uniq('device'),
        shortId: uniq('d').slice(-8) + counter,
        manufactureDate: new Date(),
        deviceModelId: model.id,
        facilityId,
      },
    });
    created.devices.push(d.id);
    return d;
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

    const email = `${uniq('user')}@example.com`;
    await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const login = await http()
      .post('/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);
    cookie = ([] as string[])
      .concat(login.headers['set-cookie'] as unknown as string[])
      .find((c) => c.startsWith('access-token='))!
      .split(';')[0];
  });

  afterAll(async () => {
    await db.device.deleteMany({ where: { id: { in: created.devices } } });
    await db.patient.deleteMany({ where: { id: { in: created.patients } } });
    await db.provider.deleteMany({ where: { id: { in: created.providers } } });
    await db.user.deleteMany({ where: { id: { in: created.users } } });
    await db.deviceModel.deleteMany({
      where: { id: { in: created.deviceModels } },
    });
    await db.facility.deleteMany({ where: { id: { in: created.facilities } } });
    await app.close();
  });

  describe('authorization', () => {
    it('returns 401 without a token', async () => {
      await http().get('/statistics').expect(401);
    });

    it('returns 401 with an empty token cookie', async () => {
      await http()
        .get('/statistics')
        .set('Cookie', 'access-token=')
        .expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await http()
        .get('/statistics')
        .set('Cookie', 'access-token=not.a.jwt')
        .expect(401);
    });

    it('returns 401 with a token signed by a different secret', async () => {
      const [header, payload] = cookie.slice('access-token='.length).split('.');
      await http()
        .get('/statistics')
        .set('Cookie', `access-token=${header}.${payload}.forgedsignature`)
        .expect(401);
    });
  });

  describe('GET /statistics', () => {
    it('returns 200 with the four counters as non-negative integers', async () => {
      const res = await http()
        .get('/statistics')
        .set('Cookie', cookie)
        .expect(200);

      expect(Object.keys(res.body).sort()).toEqual([...KEYS].sort());
      for (const key of KEYS) {
        expect(Number.isInteger(res.body[key])).toBe(true);
        expect(res.body[key]).toBeGreaterThanOrEqual(0);
      }
    });

    it('matches the actual row counts in the database', async () => {
      const [patients, facilities, providers, devices] = await Promise.all([
        db.patient.count(),
        db.facility.count(),
        db.provider.count(),
        db.device.count(),
      ]);

      expect(await getStats()).toEqual({
        patients,
        facilities,
        providers,
        devices,
      });
    });

    it('is stable across repeated calls when nothing changes', async () => {
      expect(await getStats()).toEqual(await getStats());
    });

    it('counts a new facility and nothing else', async () => {
      const before = await getStats();
      await createFacility();
      const after = await getStats();

      expect(after).toEqual({ ...before, facilities: before.facilities + 1 });
    });

    it('counts a new provider (and its facility) only', async () => {
      const facility = await createFacility();
      const before = await getStats();
      await createProvider(facility.id);
      const after = await getStats();

      expect(after).toEqual({ ...before, providers: before.providers + 1 });
    });

    it('counts a new patient only', async () => {
      const facility = await createFacility();
      const provider = await createProvider(facility.id);
      const before = await getStats();
      await createPatient(provider.id, facility.id);
      const after = await getStats();

      expect(after).toEqual({ ...before, patients: before.patients + 1 });
    });

    it('counts a new device only', async () => {
      const facility = await createFacility();
      const before = await getStats();
      await createDevice(facility.id);
      const after = await getStats();

      expect(after).toEqual({ ...before, devices: before.devices + 1 });
    });

    it('decreases the counter when a record is deleted', async () => {
      const facility = await createFacility();
      const device = await createDevice(facility.id);
      const before = await getStats();

      await db.device.delete({ where: { id: device.id } });
      created.devices = created.devices.filter((id) => id !== device.id);
      const after = await getStats();

      expect(after).toEqual({ ...before, devices: before.devices - 1 });
    });

    it('does not count users that are not providers or patients', async () => {
      const before = await getStats();
      const user = await db.user.create({
        data: {
          email: `${uniq('plain')}@example.com`,
          passwordHash: 'x',
          salt: 'x',
        },
      });
      created.users.push(user.id);

      expect(await getStats()).toEqual(before);
    });
  });
});
