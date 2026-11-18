import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import type { DeviceDto } from './../src/device/dto.js';

/**
 * E2E contract for /device (every route requires the `access-token` cookie,
 * see DeviceController and device/dto.ts). The controller is still a stub,
 * so these are the rules the implementation has to meet.
 *
 * GET   /device?q=&sortBy=model|dateAdded -> 200 DeviceDto[]
 * POST  /device                           -> 201 DeviceDto
 * PATCH /device/:id                       -> 200 DeviceDto
 * All routes -> 401 without a valid token.
 *
 * Device ID format: (01)GTIN(11)YYMMDD(10)lot(21)serial, see
 * docs/device-id.md and device/device-id.parser.ts.
 *
 * Decisions this spec pins down:
 * - The body carries only `deviceId` and an optional `facilityId`; the model
 *   (by the GTIN, matched to DeviceModel.gtin) and the manufacture date come
 *   from the ID on the server. Client-sent copies are ignored.
 * - The stored `deviceId` is the canonical form (fixed AI order, trimmed).
 * - `lastConnectedAt` is never set by these routes: null for a new device.
 * - `facilityName` is null for a device without a facility.
 * - Invalid ID -> 400 `{ type: 'invalid-device-id', reason }`; GTIN without a
 *   model -> 400 `{ type: 'unknown-device-model' }`; duplicate ID -> 409
 *   `{ type: 'device-exists' }`; unknown facility -> 404; inactive
 *   facility -> 400.
 * - `q` matches the device ID only (partial, case-insensitive).
 *   `sortBy=model` is A-Z by model name, `sortBy=dateAdded` (default) is
 *   newest first.
 *
 * The DB is shared, so tests only look at devices they create (serials carry
 * a per-run marker) and everything is removed in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `dv-${Date.now()}`;
const marker = `M${Date.now().toString(36).toUpperCase()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;

// supertest types `res.body` as `any`; read it as the DTO the API returns.
const dto = (res: { body: unknown }) => res.body as DeviceDto;
const list = (res: { body: unknown }) => res.body as DeviceDto[];

const gtinWithCheck = (digits: number[]): string => {
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return digits.join('') + String((10 - (sum % 10)) % 10);
};
// Random GTIN-14 with a valid check digit, so it will not collide with real data.
const gtin14 = (): string =>
  gtinWithCheck(
    Array.from({ length: 13 }, () => Math.floor(Math.random() * 10)),
  );
// Same GTIN with a wrong check digit.
const withBadCheckDigit = (gtin: string): string =>
  gtin.slice(0, 13) + String((Number(gtin[13]) + 1) % 10);

// Serials carry the run marker (letters + digits, <= 20 chars), so `q=<marker>`
// finds only this run's devices.
const serial = (tag = '') => `${marker}${tag}${counter++}`;
const deviceIdFor = (
  gtin: string,
  { date = '210821', lot = '1234', ser = serial() } = {},
) => `(01)${gtin}(11)${date}(10)${lot}(21)${ser}`;

describe('Device (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (url: string) => http().get(url).set('Cookie', cookie),
    post: (url: string) => http().post(url).set('Cookie', cookie),
    patch: (url: string) => http().patch(url).set('Cookie', cookie),
  };

  const created = {
    models: [] as string[],
    facilities: [] as string[],
    users: [] as string[],
  };

  const seedModel = async (name = uniq('Model')) => {
    const model = await db.deviceModel.create({
      data: { name, gtin: gtin14() },
    });
    created.models.push(model.id);
    return model as typeof model & { gtin: string };
  };

  const seedFacility = async (
    overrides: { name?: string; active?: boolean } = {},
  ) => {
    const facility = await db.facility.create({
      data: {
        ein: `${Math.floor(10 + Math.random() * 90)}-${Math.floor(
          1_000_000 + Math.random() * 9_000_000,
        )}`,
        permit: '555333',
        npi: '1567890342',
        name: uniq('Clinic'),
        city: 'Tallahassee',
        state: 'FL',
        phone: '(303) 941-3333',
        address: '13654 Kenzo Lane',
        zip: '80023',
        contactName: 'Conejo Jones',
        contactEmail: `${uniq('contact')}@example.com`,
        ...overrides,
      },
    });
    created.facilities.push(facility.id);
    return facility;
  };

  // Inserts a device straight into the DB, so GET/PATCH tests do not depend
  // on POST working.
  const seedDevice = async (
    model: { id: string; gtin: string },
    options: { facilityId?: string; date?: string; ser?: string } = {},
  ) => {
    const date = options.date ?? '210821';
    return db.device.create({
      data: {
        deviceId: deviceIdFor(model.gtin, { date, ser: options.ser }),
        manufactureDate: new Date(
          Date.UTC(
            2000 + Number(date.slice(0, 2)),
            Number(date.slice(2, 4)) - 1,
            Number(date.slice(4, 6)),
          ),
        ),
        deviceModelId: model.id,
        facilityId: options.facilityId ?? null,
      },
    });
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
    created.users.push(
      (await db.user.findUniqueOrThrow({ where: { email } })).id,
    );
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
    await db.device.deleteMany({
      where: {
        OR: [
          { deviceModelId: { in: created.models } },
          { facilityId: { in: created.facilities } },
        ],
      },
    });
    await db.deviceModel.deleteMany({ where: { id: { in: created.models } } });
    await db.facility.deleteMany({ where: { id: { in: created.facilities } } });
    await db.user.deleteMany({ where: { id: { in: created.users } } });
    await app.close();
  });

  describe('authorization', () => {
    const id = randomUUID();
    const routes: ['get' | 'post' | 'patch', string][] = [
      ['get', '/device'],
      ['post', '/device'],
      ['patch', `/device/${id}`],
    ];

    it.each(routes)(
      '%s %s returns 401 without a token',
      async (method, url) => {
        await http()[method](url).send({}).expect(401);
      },
    );

    it('returns 401 with an empty token cookie', async () => {
      await http().get('/device').set('Cookie', 'access-token=').expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await http()
        .get('/device')
        .set('Cookie', 'access-token=not.a.jwt')
        .expect(401);
    });

    it('returns 401 with a forged signature', async () => {
      const [header, payload] = cookie.slice('access-token='.length).split('.');
      await http()
        .post('/device')
        .set('Cookie', `access-token=${header}.${payload}.forgedsignature`)
        .send({ deviceId: deviceIdFor(gtin14()) })
        .expect(401);
    });
  });

  describe('POST /device', () => {
    it('creates a device and returns the DeviceDto derived from the ID', async () => {
      const model = await seedModel();
      const facility = await seedFacility();
      const deviceId = deviceIdFor(model.gtin);

      const res = await authed
        .post('/device')
        .send({ deviceId, facilityId: facility.id })
        .expect(201);

      expect(res.body).toMatchObject({
        deviceId,
        modelName: model.name,
        facilityName: facility.name,
      });
      expect(typeof dto(res).id).toBe('string');
      expect(dto(res).manufactureDate).toMatch(/^2021-08-21/);
      expect(dto(res).lastConnectedAt ?? null).toBeNull();
    });

    it('persists the device with the parsed model and date', async () => {
      const model = await seedModel();
      const facility = await seedFacility();

      const res = await authed
        .post('/device')
        .send({ deviceId: deviceIdFor(model.gtin), facilityId: facility.id })
        .expect(201);

      const row = await db.device.findUniqueOrThrow({
        where: { id: dto(res).id },
      });
      expect(row).toMatchObject({
        deviceModelId: model.id,
        facilityId: facility.id,
        patientId: null,
        lastConnectedAt: null,
      });
      expect(row.manufactureDate).toEqual(new Date(Date.UTC(2021, 7, 21)));
    });

    it('accepts a body without facilityId', async () => {
      const model = await seedModel();

      const res = await authed
        .post('/device')
        .send({ deviceId: deviceIdFor(model.gtin) })
        .expect(201);

      expect(dto(res).facilityName ?? null).toBeNull();
      const row = await db.device.findUniqueOrThrow({
        where: { id: dto(res).id },
      });
      expect(row.facilityId).toBeNull();
    });

    it('stores the canonical form of the ID', async () => {
      const model = await seedModel();
      const ser = serial();
      const canonical = `(01)${model.gtin}(11)210821(10)1234(21)${ser}`;
      const shuffled = `  (21)${ser}(10)1234(11)210821(01)${model.gtin}\n`;

      const res = await authed
        .post('/device')
        .send({ deviceId: shuffled })
        .expect(201);

      expect(dto(res).deviceId).toBe(canonical);
      expect(await db.device.count({ where: { deviceId: canonical } })).toBe(1);
    });

    it('ignores fields the server derives', async () => {
      const model = await seedModel();
      const other = await seedModel();

      const res = await authed
        .post('/device')
        .send({
          deviceId: deviceIdFor(model.gtin),
          deviceModelId: other.id,
          modelName: 'Spoofed',
          manufactureDate: '1999-01-01T00:00:00Z',
          lastConnectedAt: '2020-01-01T00:00:00Z',
        })
        .expect(201);

      expect(dto(res).modelName).toBe(model.name);
      expect(dto(res).manufactureDate).toMatch(/^2021-08-21/);
      expect(dto(res).lastConnectedAt ?? null).toBeNull();
    });

    it.each([
      ['not an ID', () => 'not-an-id', 'bad-format'],
      [
        'an unsupported AI',
        (g: string) => `(01)${g}(17)000004(10)1234(21)${serial()}`,
        'unknown-ai',
      ],
      [
        'a missing serial',
        (g: string) => `(01)${g}(11)210821(10)1234`,
        'missing-ai',
      ],
      [
        'a wrong GTIN check digit',
        (g: string) => deviceIdFor(withBadCheckDigit(g)),
        'bad-gtin-checksum',
      ],
      [
        'an impossible date',
        (g: string) => deviceIdFor(g, { date: '210231' }),
        'bad-date',
      ],
    ])(
      'returns 400 invalid-device-id for %s',
      async (_label, build, reason) => {
        const model = await seedModel();

        const res = await authed
          .post('/device')
          .send({ deviceId: build(model.gtin) })
          .expect(400);

        expect(res.body).toMatchObject({ type: 'invalid-device-id', reason });
      },
    );

    it('returns 400 unknown-device-model when no model has the GTIN', async () => {
      const deviceId = deviceIdFor(gtin14());

      const res = await authed.post('/device').send({ deviceId }).expect(400);

      expect(res.body).toMatchObject({ type: 'unknown-device-model' });
      expect(await db.device.count({ where: { deviceId } })).toBe(0);
    });

    it('does not match a model that has no GTIN', async () => {
      const model = await db.deviceModel.create({
        data: { name: uniq('NoGtin') },
      });
      created.models.push(model.id);

      const res = await authed
        .post('/device')
        .send({ deviceId: deviceIdFor(gtin14()) })
        .expect(400);

      expect(res.body).toMatchObject({ type: 'unknown-device-model' });
    });

    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['not a string', 42],
    ])('returns 400 when deviceId is %s', async (_label, deviceId) => {
      await authed.post('/device').send({ deviceId }).expect(400);
    });

    it('returns 400 for a facilityId that is not a UUID', async () => {
      const model = await seedModel();

      await authed
        .post('/device')
        .send({ deviceId: deviceIdFor(model.gtin), facilityId: 'nope' })
        .expect(400);
    });

    it('returns 404 for an unknown facility and creates nothing', async () => {
      const model = await seedModel();
      const deviceId = deviceIdFor(model.gtin);

      await authed
        .post('/device')
        .send({ deviceId, facilityId: randomUUID() })
        .expect(404);

      expect(await db.device.count({ where: { deviceId } })).toBe(0);
    });

    it('returns 400 for an inactive facility and creates nothing', async () => {
      const model = await seedModel();
      const facility = await seedFacility({ active: false });
      const deviceId = deviceIdFor(model.gtin);

      await authed
        .post('/device')
        .send({ deviceId, facilityId: facility.id })
        .expect(400);

      expect(await db.device.count({ where: { deviceId } })).toBe(0);
    });

    it('returns 409 device-exists when the ID is already registered', async () => {
      const model = await seedModel();
      const deviceId = deviceIdFor(model.gtin);
      await authed.post('/device').send({ deviceId }).expect(201);

      const res = await authed.post('/device').send({ deviceId }).expect(409);

      expect(res.body).toMatchObject({ type: 'device-exists' });
      expect(await db.device.count({ where: { deviceId } })).toBe(1);
    });

    it('returns 409 when the same ID arrives in another AI order', async () => {
      const model = await seedModel();
      const ser = serial();
      await authed
        .post('/device')
        .send({ deviceId: `(01)${model.gtin}(11)210821(10)1234(21)${ser}` })
        .expect(201);

      await authed
        .post('/device')
        .send({ deviceId: `(21)${ser}(10)1234(11)210821(01)${model.gtin}` })
        .expect(409);
    });
  });

  describe('GET /device', () => {
    it('returns the DeviceDto for a seeded device', async () => {
      const model = await seedModel();
      const facility = await seedFacility();
      const device = await seedDevice(model, { facilityId: facility.id });

      const res = await authed.get(`/device?q=${device.deviceId}`).expect(200);

      expect(res.body).toHaveLength(1);
      expect(list(res)[0]).toMatchObject({
        id: device.id,
        deviceId: device.deviceId,
        modelName: model.name,
        facilityName: facility.name,
      });
      expect(list(res)[0].manufactureDate).toMatch(/^2021-08-21/);
      expect(list(res)[0].lastConnectedAt ?? null).toBeNull();
    });

    it('returns lastConnectedAt when the device has connected', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);
      await db.device.update({
        where: { id: device.id },
        data: { lastConnectedAt: new Date('2023-01-24T03:44:00Z') },
      });

      const res = await authed.get(`/device?q=${device.deviceId}`).expect(200);

      expect(list(res)[0].lastConnectedAt).toBe('2023-01-24T03:44:00.000Z');
    });

    it('returns a null facilityName for a device without a facility', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      const res = await authed.get(`/device?q=${device.deviceId}`).expect(200);

      expect(list(res)[0].facilityName ?? null).toBeNull();
    });

    it('returns an array', async () => {
      const res = await authed.get('/device').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('filters by q on the device ID, case-insensitive', async () => {
      const model = await seedModel();
      const match = await seedDevice(model, { ser: serial('Qx') });
      await seedDevice(model);

      const res = await authed
        .get(`/device?q=${match.deviceId.toLowerCase()}`)
        .expect(200);

      expect(list(res).map((d) => d.id)).toEqual([match.id]);
    });

    it('filters by q on a partial device ID', async () => {
      const model = await seedModel();
      const ser = serial('Part');
      const match = await seedDevice(model, { ser });
      await seedDevice(model);

      const res = await authed.get(`/device?q=${ser}`).expect(200);

      expect(list(res).map((d) => d.id)).toEqual([match.id]);
    });

    it('does not match q against the model name', async () => {
      const model = await seedModel(uniq('Searchable'));
      await seedDevice(model);

      const res = await authed.get(`/device?q=${model.name}`).expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns an empty array when q matches nothing', async () => {
      const res = await authed.get(`/device?q=${uniq('nomatch')}`).expect(200);

      expect(res.body).toEqual([]);
    });

    it('sorts by model name A-Z with sortBy=model', async () => {
      const tag = serial('Srt');
      const prefix = uniq('Sort');
      const b = await seedModel(`${prefix}-b`);
      const c = await seedModel(`${prefix}-c`);
      const a = await seedModel(`${prefix}-a`);
      await seedDevice(b, { ser: `${tag}1` });
      await seedDevice(c, { ser: `${tag}2` });
      await seedDevice(a, { ser: `${tag}3` });

      const res = await authed.get(`/device?q=${tag}&sortBy=model`).expect(200);

      expect(list(res).map((d) => d.modelName)).toEqual([
        a.name,
        b.name,
        c.name,
      ]);
    });

    it.each([['?sortBy=dateAdded'], ['']])(
      'sorts newest first (query "%s")',
      async (sortQuery) => {
        const tag = serial('Dat');
        const model = await seedModel();
        const first = await seedDevice(model, { ser: `${tag}1` });
        const second = await seedDevice(model, { ser: `${tag}2` });

        const res = await authed
          .get(`/device?q=${tag}${sortQuery.replace('?', '&')}`)
          .expect(200);

        expect(list(res).map((d) => d.id)).toEqual([second.id, first.id]);
      },
    );

    it('returns 400 for an unknown sortBy', async () => {
      await authed.get('/device?sortBy=bogus').expect(400);
    });
  });

  describe('PATCH /device/:id', () => {
    it('changes the facility', async () => {
      const model = await seedModel();
      const oldFacility = await seedFacility();
      const newFacility = await seedFacility();
      const device = await seedDevice(model, { facilityId: oldFacility.id });

      const res = await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: device.deviceId, facilityId: newFacility.id })
        .expect(200);

      expect(res.body).toMatchObject({
        id: device.id,
        facilityName: newFacility.name,
      });
      const row = await db.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(row.facilityId).toBe(newFacility.id);
    });

    it('re-reads the model and date when the ID changes', async () => {
      const oldModel = await seedModel();
      const newModel = await seedModel();
      const device = await seedDevice(oldModel);
      const newId = deviceIdFor(newModel.gtin, { date: '230315' });

      const res = await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: newId })
        .expect(200);

      expect(res.body).toMatchObject({
        id: device.id,
        deviceId: newId,
        modelName: newModel.name,
      });
      expect(dto(res).manufactureDate).toMatch(/^2023-03-15/);
      const row = await db.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(row).toMatchObject({
        deviceId: newId,
        deviceModelId: newModel.id,
      });
    });

    it('accepts the unchanged ID of the same device', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: device.deviceId })
        .expect(200);
    });

    it('does not change lastConnectedAt or the patient', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);
      const connected = new Date('2023-01-24T03:44:00Z');
      await db.device.update({
        where: { id: device.id },
        data: { lastConnectedAt: connected },
      });

      await authed
        .patch(`/device/${device.id}`)
        .send({
          deviceId: device.deviceId,
          lastConnectedAt: '2001-01-01T00:00:00Z',
          patientId: randomUUID(),
        })
        .expect(200);

      const row = await db.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(row.lastConnectedAt).toEqual(connected);
      expect(row.patientId).toBeNull();
    });

    it('returns 409 when the new ID belongs to another device', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);
      const other = await seedDevice(model);

      const res = await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: other.deviceId })
        .expect(409);

      expect(res.body).toMatchObject({ type: 'device-exists' });
      const row = await db.device.findUniqueOrThrow({
        where: { id: device.id },
      });
      expect(row.deviceId).toBe(device.deviceId);
    });

    it('returns 400 invalid-device-id for a malformed new ID', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      const res = await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: 'not-an-id' })
        .expect(400);

      expect(res.body).toMatchObject({ type: 'invalid-device-id' });
    });

    it('returns 400 unknown-device-model when the new GTIN has no model', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      const res = await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: deviceIdFor(gtin14()) })
        .expect(400);

      expect(res.body).toMatchObject({ type: 'unknown-device-model' });
    });

    it('returns 400 when deviceId is missing or empty', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      await authed.patch(`/device/${device.id}`).send({}).expect(400);
      await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: '' })
        .expect(400);
    });

    it('returns 400 for a facilityId that is not a UUID', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: device.deviceId, facilityId: 'nope' })
        .expect(400);
    });

    it('returns 404 for an unknown facility', async () => {
      const model = await seedModel();
      const device = await seedDevice(model);

      await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: device.deviceId, facilityId: randomUUID() })
        .expect(404);
    });

    it('returns 400 for an inactive facility', async () => {
      const model = await seedModel();
      const facility = await seedFacility({ active: false });
      const device = await seedDevice(model);

      await authed
        .patch(`/device/${device.id}`)
        .send({ deviceId: device.deviceId, facilityId: facility.id })
        .expect(400);
    });

    it('returns 404 for an unknown device', async () => {
      await authed
        .patch(`/device/${randomUUID()}`)
        .send({ deviceId: deviceIdFor(gtin14()) })
        .expect(404);
    });
  });
});
