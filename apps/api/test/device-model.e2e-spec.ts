import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';
import type { DeviceModelDto } from './../src/device/dto.js';

/**
 * E2E contract for /device-model (see DeviceModelController and
 * device/dto.ts). The controller is still a stub, so these are the rules the
 * implementation has to meet.
 *
 * GET   /device-model/:gtin -> 200 DeviceModelDto, 404 for an unknown GTIN
 * POST  /device-model     -> 201 DeviceModelDto { id, name, gtin | null, createdAt }
 * PATCH /device-model/:id -> 200 DeviceModelDto
 * Any route -> 401 without a valid token.
 *
 * Decisions this spec pins down:
 * - Only `name` is required (the "Add New Model" modal has one input);
 *   `gtin` is optional and must be 14 digits when sent.
 * - `name` is trimmed before it is validated and stored, so "   " is empty.
 * - `name` and `gtin` are unique: a duplicate -> 409
 *   `{ type: 'device-model-exists' }`. Models without a GTIN do not clash.
 * - GET looks a model up by its 14-digit GTIN; a malformed GTIN -> 400.
 * - PATCH takes an optional `name` and `gtin` (same rules as POST). Setting a
 *   GTIN on a model without one is the main use. A GTIN that is already set
 *   cannot change once devices use the model: 409
 *   `{ type: 'device-model-in-use' }`. Unknown id -> 404.
 * - A model created here is matched by the GTIN part of a Device ID
 *   (see docs/device-id.md).
 *
 * The DB is shared, so every model name carries a per-run marker, GTINs are
 * random, and everything the spec creates is removed in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `dm-${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;
// Device ID serials are limited to 20 characters, so `uniq()` is too long once
// the counter reaches two digits.
const serial = () => `S${Date.now().toString(36).toUpperCase()}${counter++}`;

// supertest types `res.body` as `any`; read it as the DTO the API returns.
const dto = (res: { body: unknown }) => res.body as DeviceModelDto;

// Random GTIN-14 with a valid check digit, so it will not collide with real data.
const gtin14 = (): string => {
  const digits = Array.from({ length: 13 }, () =>
    Math.floor(Math.random() * 10),
  );
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 3 : 1), 0);
  return digits.join('') + String((10 - (sum % 10)) % 10);
};

describe('DeviceModel (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    post: (url: string) => http().post(url).set('Cookie', cookie),
  };

  const created = {
    models: [] as string[],
    users: [] as string[],
  };

  const createModel = async (body: Record<string, unknown> = {}) => {
    const res = await authed
      .post('/device-model')
      .send({ name: uniq('Model'), ...body })
      .expect(201);
    created.models.push(dto(res).id);
    return dto(res);
  };

  // Inserts a model straight into the DB, so PATCH tests do not depend on POST.
  const seedModel = async (gtin?: string) => {
    const model = await db.deviceModel.create({
      data: { name: uniq('Model'), gtin: gtin ?? null },
    });
    created.models.push(model.id);
    return model;
  };

  const seedDevice = (deviceModelId: string, gtin: string) =>
    db.device.create({
      data: {
        deviceId: `(01)${gtin}(11)210821(10)1234(21)${serial()}`,
        manufactureDate: new Date(Date.UTC(2021, 7, 21)),
        deviceModelId,
      },
    });

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
      where: { deviceModelId: { in: created.models } },
    });
    await db.deviceModel.deleteMany({ where: { id: { in: created.models } } });
    await db.user.deleteMany({ where: { id: { in: created.users } } });
    await app.close();
  });

  describe('authorization', () => {
    it('returns 401 without a token', async () => {
      await http()
        .post('/device-model')
        .send({ name: uniq('Model') })
        .expect(401);
    });

    it('returns 401 for GET without a token', async () => {
      await http().get(`/device-model/${gtin14()}`).expect(401);
    });

    it('returns 401 for PATCH without a token', async () => {
      await http()
        .patch(`/device-model/${randomUUID()}`)
        .send({ name: uniq('Model') })
        .expect(401);
    });

    it('returns 401 with an empty token cookie', async () => {
      await http()
        .post('/device-model')
        .set('Cookie', 'access-token=')
        .send({ name: uniq('Model') })
        .expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await http()
        .post('/device-model')
        .set('Cookie', 'access-token=not.a.jwt')
        .send({ name: uniq('Model') })
        .expect(401);
    });

    it('returns 401 with a forged signature', async () => {
      const [header, payload] = cookie.slice('access-token='.length).split('.');
      await http()
        .post('/device-model')
        .set('Cookie', `access-token=${header}.${payload}.forgedsignature`)
        .send({ name: uniq('Model') })
        .expect(401);
    });
  });

  describe('POST /device-model', () => {
    it('creates a model from a name alone', async () => {
      const name = uniq('Model');
      const res = await authed.post('/device-model').send({ name }).expect(201);
      created.models.push(dto(res).id);

      expect(res.body).toMatchObject({ name, gtin: null });
      expect(typeof dto(res).id).toBe('string');
      expect(Number.isNaN(Date.parse(String(dto(res).createdAt)))).toBe(false);
    });

    it('creates a model with a GTIN', async () => {
      const name = uniq('Model');
      const gtin = gtin14();
      const res = await authed
        .post('/device-model')
        .send({ name, gtin })
        .expect(201);
      created.models.push(dto(res).id);

      expect(res.body).toMatchObject({ name, gtin });
    });

    it('persists the model in the database', async () => {
      const name = uniq('Model');
      const gtin = gtin14();
      const res = await authed
        .post('/device-model')
        .send({ name, gtin })
        .expect(201);
      created.models.push(dto(res).id);

      const row = await db.deviceModel.findUnique({
        where: { id: dto(res).id },
      });
      expect(row).toMatchObject({ name, gtin });
    });

    it('trims the name', async () => {
      const name = uniq('Model');
      const res = await authed
        .post('/device-model')
        .send({ name: `  ${name}  ` })
        .expect(201);
      created.models.push(dto(res).id);

      expect(dto(res).name).toBe(name);
    });

    it('allows several models without a GTIN', async () => {
      await createModel();
      await createModel();
    });

    it('does not let the client set id or createdAt', async () => {
      const id = randomUUID();
      const res = await authed
        .post('/device-model')
        .send({ name: uniq('Model'), id, createdAt: '2001-01-01T00:00:00Z' })
        .expect(201);
      created.models.push(dto(res).id);

      expect(dto(res).id).not.toBe(id);
      expect(dto(res).createdAt).not.toContain('2001-01-01');
    });

    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['whitespace only', '   '],
      ['not a string', 42],
    ])('returns 400 when name is %s', async (_label, name) => {
      await authed.post('/device-model').send({ name }).expect(400);
    });

    it.each([
      ['too short', '123'],
      ['13 digits', '1234567890123'],
      ['15 digits', '123456789012345'],
      ['not digits', 'abcdefghijklmn'],
    ])('returns 400 when gtin is %s', async (_label, gtin) => {
      await authed
        .post('/device-model')
        .send({ name: uniq('Model'), gtin })
        .expect(400);
    });

    it('returns 409 when the name already exists', async () => {
      const first = await createModel();

      const res = await authed
        .post('/device-model')
        .send({ name: first.name })
        .expect(409);

      expect(res.body).toMatchObject({ type: 'device-model-exists' });
      expect(await db.deviceModel.count({ where: { name: first.name } })).toBe(
        1,
      );
    });

    it('returns 409 when the name only differs by surrounding spaces', async () => {
      const first = await createModel();

      await authed
        .post('/device-model')
        .send({ name: ` ${first.name} ` })
        .expect(409);
    });

    it('returns 409 when the GTIN already exists', async () => {
      const gtin = gtin14();
      await createModel({ gtin });

      const res = await authed
        .post('/device-model')
        .send({ name: uniq('Model'), gtin })
        .expect(409);

      expect(res.body).toMatchObject({ type: 'device-model-exists' });
      expect(await db.deviceModel.count({ where: { gtin } })).toBe(1);
    });

    it('lets a device with that GTIN in its ID resolve to the new model', async () => {
      const gtin = gtin14();
      const model = await createModel({ gtin });
      const deviceId = `(01)${gtin}(11)210821(10)1234(21)${serial()}`;

      const res = await authed.post('/device').send({ deviceId }).expect(201);

      expect(res.body).toMatchObject({ deviceId, modelName: model.name });
    });
  });

  describe('GET /device-model/:gtin', () => {
    const get = (gtin: string) =>
      http().get(`/device-model/${gtin}`).set('Cookie', cookie);

    it('returns the model with that GTIN', async () => {
      const gtin = gtin14();
      const model = await seedModel(gtin);

      const res = await get(gtin).expect(200);

      expect(res.body).toMatchObject({
        id: model.id,
        name: model.name,
        gtin,
      });
      expect(Number.isNaN(Date.parse(String(dto(res).createdAt)))).toBe(false);
    });

    it('returns the right model when several exist', async () => {
      const gtinA = gtin14();
      const gtinB = gtin14();
      const a = await seedModel(gtinA);
      const b = await seedModel(gtinB);

      expect(dto(await get(gtinA).expect(200)).id).toBe(a.id);
      expect(dto(await get(gtinB).expect(200)).id).toBe(b.id);
    });

    it('finds a model after PATCH gives it a GTIN', async () => {
      const model = await seedModel();
      const gtin = gtin14();
      await get(gtin).expect(404);

      await http()
        .patch(`/device-model/${model.id}`)
        .set('Cookie', cookie)
        .send({ gtin })
        .expect(200);

      expect(dto(await get(gtin).expect(200)).id).toBe(model.id);
    });

    it('returns 404 for a GTIN no model has', async () => {
      await get(gtin14()).expect(404);
    });

    it('does not match models that have no GTIN', async () => {
      await seedModel();

      await get(gtin14()).expect(404);
    });

    it.each([
      ['too short', '123'],
      ['13 digits', '1234567890123'],
      ['15 digits', '123456789012345'],
      ['not digits', 'abcdefghijklmn'],
    ])('returns 400 when the GTIN is %s', async (_label, gtin) => {
      await get(gtin).expect(400);
    });
  });

  describe('PATCH /device-model/:id', () => {
    const patch = (id: string, body: Record<string, unknown>) =>
      http().patch(`/device-model/${id}`).set('Cookie', cookie).send(body);

    it('renames a model and persists it', async () => {
      const model = await seedModel();
      const name = uniq('Renamed');

      const res = await patch(model.id, { name }).expect(200);

      expect(res.body).toMatchObject({ id: model.id, name });
      const row = await db.deviceModel.findUniqueOrThrow({
        where: { id: model.id },
      });
      expect(row.name).toBe(name);
    });

    it('trims the name', async () => {
      const model = await seedModel();
      const name = uniq('Renamed');

      const res = await patch(model.id, { name: `  ${name}  ` }).expect(200);

      expect(dto(res).name).toBe(name);
    });

    it('sets a GTIN on a model that has none', async () => {
      const model = await seedModel();
      const gtin = gtin14();

      const res = await patch(model.id, { gtin }).expect(200);

      expect(res.body).toMatchObject({ id: model.id, name: model.name, gtin });
      const row = await db.deviceModel.findUniqueOrThrow({
        where: { id: model.id },
      });
      expect(row.gtin).toBe(gtin);
    });

    it('updates the name and the GTIN together', async () => {
      const model = await seedModel();
      const name = uniq('Renamed');
      const gtin = gtin14();

      const res = await patch(model.id, { name, gtin }).expect(200);

      expect(res.body).toMatchObject({ id: model.id, name, gtin });
    });

    it('leaves the model unchanged for an empty body', async () => {
      const gtin = gtin14();
      const model = await seedModel(gtin);

      const res = await patch(model.id, {}).expect(200);

      expect(res.body).toMatchObject({ id: model.id, name: model.name, gtin });
    });

    it("accepts the model's own name and GTIN", async () => {
      const gtin = gtin14();
      const model = await seedModel(gtin);

      await patch(model.id, { name: model.name, gtin }).expect(200);
    });

    it('does not let the client set id or createdAt', async () => {
      const model = await seedModel();

      await patch(model.id, {
        name: uniq('Renamed'),
        id: randomUUID(),
        createdAt: '2001-01-01T00:00:00Z',
      }).expect(200);

      const row = await db.deviceModel.findUniqueOrThrow({
        where: { id: model.id },
      });
      expect(row.createdAt).toEqual(model.createdAt);
    });

    it.each([
      ['empty', ''],
      ['whitespace only', '   '],
      ['not a string', 42],
    ])('returns 400 when name is %s', async (_label, name) => {
      const model = await seedModel();

      await patch(model.id, { name }).expect(400);
    });

    it.each([
      ['too short', '123'],
      ['13 digits', '1234567890123'],
      ['15 digits', '123456789012345'],
      ['not digits', 'abcdefghijklmn'],
    ])('returns 400 when gtin is %s', async (_label, gtin) => {
      const model = await seedModel();

      await patch(model.id, { gtin }).expect(400);
    });

    it('returns 409 when the name belongs to another model', async () => {
      const model = await seedModel();
      const other = await seedModel();

      const res = await patch(model.id, { name: other.name }).expect(409);

      expect(res.body).toMatchObject({ type: 'device-model-exists' });
      const row = await db.deviceModel.findUniqueOrThrow({
        where: { id: model.id },
      });
      expect(row.name).toBe(model.name);
    });

    it('returns 409 when the GTIN belongs to another model', async () => {
      const gtin = gtin14();
      await seedModel(gtin);
      const model = await seedModel();

      const res = await patch(model.id, { gtin }).expect(409);

      expect(res.body).toMatchObject({ type: 'device-model-exists' });
      const row = await db.deviceModel.findUniqueOrThrow({
        where: { id: model.id },
      });
      expect(row.gtin).toBeNull();
    });

    describe('when devices use the model', () => {
      it('returns 409 device-model-in-use when the GTIN would change', async () => {
        const gtin = gtin14();
        const model = await seedModel(gtin);
        await seedDevice(model.id, gtin);

        const res = await patch(model.id, { gtin: gtin14() }).expect(409);

        expect(res.body).toMatchObject({ type: 'device-model-in-use' });
        const row = await db.deviceModel.findUniqueOrThrow({
          where: { id: model.id },
        });
        expect(row.gtin).toBe(gtin);
      });

      it('still allows a rename', async () => {
        const gtin = gtin14();
        const model = await seedModel(gtin);
        const device = await seedDevice(model.id, gtin);
        const name = uniq('Renamed');

        await patch(model.id, { name }).expect(200);

        const row = await db.device.findUniqueOrThrow({
          where: { id: device.id },
        });
        expect(row.deviceModelId).toBe(model.id);
      });

      it('accepts the GTIN it already has', async () => {
        const gtin = gtin14();
        const model = await seedModel(gtin);
        await seedDevice(model.id, gtin);

        await patch(model.id, { gtin }).expect(200);
      });
    });

    it('returns 404 for an unknown model', async () => {
      await patch(randomUUID(), { name: uniq('Renamed') }).expect(404);
    });
  });
});
