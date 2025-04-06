import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { AuthService } from '../src/modules/auth/auth.service';
import { CreateTicketDto } from '../src/modules/tickets/dto/create-ticket.dto';

describe('TicketsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    await app.init();

    // Criar um usuário e obter token de autenticação
    const loginResponse = await authService.login({
      email: 'test@example.com',
      password: 'password123',
    });

    authToken = loginResponse.result.access_token;
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  describe('POST /tickets', () => {
    it('should create a new ticket', async () => {
      const createTicketDto: CreateTicketDto = {
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
        birthDate: new Date('1990-01-01'),
        cpf: '12345678900',
        eventId: 'test-event-id', // Você precisará criar um evento primeiro
      };

      const response = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTicketDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.fullName).toBe(createTicketDto.fullName);
    });
  });

  describe('GET /tickets', () => {
    it('should return paginated tickets', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('total');
      expect(response.body.meta).toHaveProperty('page');
      expect(response.body.meta).toHaveProperty('limit');
    });
  });

  describe('GET /tickets/search', () => {
    it('should search tickets by query', async () => {
      const response = await request(app.getHttpServer())
        .get('/tickets/search')
        .query({ query: 'Test User' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /tickets/:id', () => {
    it('should return a specific ticket', async () => {
      // Primeiro, crie um ticket para testar
      const createTicketDto: CreateTicketDto = {
        fullName: 'Test User 2',
        email: 'test2@example.com',
        phone: '1234567891',
        birthDate: new Date('1990-01-01'),
        cpf: '12345678901',
        eventId: 'test-event-id',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTicketDto)
        .expect(201);

      const ticketId = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .get(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(ticketId);
    });
  });

  describe('PATCH /tickets/:id', () => {
    it('should update a ticket', async () => {
      // Primeiro, crie um ticket para testar
      const createTicketDto: CreateTicketDto = {
        fullName: 'Test User 3',
        email: 'test3@example.com',
        phone: '1234567892',
        birthDate: new Date('1990-01-01'),
        cpf: '12345678902',
        eventId: 'test-event-id',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTicketDto)
        .expect(201);

      const ticketId = createResponse.body.id;

      const updateDto = {
        fullName: 'Updated Name',
      };

      const response = await request(app.getHttpServer())
        .patch(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200);

      expect(response.body.fullName).toBe(updateDto.fullName);
    });
  });

  describe('PATCH /tickets/:eventId/:ticketId/confirm', () => {
    it('should confirm ticket entry', async () => {
      // Primeiro, crie um ticket para testar
      const createTicketDto: CreateTicketDto = {
        fullName: 'Test User 4',
        email: 'test4@example.com',
        phone: '1234567893',
        birthDate: new Date('1990-01-01'),
        cpf: '12345678903',
        eventId: 'test-event-id',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTicketDto)
        .expect(201);

      const ticketId = createResponse.body.id;
      const eventId = 'test-event-id';

      const response = await request(app.getHttpServer())
        .patch(`/tickets/${eventId}/${ticketId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe('CONFIRMED');
    });
  });

  describe('DELETE /tickets/:id', () => {
    it('should delete a ticket', async () => {
      // Primeiro, crie um ticket para testar
      const createTicketDto: CreateTicketDto = {
        fullName: 'Test User 5',
        email: 'test5@example.com',
        phone: '1234567894',
        birthDate: new Date('1990-01-01'),
        cpf: '12345678904',
        eventId: 'test-event-id',
      };

      const createResponse = await request(app.getHttpServer())
        .post('/tickets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTicketDto)
        .expect(201);

      const ticketId = createResponse.body.id;

      await request(app.getHttpServer())
        .delete(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verificar se o ticket foi realmente deletado
      await request(app.getHttpServer())
        .get(`/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
