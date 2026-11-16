import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';

/**
 * E2E contract for authentication (written first, TDD).
 *
 * POST /auth/register  { email, password } -> 201 { accessToken }   creates a user
 * POST /auth/login     { email, password } -> 200 { accessToken }   looks up an existing user
 *
 * Rules:
 * - password: at least 8 characters (see docs/db-entities.md, UserConsent)
 * - email is unique and case-sensitive (User@x.com and user@x.com are different users)
 * - bad credentials -> 401 with the same response for "unknown email" and
 *   "wrong password" (no user enumeration)
 * - the response and the JWT payload never contain the password or its hash
 *
 * The DB is not wired up yet and the ORM is undecided, so these tests do not
 * clean the DB: every test uses a unique email.
 */

const PASSWORD = 'Str0ngPassw0rd!';

let counter = 0;
const uniqueEmail = (prefix = 'user') =>
  `${prefix}.${Date.now()}.${counter++}@example.com`;

function decodeJwt(token: string) {
  const [header, payload, signature] = token.split('.');
  const parse = (part: string) =>
    JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
  return { header: parse(header), payload: parse(payload), signature };
}

// Login sets the JWT only in the `access-token` httpOnly cookie (no body).
function tokenFromCookie(res: { headers: Record<string, unknown> }) {
  const cookies = ([] as string[]).concat(
    (res.headers['set-cookie'] as string[] | string | undefined) ?? [],
  );
  const cookie = cookies.find((c) => c.startsWith('access-token='));
  return cookie?.split(';')[0].slice('access-token='.length);
}

