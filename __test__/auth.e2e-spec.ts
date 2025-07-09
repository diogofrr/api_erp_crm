import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('Auth (e2e)', () => {
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

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Limpar dados do banco antes de cada teste
    await prisma.authToken.deleteMany();
    await prisma.eventTicket.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('Usuário criado com sucesso');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user).toHaveProperty('id');
          expect(res.body.data.user.email).toBe(registerDto.email);
          expect(res.body.data.user.name).toBe(registerDto.name);
          expect(res.body.data.user).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      const registerDto = {
        name: 'João Silva',
        email: 'email-invalido',
        password: 'senha123456',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'email deve ser um endereço de email válido',
          );
        });
    });

    it('should fail with short password', () => {
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: '123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'password deve ter pelo menos 8 caracteres',
          );
        });
    });

    it('should fail with missing required fields', () => {
      const registerDto = {
        email: 'joao@teste.com',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail when email already exists', async () => {
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      // Primeiro registro
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Segundo registro com mesmo email
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409)
        .expect(res => {
          expect(res.body.message).toContain('E-mail já está cadastrado');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    beforeEach(async () => {
      // Criar usuário para testes de login
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);
    });

    it('should login successfully with valid credentials', () => {
      const loginDto = {
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Login realizado com sucesso');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe(loginDto.email);
        });
    });

    it('should fail with invalid email', () => {
      const loginDto = {
        email: 'email-invalido',
        password: 'senha123456',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'email deve ser um endereço de email válido',
          );
        });
    });

    it('should fail with wrong credentials', () => {
      const loginDto = {
        email: 'joao@teste.com',
        password: 'senhaerrada',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401)
        .expect(res => {
          expect(res.body.message).toContain('Credenciais inválidas');
        });
    });

    it('should fail with non-existent user', () => {
      const loginDto = {
        email: 'naoexiste@teste.com',
        password: 'senha123456',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401)
        .expect(res => {
          expect(res.body.message).toContain('Credenciais inválidas');
        });
    });

    it('should fail with missing fields', () => {
      const loginDto = {
        email: 'joao@teste.com',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Registrar e fazer login para obter token
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'joao@teste.com',
          password: 'senha123456',
        });

      accessToken = loginResponse.body.data.access_token;
    });

    it('should logout successfully with valid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Logout realizado com sucesso');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });

  describe('/auth/refresh (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Registrar e fazer login para obter token
      const registerDto = {
        name: 'João Silva',
        email: 'joao@teste.com',
        password: 'senha123456',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'joao@teste.com',
          password: 'senha123456',
        });

      accessToken = loginResponse.body.data.access_token;
    });

    it('should refresh token successfully with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Token renovado com sucesso');
          expect(res.body.data).toHaveProperty('access_token');
          expect(res.body.data).toHaveProperty('user');
        });
    });

    it('should fail without token', () => {
      return request(app.getHttpServer()).get('/auth/refresh').expect(401);
    });

    it('should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/refresh')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });
  });
});
