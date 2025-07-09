import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';

describe('Events (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

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

    // Criar usuário e fazer login para obter token
    const registerDto = {
      name: 'João Silva',
      email: 'joao@teste.com',
      password: 'senha123456',
    };

    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto);

    userId = registerResponse.body.data.id;

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'joao@teste.com',
        password: 'senha123456',
      });

    accessToken = loginResponse.body.data.access_token;
  });

  describe('/events (POST)', () => {
    it('should create a new event successfully', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startTime = new Date(tomorrow);
      startTime.setHours(19, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(23, 0, 0, 0);

      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: tomorrow.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 1000,
        price: 89.9,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('Evento criado com sucesso');
          expect(res.body.data).toHaveProperty('id');
          expect(res.body.data.name).toBe(createEventDto.name);
          expect(res.body.data.status).toBe('PENDING');
          expect(res.body.data.createdById).toBe(userId);
        });
    });

    it('should fail with date in the past', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: yesterday.toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 1000,
        price: 89.9,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'A data do evento não pode ser no passado',
          );
        });
    });

    it('should fail with invalid time range', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const startTime = new Date(tomorrow);
      startTime.setHours(23, 0, 0, 0);

      const endTime = new Date(tomorrow);
      endTime.setHours(19, 0, 0, 0); // Antes do startTime

      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: tomorrow.toISOString(),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 1000,
        price: 89.9,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'O horário de início deve ser anterior ao horário de término',
          );
        });
    });

    it('should fail with negative price', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: tomorrow.toISOString(),
        startTime: new Date(tomorrow).toISOString(),
        endTime: new Date(tomorrow).toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 1000,
        price: -10,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'O preço do evento não pode ser negativo',
          );
        });
    });

    it('should fail with zero total tickets', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: tomorrow.toISOString(),
        startTime: new Date(tomorrow).toISOString(),
        endTime: new Date(tomorrow).toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 0,
        price: 89.9,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'O número total de ingressos deve ser maior que zero',
          );
        });
    });

    it('should fail without authentication', () => {
      const createEventDto = {
        name: 'Show de Rock',
        description: 'Grande show de rock nacional',
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        location: 'Arena São Paulo',
        totalTickets: 1000,
        price: 89.9,
      };

      return request(app.getHttpServer())
        .post('/events')
        .send(createEventDto)
        .expect(401);
    });
  });

  describe('/events (GET)', () => {
    beforeEach(async () => {
      // Criar alguns eventos para testes
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const events = [
        {
          name: 'Show de Rock',
          description: 'Grande show de rock nacional',
          date: tomorrow,
          startTime: new Date(tomorrow.getTime() + 3600000), // +1 hora
          endTime: new Date(tomorrow.getTime() + 7200000), // +2 horas
          location: 'Arena São Paulo',
          totalTickets: 1000,
          price: 89.9,
          status: 'PENDING' as const,
          createdById: userId,
        },
        {
          name: 'Festival de Jazz',
          description: 'Festival internacional de jazz',
          date: new Date(tomorrow.getTime() + 86400000), // +1 dia
          startTime: new Date(tomorrow.getTime() + 86400000 + 3600000),
          endTime: new Date(tomorrow.getTime() + 86400000 + 7200000),
          location: 'Teatro Municipal',
          totalTickets: 500,
          price: 120.0,
          status: 'ACTIVE' as const,
          createdById: userId,
        },
      ];

      for (const event of events) {
        await prisma.event.create({ data: event });
      }
    });

    it('should list all events with default pagination', () => {
      return request(app.getHttpServer())
        .get('/events')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Eventos encontrados com sucesso');
          expect(res.body.data.data).toHaveLength(2);
          expect(res.body.data.meta.total).toBe(2);
          expect(res.body.data.meta.page).toBe(1);
          expect(res.body.data.meta.limit).toBe(10);
        });
    });

    it('should filter events by search term', () => {
      return request(app.getHttpServer())
        .get('/events?search=rock')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.data.data).toHaveLength(1);
          expect(res.body.data.data[0].name).toContain('Rock');
        });
    });

    it('should filter events by status', () => {
      return request(app.getHttpServer())
        .get('/events?status=ACTIVE')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.data.data).toHaveLength(1);
          expect(res.body.data.data[0].status).toBe('ACTIVE');
        });
    });

    it('should paginate events correctly', () => {
      return request(app.getHttpServer())
        .get('/events?page=1&limit=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.data.data).toHaveLength(1);
          expect(res.body.data.meta.page).toBe(1);
          expect(res.body.data.meta.limit).toBe(1);
          expect(res.body.data.meta.totalPages).toBe(2);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get('/events').expect(401);
    });
  });

  describe('/events/:id (GET)', () => {
    let eventId: string;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const event = await prisma.event.create({
        data: {
          name: 'Show de Rock',
          description: 'Grande show de rock nacional',
          date: tomorrow,
          startTime: new Date(tomorrow.getTime() + 3600000),
          endTime: new Date(tomorrow.getTime() + 7200000),
          location: 'Arena São Paulo',
          totalTickets: 1000,
          price: 89.9,
          status: 'PENDING',
          createdById: userId,
        },
      });

      eventId = event.id;
    });

    it('should get event by id successfully', () => {
      return request(app.getHttpServer())
        .get(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Evento encontrado com sucesso');
          expect(res.body.data.id).toBe(eventId);
          expect(res.body.data.name).toBe('Show de Rock');
        });
    });

    it('should fail with non-existent event id', () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      return request(app.getHttpServer())
        .get(`/events/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect(res => {
          expect(res.body.message).toContain('Evento não encontrado');
        });
    });

    it('should fail with invalid uuid format', () => {
      return request(app.getHttpServer())
        .get('/events/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer()).get(`/events/${eventId}`).expect(401);
    });
  });

  describe('/events/:id (PATCH)', () => {
    let eventId: string;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const event = await prisma.event.create({
        data: {
          name: 'Show de Rock',
          description: 'Grande show de rock nacional',
          date: tomorrow,
          startTime: new Date(tomorrow.getTime() + 3600000),
          endTime: new Date(tomorrow.getTime() + 7200000),
          location: 'Arena São Paulo',
          totalTickets: 1000,
          price: 89.9,
          status: 'PENDING',
          createdById: userId,
        },
      });

      eventId = event.id;
    });

    it('should update event successfully', () => {
      const updateEventDto = {
        name: 'Show de Rock Atualizado',
        description: 'Descrição atualizada',
        price: 99.9,
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateEventDto)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Evento atualizado com sucesso');
          expect(res.body.data.name).toBe(updateEventDto.name);
          expect(res.body.data.description).toBe(updateEventDto.description);
          expect(res.body.data.price).toBe(updateEventDto.price);
        });
    });

    it('should fail to update cancelled event', async () => {
      // Cancelar o evento primeiro
      await prisma.event.update({
        where: { id: eventId },
        data: { status: 'CANCELED' },
      });

      const updateEventDto = {
        name: 'Tentativa de Atualização',
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'Não é possível editar um evento cancelado ou finalizado',
          );
        });
    });

    it('should fail to reduce total tickets below sold tickets', async () => {
      // Criar um ticket vendido
      const ticket = await prisma.ticket.create({
        data: {
          fullName: 'João Silva',
          email: 'joao@teste.com',
          phone: '11999999999',
          birthDate: new Date('1990-01-01'),
          cpf: '12345678901',
        },
      });

      await prisma.eventTicket.create({
        data: {
          eventId,
          ticketId: ticket.id,
          userId,
          qrCode: 'test-qr-code',
          status: 'PENDING',
        },
      });

      const updateEventDto = {
        totalTickets: 0, // Menor que tickets vendidos
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateEventDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('Não é possível reduzir o limite');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}`)
        .send({ name: 'Novo Nome' })
        .expect(401);
    });
  });

  describe('/events/:id/status (PATCH)', () => {
    let eventId: string;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const event = await prisma.event.create({
        data: {
          name: 'Show de Rock',
          description: 'Grande show de rock nacional',
          date: tomorrow,
          startTime: new Date(tomorrow.getTime() + 3600000),
          endTime: new Date(tomorrow.getTime() + 7200000),
          location: 'Arena São Paulo',
          totalTickets: 1000,
          price: 89.9,
          status: 'PENDING',
          createdById: userId,
        },
      });

      eventId = event.id;
    });

    it('should update event status from PENDING to ACTIVE', () => {
      const updateStatusDto = {
        status: 'ACTIVE',
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateStatusDto)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toContain(
            'Status do evento atualizado para ACTIVE com sucesso',
          );
        });
    });

    it('should update event status from PENDING to CANCELED', () => {
      const updateStatusDto = {
        status: 'CANCELED',
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateStatusDto)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toContain(
            'Status do evento atualizado para CANCELED com sucesso',
          );
        });
    });

    it('should fail to change status to same value', () => {
      const updateStatusDto = {
        status: 'PENDING', // Mesmo status atual
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateStatusDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'O evento já está com o status PENDING',
          );
        });
    });

    it('should fail to activate event with past date', async () => {
      // Atualizar evento para ter data no passado
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await prisma.event.update({
        where: { id: eventId },
        data: { date: yesterday },
      });

      const updateStatusDto = {
        status: 'ACTIVE',
      };

      return request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateStatusDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'Não é possível ativar um evento cuja data já passou',
          );
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/events/${eventId}/status`)
        .send({ status: 'ACTIVE' })
        .expect(401);
    });
  });

  describe('/events/:id (DELETE)', () => {
    let eventId: string;

    beforeEach(async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const event = await prisma.event.create({
        data: {
          name: 'Show de Rock',
          description: 'Grande show de rock nacional',
          date: tomorrow,
          startTime: new Date(tomorrow.getTime() + 3600000),
          endTime: new Date(tomorrow.getTime() + 7200000),
          location: 'Arena São Paulo',
          totalTickets: 1000,
          price: 89.9,
          status: 'PENDING',
          createdById: userId,
        },
      });

      eventId = event.id;
    });

    it('should delete event successfully in development mode', () => {
      // Assumindo que o ambiente é development
      return request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Evento deletado com sucesso');
        });
    });

    it('should fail with non-existent event id', () => {
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440000';

      return request(app.getHttpServer())
        .delete(`/events/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect(res => {
          expect(res.body.message).toContain('Evento não encontrado');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/events/${eventId}`)
        .expect(401);
    });
  });
});
