import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { DbService } from './../src/db/db.service.js';

/**
 * E2E contract for the current user endpoints (AuthGuard on the whole controller).
 *
 * GET   /user  -> 200 UserDto of the session user (never exposes password data)
 * PATCH /user  { oldPassword, newPassword } -> 204, changes the password
 *   - wrong oldPassword            -> 401
 *   - newPassword === oldPassword  -> 400
 *   - missing / empty fields       -> 400
 *
 * The specs hit the real dev database; every user created here is removed
 * in afterAll.
 */

const PASSWORD = 'Str0ngPassw0rd!';
const NEW_PASSWORD = 'N3wStr0ngPassw0rd!';

let counter = 0;
const uniqueEmail = (prefix = 'user') =>
  `${prefix}.${Date.now()}.${counter++}@example.com`;

describe('User (e2e)', () => {
  let app: INestApplication<App>;
  let db: DbService;
  const createdEmails: string[] = [];
  const http = () => request(app.getHttpServer());

  /** Registers a user, logs in and returns the `access-token` cookie. */
  async function createUser(prefix = 'user') {
    const email = uniqueEmail(prefix);
    createdEmails.push(email);
    await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD })
      .expect(201);
    const cookie = await login(email, PASSWORD);
    return { email, cookie };
  }

  async function login(email: string, password: string) {
    const res = await http()
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    const cookies = ([] as string[]).concat(
      (res.headers['set-cookie'] as string[] | string | undefined) ?? [],
    );
    const cookie = cookies.find((c) => c.startsWith('access-token='));
    return cookie!.split(';')[0];
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
    db = app.get(DbService);
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { in: createdEmails } } });
    await app.close();
  });

  describe('authentication', () => {
    it('GET /user returns 401 without a cookie', async () => {
      await http().get('/user').expect(401);
    });

    it('PATCH /user returns 401 without a cookie', async () => {
      await http()
        .patch('/user')
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(401);
    });

    it('GET /user returns 401 with an invalid token', async () => {
      await http()
        .get('/user')
        .set('Cookie', 'access-token=not.a.jwt')
        .expect(401);
    });
  });

  describe('GET /user', () => {
    it('returns the current user', async () => {
      const { email, cookie } = await createUser();

      const res = await http().get('/user').set('Cookie', cookie).expect(200);

      expect(res.body).toMatchObject({
        email,
        firstName: null,
        lastName: null,
        avatar: null,
        phone: null,
      });
      expect(typeof res.body.id).toBe('string');
      expect(res.body.unitsPreference).toBeDefined();
      expect(res.body.role).toBeDefined();
    });

    it('returns the user of the token, not another one', async () => {
      const first = await createUser('first');
      const second = await createUser('second');

      const res1 = await http()
        .get('/user')
        .set('Cookie', first.cookie)
        .expect(200);
      const res2 = await http()
        .get('/user')
        .set('Cookie', second.cookie)
        .expect(200);

      expect(res1.body.email).toBe(first.email);
      expect(res2.body.email).toBe(second.email);
      expect(res1.body.id).not.toBe(res2.body.id);
    });

    it('does not leak the password, hash or salt', async () => {
      const { cookie } = await createUser();

      const res = await http().get('/user').set('Cookie', cookie).expect(200);

      const body = JSON.stringify(res.body).toLowerCase();
      expect(body).not.toContain(PASSWORD.toLowerCase());
      expect(body).not.toContain('hash');
      expect(body).not.toContain('salt');
      expect(res.body.passwordHash).toBeUndefined();
      expect(res.body.salt).toBeUndefined();
    });
  });

  describe('PATCH /user (change password)', () => {
    it('changes the password: new one logs in, old one does not', async () => {
      const { email, cookie } = await createUser();

      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(204);

      await http()
        .post('/auth/login')
        .send({ email, password: NEW_PASSWORD })
        .expect(200);
      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(401);
    });

    it('returns an empty body on success', async () => {
      const { cookie } = await createUser();

      const res = await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(204);

      expect(res.body).toEqual({});
      expect(res.text).toBe('');
    });

    it('rejects a wrong current password with 401 and keeps the old one', async () => {
      const { email, cookie } = await createUser();

      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: 'WrongPassw0rd!', newPassword: NEW_PASSWORD })
        .expect(401);

      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
      await http()
        .post('/auth/login')
        .send({ email, password: NEW_PASSWORD })
        .expect(401);
    });

    it('rejects a new password equal to the current one with 400', async () => {
      const { email, cookie } = await createUser();

      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: PASSWORD, newPassword: PASSWORD })
        .expect(400);

      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
    });

    it('only changes the password of the session user', async () => {
      const first = await createUser('first');
      const second = await createUser('second');

      await http()
        .patch('/user')
        .set('Cookie', first.cookie)
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(204);

      await http()
        .post('/auth/login')
        .send({ email: second.email, password: PASSWORD })
        .expect(200);
    });

    it('allows changing the password again with the new one', async () => {
      const { cookie } = await createUser();

      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(204);
      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: NEW_PASSWORD, newPassword: 'Th1rdPassw0rd!' })
        .expect(204);
    });

    it('keeps the existing session valid after the change', async () => {
      const { email, cookie } = await createUser();

      await http()
        .patch('/user')
        .set('Cookie', cookie)
        .send({ oldPassword: PASSWORD, newPassword: NEW_PASSWORD })
        .expect(204);

      const res = await http().get('/user').set('Cookie', cookie).expect(200);
      expect(res.body.email).toBe(email);
    });

    it.each([
      ['body is empty', {}],
      ['oldPassword is missing', { newPassword: NEW_PASSWORD }],
      ['newPassword is missing', { oldPassword: PASSWORD }],
      ['oldPassword is empty', { oldPassword: '', newPassword: NEW_PASSWORD }],
      ['newPassword is empty', { oldPassword: PASSWORD, newPassword: '' }],
    ])('returns 400 when %s', async (_name, body) => {
      const { email, cookie } = await createUser();

      await http().patch('/user').set('Cookie', cookie).send(body).expect(400);

      await http()
        .post('/auth/login')
        .send({ email, password: PASSWORD })
        .expect(200);
    });
  });
});
