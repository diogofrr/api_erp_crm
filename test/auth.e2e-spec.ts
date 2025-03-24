/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

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
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body.name).toBe('Test User');
          expect(res.body.password).toBe('');
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
          password: 'password456',
          name: 'Another User',
        })
        .expect(400);
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
          expect(res.body.result).toHaveProperty('user');
          expect(res.body.result.user.email).toBe('test@example.com');
          authToken = res.body.result.access_token;
        });
    });

    it('deve retornar erro com credenciais inválidas', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong_password',
        })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    beforeEach(async () => {
      // Faz login e obtém o token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('deve fazer logout com sucesso', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('deve retornar erro ao tentar fazer logout sem token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('/auth/refresh (GET)', () => {
    beforeEach(async () => {
      // Faz login e obtém o token
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });
      authToken = response.body.access_token;
    });

    it('deve renovar o token com sucesso', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.access_token).not.toBe(authToken);
        });
    });

    it('deve retornar erro ao tentar renovar token inválido', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });
});
