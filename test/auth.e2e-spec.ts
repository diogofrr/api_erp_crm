import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  beforeEach(async () => {
    // Limpa o banco de dados antes de cada teste
    await prisma.authToken.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.authToken.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('deve registrar um novo usuário', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.result).toHaveProperty('id');
          expect(res.body.result.email).toBe('test@example.com');
          expect(res.body.result.name).toBe('Test User');
        });
    });

    it('deve retornar erro ao tentar registrar com email já existente', async () => {
      // Primeiro registro
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      // Tentativa de registro com mesmo email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toBe('Usuário já existe');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Cria um usuário para os testes de login
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
        },
      });
    });

    it('deve fazer login com sucesso', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect(res => {
          expect(res.body.result).toHaveProperty('access_token');
          expect(res.body.result.user).toHaveProperty('id');
          expect(res.body.result.user.email).toBe('test@example.com');
        });
    });

    it('deve retornar erro com credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect(res => {
          expect(res.body.message).toBe('Credenciais inválidas');
        });
    });
  });

  describe('/auth/logout (POST)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Cria um usuário e faz login
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = loginResponse.body.result.access_token;
    });

    it('deve fazer logout com sucesso', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('Logout realizado com sucesso');
        });
    });

    it('deve retornar erro ao tentar fazer logout sem token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('/auth/refresh (GET)', () => {
    let authToken: string;

    beforeEach(async () => {
      // Cria um usuário e faz login
      const hashedPassword = await bcrypt.hash('password123', 10);
      await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
        },
      });

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = loginResponse.body.result.access_token;
    });

    it('deve renovar o token com sucesso', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.result).toHaveProperty('access_token');
          expect(res.body.result.access_token).not.toBe(authToken);
        });
    });

    it('deve retornar erro ao tentar renovar token inválido', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
