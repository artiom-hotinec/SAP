import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';

/**
 * E2E contract for /providers (every route requires the `access-token`
 * cookie, see ProvidersController and providers/dto.ts).
 *
 * GET /providers?q=&sortBy=providerName -> 200 ProviderDto[]
 * GET /providers/:id                      -> 200 ProviderDto
 *
 * All routes -> 401 without a valid token.
 *
 * Decisions this spec pins down:
 * - ProviderDto is flattened from Provider + User + Facility:
 *   `providerName` is "firstName lastName", `facilityName` is the facility's name.
 * - `q` matches the user's first or last name (partial, case-insensitive).
 * - `sortBy=providerName` is A-Z by first name; without `sortBy` the list is newest first.
 * - Unknown id -> 404.
 *
 * The DB is shared, so tests only look at the providers they create (names
 * carry a per-run marker, used as `q`) and remove them in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';

const run = `prov${Date.now()}`;
let counter = 0;
const uniq = (prefix: string) => `${prefix}-${run}-${counter++}`;

describe('Providers (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  let cookie: string;
  let facility: { id: string; name: string };

  const http = () => request(app.getHttpServer());
  const authed = {
    get: (url: string) => http().get(url).set('Cookie', cookie),
  };

  const created = {
    facilities: [] as string[],
    providers: [] as string[],
    users: [] as string[],
  };

  const createProvider = async (
    user: { firstName?: string; lastName?: string } = {},
    provider: { dateHired?: Date } = {},
  ) => {
    const email = `${uniq('provider')}@example.com`;
    const u = await db.user.create({
      data: {
        email,
        passwordHash: 'x',
        salt: 'x',
        role: 'PROVIDER',
        firstName: user.firstName ?? `Pat${run}`,
        lastName: user.lastName ?? 'Provider',
      },
    });
    created.users.push(u.id);
    const p = await db.provider.create({
      data: {
        npi: `${Date.now()}${counter++}`.slice(-10),
        phone: '(303) 941-3333',
        address: '1 Main St',
        dateHired: provider.dateHired ?? new Date('2024-01-15'),
        userId: u.id,
        facilityId: facility.id,
      },
    });
    created.providers.push(p.id);
    return { provider: p, user: u };
  };

  const listIds = async (query: string) =>
    (await authed.get(`/providers${query}`).expect(200)).body.map(
      (p: { id: string }) => p.id,
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

    facility = await db.facility.create({
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
      },
    });
    created.facilities.push(facility.id);
  });

  afterAll(async () => {
    await db.provider.deleteMany({ where: { id: { in: created.providers } } });
    await db.user.deleteMany({ where: { id: { in: created.users } } });
    await db.facility.deleteMany({ where: { id: { in: created.facilities } } });
    await app.close();
  });

  describe('authorization', () => {
    const routes = ['/providers', `/providers/${randomUUID()}`];

    it.each(routes)('GET %s returns 401 without a token', async (url) => {
      await http().get(url).expect(401);
    });
  });

  describe('GET /providers', () => {
    it('returns flattened ProviderDto items', async () => {
      const { provider, user } = await createProvider({
        firstName: `Ann${run}`,
        lastName: 'Lee',
      });

      const res = await authed.get(`/providers?q=Ann${run}`).expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0]).toMatchObject({
        id: provider.id,
        npi: provider.npi,
        email: user.email,
        firstName: `Ann${run}`,
        lastName: 'Lee',
        providerName: `Ann${run} Lee`,
        facilityName: facility.name,
        dateHired: provider.dateHired.toISOString(),
      });
    });

    it('does not leak sensitive user fields', async () => {
      await createProvider({ firstName: `Leak${run}` });

      const res = await authed.get(`/providers?q=Leak${run}`).expect(200);

      expect(res.body[0]).not.toHaveProperty('passwordHash');
      expect(res.body[0]).not.toHaveProperty('salt');
    });

    it('includes created providers in the unfiltered list', async () => {
      const { provider } = await createProvider();

      expect(await listIds('')).toContain(provider.id);
    });

    describe('q', () => {
      it('matches first name, partial and case-insensitive', async () => {
        const { provider } = await createProvider({
          firstName: `Zelda${run}`,
        });

        expect(await listIds(`?q=zELDa${run}`.toLowerCase())).toContain(
          provider.id,
        );
        expect(await listIds(`?q=ZELDA${run}`)).toContain(provider.id);
      });

      it('matches last name', async () => {
        const lastName = `Quill${run}`;
        const { provider } = await createProvider({ lastName });

        expect(await listIds(`?q=${lastName.slice(0, 8)}`)).toContain(
          provider.id,
        );
      });

      it('returns an empty list when nothing matches', async () => {
        expect(await listIds(`?q=nobody-${run}-${randomUUID()}`)).toEqual([]);
      });

      it('does not match the facility name', async () => {
        const { provider } = await createProvider({ firstName: `Only${run}` });

        expect(await listIds(`?q=${facility.name}`)).not.toContain(provider.id);
      });
    });

    describe('sortBy', () => {
      const marker = `Sort${run}`;
      let a: string, b: string, c: string;

      beforeAll(async () => {
        // Created out of alphabetical order, and hired oldest-first for b.
        b = (
          await createProvider(
            { firstName: `${marker}-B` },
            { dateHired: new Date('2020-01-01') },
          )
        ).provider.id;
        c = (await createProvider({ firstName: `${marker}-C` })).provider.id;
        a = (await createProvider({ firstName: `${marker}-A` })).provider.id;
      });

      it('sortBy=providerName is A-Z by first name', async () => {
        expect(await listIds(`?q=${marker}&sortBy=providerName`)).toEqual([
          a,
          b,
          c,
        ]);
      });

      it('defaults to newest first', async () => {
        expect(await listIds(`?q=${marker}`)).toEqual([a, c, b]);
      });

      it('rejects an unknown sortBy value with 400', async () => {
        await authed.get('/providers?sortBy=bogus').expect(400);
      });
    });
  });

  describe('GET /providers/:id', () => {
    it('returns the provider as a ProviderDto', async () => {
      const { provider, user } = await createProvider({
        firstName: `Bob${run}`,
        lastName: 'Stone',
      });

      const res = await authed.get(`/providers/${provider.id}`).expect(200);

      expect(res.body).toMatchObject({
        id: provider.id,
        npi: provider.npi,
        phone: provider.phone,
        address: provider.address,
        email: user.email,
        firstName: `Bob${run}`,
        lastName: 'Stone',
        providerName: `Bob${run} Stone`,
        facilityName: facility.name,
        dateHired: provider.dateHired.toISOString(),
      });
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('salt');
    });

    it('trims providerName when the last name is missing', async () => {
      const { provider, user } = await createProvider({
        firstName: `Solo${run}`,
      });
      await db.user.update({
        where: { id: user.id },
        data: { lastName: null },
      });

      const res = await authed.get(`/providers/${provider.id}`).expect(200);

      expect(res.body.providerName).toBe(`Solo${run}`);
      expect(res.body.lastName).toBeNull();
    });

    it('returns 404 for an unknown id', async () => {
      await authed.get(`/providers/${randomUUID()}`).expect(404);
    });
  });
});
