import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';

/**
 * E2E contract for /facilities (every route requires the `access-token`
 * cookie, see FacilitiesController and facilities/dto.ts).
 *
 * GET    /facilities?q=&sortBy=name|dateAdded -> 200 FacilityDto[]
 * POST   /facilities                          -> 201 FacilityDto (active: true)
 * PATCH  /facilities/:id                      -> 200 FacilityDto
 * DELETE /facilities/:id                      -> 200 the deleted FacilityDto
 *
 * All routes -> 401 without a valid token.
 *
 * Decisions this spec pins down (the controller is still a stub, so these
 * are the contract the implementation has to meet):
 * - POST also creates the facility admin: a Provider for the new facility
 *   with a User of role PORTAL_ADMIN (body field `admin`). All three rows
 *   are written in one transaction.
 * - `ein` is unique: POST with an existing EIN -> 409 `ein-exists`.
 * - Admin email / NPI are unique -> 409 `email-exists` / `npi-exists`, and
 *   no facility is created.
 * - `ein`, `permit`, `npi` and `active` are not editable through PATCH.
 * - `q` matches the facility name only (partial, case-insensitive), not city.
 * - `sortBy=name` is A-Z, `sortBy=dateAdded` is newest first.
 * - Unknown id -> 404; DELETE removes the facility's providers too (cascade).
 *
 * The DB is shared, so tests only look at the facilities they create
 * (named with a per-run marker) and remove them in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `fac-${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;
const ein = () =>
  `${Math.floor(10 + Math.random() * 90)}-${Math.floor(
    1_000_000 + Math.random() * 9_000_000,
  )}`;

describe('Facilities (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (url: string) => http().get(url).set('Cookie', cookie),
    post: (url: string) => http().post(url).set('Cookie', cookie),
    patch: (url: string) => http().patch(url).set('Cookie', cookie),
    delete: (url: string) => http().delete(url).set('Cookie', cookie),
  };

  const created = {
    facilities: [] as string[],
    providers: [] as string[],
    users: [] as string[],
  };

  const validBody = (overrides: Record<string, unknown> = {}) => ({
    ein: ein(),
    permit: '555333',
    npi: '1567890342',
    name: uniq('Clinic'),
    city: 'Tallahassee',
    state: 'FL',
    phone: '(303) 941-3333',
    address: '13654 Kenzo Lane',
    unit: '436',
    zip: '80023',
    contactName: 'Conejo Jones',
    contactEmail: `${uniq('contact')}@example.com`,
    admin: adminBody(),
    ...overrides,
  });

  // Admin emails carry the run marker, so afterAll can find these users.
  const adminBody = (
    overrides: Record<string, unknown> = {},
    userOverrides: Record<string, unknown> = {},
  ) => ({
    npi: uniq('npi'),
    phone: '(303) 941-5555',
    address: '7 Admin Street',
    dateHired: '2026-01-15T00:00:00.000Z',
    user: {
      email: `${uniq('admin')}@example.com`,
      firstName: 'Ada',
      lastName: 'Admin',
      ...userOverrides,
    },
    ...overrides,
  });

  const createFacility = async (overrides: Record<string, unknown> = {}) => {
    const res = await authed
      .post('/facilities')
      .send(validBody(overrides))
      .expect(201);
    created.facilities.push(res.body.id);
    return res.body;
  };

  const listNames = async (query = '') =>
    (await authed.get(`/facilities${query}`).expect(200)).body.map(
      (f: { name: string }) => f.name,
    );

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
    await db.provider.deleteMany({ where: { id: { in: created.providers } } });
    // Deleting an admin user also removes its provider (cascade).
    await db.user.deleteMany({
      where: {
        OR: [
          { id: { in: created.users } },
          { email: { startsWith: 'admin-', contains: run } },
        ],
      },
    });
    await db.facility.deleteMany({ where: { id: { in: created.facilities } } });
    await app.close();
  });

  describe('authorization', () => {
    const id = randomUUID();
    const routes: [string, string][] = [
      ['get', '/facilities'],
      ['post', '/facilities'],
      ['patch', `/facilities/${id}`],
      ['delete', `/facilities/${id}`],
    ];

    it.each(routes)(
      '%s %s returns 401 without a token',
      async (method, url) => {
        await (http() as any)[method](url).send({}).expect(401);
      },
    );

    it('returns 401 with an empty token cookie', async () => {
      await http()
        .get('/facilities')
        .set('Cookie', 'access-token=')
        .expect(401);
    });

    it('returns 401 with a malformed token', async () => {
      await http()
        .get('/facilities')
        .set('Cookie', 'access-token=not.a.jwt')
        .expect(401);
    });

    it('returns 401 with a forged signature', async () => {
      const [header, payload] = cookie.slice('access-token='.length).split('.');
      await http()
        .post('/facilities')
        .set('Cookie', `access-token=${header}.${payload}.forgedsignature`)
        .send(validBody())
        .expect(401);
    });
  });

  describe('POST /facilities', () => {
    it('creates a facility and returns it with id, active and createdAt', async () => {
      const { admin, ...body } = validBody();
      const res = await authed
        .post('/facilities')
        .send({ ...body, admin })
        .expect(201);
      created.facilities.push(res.body.id);

      expect(res.body).toMatchObject({ ...body, active: true });
      expect(res.body).not.toHaveProperty('admin');
      expect(typeof res.body.id).toBe('string');
      expect(Number.isNaN(Date.parse(res.body.createdAt))).toBe(false);
    });

    it('persists the facility in the database', async () => {
      const body = validBody();
      const res = await authed.post('/facilities').send(body).expect(201);
      created.facilities.push(res.body.id);

      const row = await db.facility.findUnique({ where: { id: res.body.id } });
      expect(row).toMatchObject({
        name: body.name,
        city: body.city,
        state: body.state,
        zip: body.zip,
      });
    });

    it('accepts a body without the optional unit', async () => {
      const { unit: _unit, ...body } = validBody();
      const res = await authed.post('/facilities').send(body).expect(201);
      created.facilities.push(res.body.id);

      expect(res.body.unit ?? null).toBeNull();
    });

    it.each([
      'ein',
      'name',
      'city',
      'state',
      'phone',
      'address',
      'zip',
      'contactName',
      'contactEmail',
      'admin',
    ])('returns 400 when %s is missing', async (field) => {
      const body: Record<string, unknown> = validBody();
      delete body[field];

      await authed.post('/facilities').send(body).expect(400);
    });

    it('returns 400 for an invalid contactEmail', async () => {
      await authed
        .post('/facilities')
        .send(validBody({ contactEmail: 'not-an-email' }))
        .expect(400);
    });

    it('returns 400 for an empty name', async () => {
      await authed
        .post('/facilities')
        .send(validBody({ name: '' }))
        .expect(400);
    });

    it('returns 409 when the EIN already exists', async () => {
      const first = await createFacility();

      await authed
        .post('/facilities')
        .send(validBody({ ein: first.ein }))
        .expect(409, { type: 'ein-exists' });

      // Count only this EIN: the global count changes when other specs run
      // in parallel on the shared DB.
      expect(await db.facility.count({ where: { ein: first.ein } })).toBe(1);
    });
  });

  describe('POST /facilities — facility admin', () => {
    it('creates a PORTAL_ADMIN user and its provider for the facility', async () => {
      const admin = adminBody();
      const facility = await createFacility({ admin });

      const user = await db.user.findUniqueOrThrow({
        where: { email: admin.user.email },
        include: { provider: true },
      });
      expect(user).toMatchObject({
        role: 'PORTAL_ADMIN',
        firstName: admin.user.firstName,
        lastName: admin.user.lastName,
      });
      expect(user.provider).toMatchObject({
        facilityId: facility.id,
        npi: admin.npi,
        phone: admin.phone,
        address: admin.address,
      });
      expect(user.provider?.dateHired.toISOString()).toBe(admin.dateHired);
    });

    it('stores a password hash and a pending reset token for the admin', async () => {
      const admin = adminBody();
      await createFacility({ admin });

      const user = await db.user.findUniqueOrThrow({
        where: { email: admin.user.email },
      });
      expect(user.passwordHash).toMatch(/^[0-9a-f]+$/);
      expect(user.salt).toMatch(/^[0-9a-f]+$/);
      expect(user.resetToken).toMatch(/^[0-9a-f]{64}$/);
      expect(user.resetTokenExpiresAt!.getTime()).toBeGreaterThan(Date.now());
    });

    it('ignores a role sent by the client', async () => {
      const admin = adminBody({}, { role: 'SUPER_ADMIN' });
      await createFacility({ admin });

      const user = await db.user.findUniqueOrThrow({
        where: { email: admin.user.email },
      });
      expect(user.role).toBe('PORTAL_ADMIN');
    });

    it('returns 409 email-exists and creates nothing when the admin email is taken', async () => {
      const first = adminBody();
      await createFacility({ admin: first });

      const body = validBody({
        admin: adminBody({}, { email: first.user.email }),
      });
      await authed
        .post('/facilities')
        .send(body)
        .expect(409, { type: 'email-exists' });

      expect(await db.facility.count({ where: { ein: body.ein } })).toBe(0);
      expect(await db.provider.count({ where: { npi: body.admin.npi } })).toBe(
        0,
      );
    });

    it('returns 409 npi-exists and creates nothing when the admin NPI is taken', async () => {
      const first = adminBody();
      await createFacility({ admin: first });

      const body = validBody({ admin: adminBody({ npi: first.npi }) });
      await authed
        .post('/facilities')
        .send(body)
        .expect(409, { type: 'npi-exists' });

      expect(await db.facility.count({ where: { ein: body.ein } })).toBe(0);
      expect(
        await db.user.count({ where: { email: body.admin.user.email } }),
      ).toBe(0);
    });

    it.each(['npi', 'phone', 'address', 'dateHired', 'user'])(
      'returns 400 when admin.%s is missing',
      async (field) => {
        const admin: Record<string, unknown> = adminBody();
        delete admin[field];

        await authed.post('/facilities').send(validBody({ admin })).expect(400);
      },
    );

    it.each(['email', 'firstName', 'lastName'])(
      'returns 400 when admin.user.%s is missing',
      async (field) => {
        const admin = adminBody();
        const user: Record<string, unknown> = { ...admin.user };
        delete user[field];

        await authed
          .post('/facilities')
          .send(validBody({ admin: { ...admin, user } }))
          .expect(400);
      },
    );

    it('returns 400 for an invalid admin email', async () => {
      await authed
        .post('/facilities')
        .send(validBody({ admin: adminBody({}, { email: 'not-an-email' }) }))
        .expect(400);
    });

    it('returns 400 for an invalid admin dateHired', async () => {
      await authed
        .post('/facilities')
        .send(validBody({ admin: adminBody({ dateHired: 'not-a-date' }) }))
        .expect(400);
    });

    it('does not let the client set id, active or createdAt', async () => {
      const id = randomUUID();
      const res = await authed
        .post('/facilities')
        .send(
          validBody({ id, active: false, createdAt: '2001-01-01T00:00:00Z' }),
        )
        .expect(201);
      created.facilities.push(res.body.id);

      expect(res.body.id).not.toBe(id);
      expect(res.body.active).toBe(true);
      expect(res.body.createdAt).not.toContain('2001-01-01');
    });
  });

  describe('GET /facilities', () => {
    it('returns an array that includes a newly created facility', async () => {
      const facility = await createFacility();

      const res = await authed.get('/facilities').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toContainEqual(
        expect.objectContaining({ id: facility.id, name: facility.name }),
      );
    });

    it('returns the full FacilityDto shape for each item', async () => {
      await createFacility();

      const res = await authed.get('/facilities').expect(200);

      for (const item of res.body) {
        expect(item).toEqual(
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            city: expect.any(String),
            state: expect.any(String),
            phone: expect.any(String),
            active: expect.any(Boolean),
            createdAt: expect.any(String),
          }),
        );
      }
    });

    it('filters by q on name, case-insensitive', async () => {
      const marker = uniq('Searchable');
      const match = await createFacility({ name: `${marker} CPAP` });
      await createFacility({ name: uniq('Other') });

      const names = await listNames(`?q=${marker.toUpperCase()}`);

      expect(names).toEqual([match.name]);
    });

    it('filters by q on a partial name', async () => {
      const marker = uniq('Partial');
      const match = await createFacility({ name: `Florida ${marker} CPAP` });

      const res = await authed.get(`/facilities?q=${marker}`).expect(200);

      expect(res.body.map((f: { id: string }) => f.id)).toEqual([match.id]);
    });

    it('does not match q against the city', async () => {
      const city = uniq('Cityville');
      await createFacility({ city });

      const res = await authed.get(`/facilities?q=${city}`).expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns an empty array when q matches nothing', async () => {
      const res = await authed
        .get(`/facilities?q=${uniq('nomatch')}`)
        .expect(200);

      expect(res.body).toEqual([]);
    });

    it('sorts by name A-Z with sortBy=name', async () => {
      const marker = uniq('Sort');
      await createFacility({ name: `${marker}-b` });
      await createFacility({ name: `${marker}-c` });
      await createFacility({ name: `${marker}-a` });

      const names = await listNames(`?q=${marker}&sortBy=name`);

      expect(names).toEqual([`${marker}-a`, `${marker}-b`, `${marker}-c`]);
    });

    it('sorts newest first with sortBy=dateAdded', async () => {
      const marker = uniq('Date');
      await createFacility({ name: `${marker}-first` });
      await createFacility({ name: `${marker}-second` });

      const names = await listNames(`?q=${marker}&sortBy=dateAdded`);

      expect(names).toEqual([`${marker}-second`, `${marker}-first`]);
    });

    it('returns 400 for an unknown sortBy', async () => {
      await authed.get('/facilities?sortBy=bogus').expect(400);
    });

    it('still lists inactive facilities', async () => {
      const facility = await createFacility();
      await db.facility.update({
        where: { id: facility.id },
        data: { active: false },
      });

      const res = await authed.get('/facilities').expect(200);

      expect(res.body).toContainEqual(
        expect.objectContaining({ id: facility.id, active: false }),
      );
    });
  });

  describe('PATCH /facilities/:id', () => {
    const update = (overrides: Record<string, unknown> = {}) => ({
      name: uniq('Renamed'),
      city: 'Miami',
      state: 'FL',
      phone: '(303) 941-1234',
      address: '1 New Street',
      unit: '12B',
      zip: '33101',
      contactName: 'New Contact',
      contactEmail: `${uniq('new-contact')}@example.com`,
      ...overrides,
    });

    it('updates the editable fields and returns the facility', async () => {
      const facility = await createFacility();
      const body = update();

      const res = await authed
        .patch(`/facilities/${facility.id}`)
        .send(body)
        .expect(200);

      expect(res.body).toMatchObject({ id: facility.id, ...body });
      const row = await db.facility.findUniqueOrThrow({
        where: { id: facility.id },
      });
      expect(row).toMatchObject({
        name: body.name,
        city: 'Miami',
        zip: '33101',
      });
    });

    it('keeps ein, permit, npi, active and createdAt unchanged', async () => {
      const facility = await createFacility();

      const res = await authed
        .patch(`/facilities/${facility.id}`)
        .send(
          update({
            ein: ein(),
            permit: 'changed',
            npi: '0000000000',
            active: false,
          }),
        )
        .expect(200);

      expect(res.body).toMatchObject({
        ein: facility.ein,
        permit: facility.permit,
        npi: facility.npi,
        active: true,
        createdAt: facility.createdAt,
      });
    });

    it('returns 400 for an invalid contactEmail', async () => {
      const facility = await createFacility();

      await authed
        .patch(`/facilities/${facility.id}`)
        .send(update({ contactEmail: 'nope' }))
        .expect(400);
    });

    it('returns 404 for an unknown id', async () => {
      await authed
        .patch(`/facilities/${randomUUID()}`)
        .send(update())
        .expect(404);
    });
  });

  describe('DELETE /facilities/:id', () => {
    it('deletes the facility and returns it', async () => {
      const facility = await createFacility();

      const res = await authed.delete(`/facilities/${facility.id}`).expect(200);

      expect(res.body).toMatchObject({ id: facility.id, name: facility.name });
      expect(
        await db.facility.findUnique({ where: { id: facility.id } }),
      ).toBeNull();
    });

    it('no longer lists the deleted facility', async () => {
      const facility = await createFacility();
      await authed.delete(`/facilities/${facility.id}`).expect(200);

      const res = await authed.get('/facilities').expect(200);

      expect(res.body.map((f: { id: string }) => f.id)).not.toContain(
        facility.id,
      );
    });

    it('returns 404 when deleted twice', async () => {
      const facility = await createFacility();
      await authed.delete(`/facilities/${facility.id}`).expect(200);

      await authed.delete(`/facilities/${facility.id}`).expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await authed.delete(`/facilities/${randomUUID()}`).expect(404);
    });

    it('deletes the facility together with its providers (cascade)', async () => {
      const facility = await createFacility();
      const user = await db.user.create({
        data: {
          email: `${uniq('provider')}@example.com`,
          passwordHash: 'x',
          salt: 'x',
          role: 'PROVIDER',
        },
      });
      created.users.push(user.id);
      const provider = await db.provider.create({
        data: {
          npi: uniq('npi'),
          phone: '555-0101',
          address: '2 Main St',
          dateHired: new Date(),
          userId: user.id,
          facilityId: facility.id,
        },
      });
      created.providers.push(provider.id);

      await authed.delete(`/facilities/${facility.id}`).expect(200);

      expect(
        await db.facility.findUnique({ where: { id: facility.id } }),
      ).toBeNull();
      expect(
        await db.provider.findUnique({ where: { id: provider.id } }),
      ).toBeNull();
      // the provider's user account is not part of the cascade
      expect(
        await db.user.findUnique({ where: { id: user.id } }),
      ).not.toBeNull();
    });
  });
});