function expectValidJwt(token: unknown) {
  expect(typeof token).toBe('string');
  const parts = (token as string).split('.');
  expect(parts).toHaveLength(3);
  parts.forEach((part) => expect(part).toMatch(/^[A-Za-z0-9_-]+$/));

  const { payload } = decodeJwt(token as string);
  expect(payload.id).toBeDefined();
  expect(payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  expect(JSON.stringify(payload).toLowerCase()).not.toContain('password');
  return payload;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mirrors what main.ts is expected to configure. If you register the pipe
    // in AppModule (APP_PIPE) instead, this line can be removed.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('creates a user and returns a JWT', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ email: uniqueEmail(), password: PASSWORD })
        .expect(201);

      expectValidJwt(res.body.accessToken);
    });

    it('does not leak the password or hash in the response', async () => {
      const res = await http()
        .post('/auth/register')
        .send({ email: uniqueEmail(), password: PASSWORD })
        .expect(201);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(PASSWORD);
      expect(body.toLowerCase()).not.toContain('hash');
    });

    it('creates a real user: the same credentials can log in afterwards', async () => {
      const email = uniqueEmail();
      await http()
        .post('/auth/register')
        .send({ email, password: PASSWORD })
        .expect(201);

      const res = await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      expectValidJwt(tokenFromCookie(res));
    });

    it('rejects an already registered email with 409', async () => {
      const email = uniqueEmail();
      await http()
        .post('/auth/register')
        .send({ email, password: PASSWORD })
        .expect(201);

      await http()
        .post('/auth/register')
        .send({ email, password: 'AnotherPassw0rd!' })
        .expect(409);
    });

    it('treats emails that differ only by case as different users', async () => {
      const email = uniqueEmail('case');
      const first = await http()
        .post('/auth/register')
        .send({ email, password: PASSWORD })
        .expect(201);

      const second = await http()
        .post('/auth/register')
        .send({ email: email.toUpperCase(), password: PASSWORD })
        .expect(201);

      expect(decodeJwt(second.body.accessToken).payload.id).not.toBe(
        decodeJwt(first.body.accessToken).payload.id,
      );
    });

    it('does not overwrite the password of an existing user', async () => {
      const email = uniqueEmail();
      await http()
        .post('/auth/register')
        .send({ email, password: PASSWORD })
        .expect(201);
      await http()
        .post('/auth/register')
        .send({ email, password: 'AttackerPassw0rd!' })
        .expect(409);

      await http()
        .post('/auth/login')
        .send({ email, password: 'AttackerPassw0rd!' })
        .expect(401);
      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
    });

    it.each([
      ['email is missing', { password: PASSWORD }],
      ['password is missing', { email: 'missing.password@example.com' }],
      ['body is empty', {}],
      [
        'email is not a valid email',
        { email: 'not-an-email', password: PASSWORD },
      ],
      ['email is not a string', { email: 123, password: PASSWORD }],
      [
        'password is shorter than 8 characters',
        { email: 'short@example.com', password: 'Short1!' },
      ],
      [
        'password is not a string',
        { email: 'nostring@example.com', password: 12345678 },
      ],
    ])('returns 400 when %s', async (_name, body) => {
      await http().post('/auth/register').send(body).expect(400);
    });

    it('does not create a user when validation fails', async () => {
      const email = uniqueEmail();
      await http()
        .post('/auth/register')
        .send({ email, password: 'short' })
        .expect(400);

      await http()
        .post('/auth/login')
        .send({ email, password: 'short' })
        .expect(401);
    });
  });

  describe('POST /auth/login', () => {
    const email = uniqueEmail('login');

    beforeAll(async () => {
      await http()
        .post('/auth/register')
        .send({ email, password: PASSWORD })
        .expect(201);
    });

    it('returns a JWT for valid credentials', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      expectValidJwt(tokenFromCookie(res));
    });

    it('does not leak the password or hash in the response', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);

      const body = JSON.stringify(res.body);
      expect(body).not.toContain(PASSWORD);
      expect(body.toLowerCase()).not.toContain('hash');
    });

    it('issues a token for the same user as registration', async () => {
      const newEmail = uniqueEmail();
      const registered = await http()
        .post('/auth/register')
        .send({ email: newEmail, password: PASSWORD })
        .expect(201);
      const loggedIn = await http()
        .post('/auth/login')
        .send({ email: newEmail, password: PASSWORD })
        .expect(200);

      expect(decodeJwt(tokenFromCookie(loggedIn) as string).payload.id).toBe(
        decodeJwt(registered.body.accessToken).payload.id,
      );
    });

    it('does not create a user (login of an unknown email fails)', async () => {
      const unknown = uniqueEmail('ghost');
      await http()
        .post('/auth/login')
        .send({ email: unknown, password: PASSWORD })
        .expect(401);
      // Still unknown: login must never have registered it.
      await http()
        .post('/auth/login')
        .send({ email: unknown, password: PASSWORD })
        .expect(401);
    });

    it('does not match the email in a different case', async () => {
      await http()
        .post('/auth/login')
        .send({ email: email.toUpperCase(), password: PASSWORD })
        .expect(401);
    });

    it('rejects a wrong password with 401 and no token', async () => {
      const res = await http()
        .post('/auth/login')
        .send({ email, password: 'WrongPassw0rd!' })
        .expect(401);

      expect(res.body.accessToken).toBeUndefined();
    });

    it('rejects a password that differs only by case', async () => {
      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD.toUpperCase() })
        .expect(401);
    });

    it('returns the same error for unknown email and wrong password', async () => {
      const wrongPassword = await http()
        .post('/auth/login')
        .send({ email, password: 'WrongPassw0rd!' })
        .expect(401);
      const unknownEmail = await http()
        .post('/auth/login')
        .send({ email: uniqueEmail('nobody'), password: PASSWORD })
        .expect(401);

      expect(unknownEmail.body).toEqual(wrongPassword.body);
    });

    it.each([
      ['email is missing', { password: PASSWORD }],
      ['password is missing', { email: 'someone@example.com' }],
      ['body is empty', {}],
      [
        'email is not a valid email',
        { email: 'not-an-email', password: PASSWORD },
      ],
      [
        'password is not a string',
        { email: 'someone@example.com', password: 12345678 },
      ],
    ])('returns 400 when %s', async (_name, body) => {
      await http().post('/auth/login').send(body).expect(400);
    });
  });
});
