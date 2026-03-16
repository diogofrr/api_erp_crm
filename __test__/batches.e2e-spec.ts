import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import {
  MockJwtAuthGuard,
  MockRolesGuard,
  createMockUserWithRole,
} from './test-setup';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/modules/auth/guards/roles.guard';

describe('Batches (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockJwtGuard: MockJwtAuthGuard;
  let eventId: string;

  const createSoldTickets = async (count: number) => {
    const user = await prisma.user.findFirstOrThrow();

    for (let i = 0; i < count; i++) {
      const ticket = await prisma.ticket.create({
        data: {
          fullName: `Pessoa ${i + 1}`,
          email: `pessoa${i + 1}@email.com`,
          phone: `1199999000${i}`,
          birthDate: new Date('1990-01-01'),
          cpf: `1234567890${i}`,
        },
      });

      await prisma.eventTicket.create({
        data: {
          eventId,
          ticketId: ticket.id,
          userId: user.id,
          qrCode: `qr-${i}-${Date.now()}`,
          status: 'PENDING',
        },
      });
    }
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(RolesGuard)
      .useValue(new MockRolesGuard(new Reflector()))
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    mockJwtGuard = moduleFixture.get(JwtAuthGuard) as MockJwtAuthGuard;
    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.batch.deleteMany();
    await prisma.eventTicket.deleteMany();
    await prisma.ticket.deleteMany();
    await prisma.event.deleteMany();
    await prisma.authToken.deleteMany();
    await prisma.profile.deleteMany();
    await prisma.user.deleteMany();

    const mockUser = createMockUserWithRole(UserRole.ADMIN);
    mockJwtGuard.setUser(mockUser);

    const user = await prisma.user.create({
      data: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        password: mockUser.password,
        isActive: mockUser.isActive,
      },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startTime = new Date(tomorrow);
    startTime.setHours(19, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(23, 0, 0, 0);

    const event = await prisma.event.create({
      data: {
        name: 'Evento Teste',
        description: 'Descrição do evento',
        date: tomorrow,
        startTime,
        endTime,
        location: 'Local Teste',
        price: 50.0,
        totalTickets: 100,
        status: 'PENDING',
        createdById: user.id,
      },
    });

    eventId = event.id;
  });

  describe('POST /events/:eventId/batches', () => {
    it('should create regular batches successfully', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);
      endDate.setHours(23, 59, 59, 999);

      const secondStartDate = new Date(endDate);
      secondStartDate.setDate(secondStartDate.getDate() + 1);
      secondStartDate.setHours(0, 0, 0, 0);
      const secondEndDate = new Date(secondStartDate);
      secondEndDate.setDate(secondEndDate.getDate() + 10);
      secondEndDate.setHours(23, 59, 59, 999);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 40,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          {
            name: '2º Lote',
            type: 'REGULAR',
            price: 20.0,
            maxTickets: 60,
            startDate: secondStartDate.toISOString(),
            endDate: secondEndDate.toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('Lotes criados com sucesso');
          expect(res.body.result).toHaveLength(2);
          expect(res.body.result[0].name).toBe('1º Lote');
          expect(res.body.result[0].type).toBe('REGULAR');
          expect(res.body.result[0].price).toBe(15.0);
        });
    });

    it('should create promotional batch successfully', () => {
      const createBatchesDto = {
        batches: [
          {
            name: 'Lote Promocional',
            type: 'PROMOTIONAL',
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(201)
        .expect(res => {
          expect(res.body.message).toBe('Lotes criados com sucesso');
          expect(res.body.result).toHaveLength(1);
          expect(res.body.result[0].name).toBe('Lote Promocional');
          expect(res.body.result[0].type).toBe('PROMOTIONAL');
          expect(res.body.result[0].price).toBeNull();
        });
    });

    it('should fail when event does not exist', () => {
      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 50,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post('/events/non-existent-id/batches')
        .send(createBatchesDto)
        .expect(404)
        .expect(res => {
          expect(res.body.message).toBe('Evento não encontrado');
        });
    });

    it('should fail with missing required fields for REGULAR batch', () => {
      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400);
    });

    it('should fail with negative price', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: -10.0,
            maxTickets: 50,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('price não pode ser negativo');
        });
    });

    it('should fail with startDate >= endDate', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 50,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('startDate deve ser anterior a endDate');
        });
    });

    it('should fail with overlapping date ranges', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);
      endDate.setHours(23, 59, 59, 999);

      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Existente',
          type: 'REGULAR',
          price: 10.0,
          maxTickets: 30,
          startDate,
          endDate,
        },
      });

      const overlappingStartDate = new Date(startDate);
      overlappingStartDate.setDate(overlappingStartDate.getDate() + 5);
      const overlappingEndDate = new Date(endDate);
      overlappingEndDate.setDate(overlappingEndDate.getDate() + 5);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 30,
            startDate: overlappingStartDate.toISOString(),
            endDate: overlappingEndDate.toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('sobrepõe período');
        });
    });

    it('should fail with duplicate batch names', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 15);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 40,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 20.0,
            maxTickets: 40,
            startDate: new Date(endDate.getTime() + 86400000).toISOString(),
            endDate: new Date(endDate.getTime() + 86400000 * 10).toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('nomes de lotes duplicados');
        });
    });

    it('should fail with more than one PROMOTIONAL batch', () => {
      const createBatchesDto = {
        batches: [
          {
            name: 'Lote Promocional',
            type: 'PROMOTIONAL',
          },
          {
            name: 'Lote Promocional 2',
            type: 'PROMOTIONAL',
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'Apenas um Lote PROMOTIONAL pode ser criado por requisição',
          );
        });
    });

    it('should fail when PROMOTIONAL batch already exists', async () => {
      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Promocional',
          type: 'PROMOTIONAL',
          maxTickets: 0,
        },
      });

      const createBatchesDto = {
        batches: [
          {
            name: 'Lote Promocional',
            type: 'PROMOTIONAL',
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'Já existe um Lote PROMOTIONAL para este evento',
          );
        });
    });

    it('should fail with endDate in the past', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 10);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 5);

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 50,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain('não pode estar totalmente no passado');
        });
    });

    it('should fail without ADMIN or EVENT_MANAGER role', () => {
      mockJwtGuard.setUser(createMockUserWithRole(UserRole.USER));

      const createBatchesDto = {
        batches: [
          {
            name: '1º Lote',
            type: 'REGULAR',
            price: 15.0,
            maxTickets: 50,
            startDate: new Date().toISOString(),
            endDate: new Date().toISOString(),
          },
        ],
      };

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send(createBatchesDto)
        .expect(403);
    });

    it('should fail when regular maxTickets sum exceeds event totalTickets', () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const secondStart = new Date(endDate);
      secondStart.setDate(secondStart.getDate() + 1);
      const secondEnd = new Date(secondStart);
      secondEnd.setDate(secondEnd.getDate() + 2);

      return request(app.getHttpServer())
        .post(`/events/${eventId}/batches`)
        .send({
          batches: [
            {
              name: 'Lote 1',
              type: 'REGULAR',
              price: 10,
              maxTickets: 60,
              startDate: startDate.toISOString(),
              endDate: endDate.toISOString(),
            },
            {
              name: 'Lote 2',
              type: 'REGULAR',
              price: 15,
              maxTickets: 60,
              startDate: secondStart.toISOString(),
              endDate: secondEnd.toISOString(),
            },
          ],
        })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'A soma de maxTickets dos lotes REGULAR',
          );
        });
    });
  });

  describe('PATCH /events/:eventId/batches/:batchId', () => {
    it('should update full data for future batch', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 5);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 3);

      const batch = await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Futuro',
          type: 'REGULAR',
          price: 20,
          maxTickets: 30,
          startDate,
          endDate,
        },
      });

      const newEndDate = new Date(endDate);
      newEndDate.setDate(newEndDate.getDate() + 1);

      await request(app.getHttpServer())
        .patch(`/events/${eventId}/batches/${batch.id}`)
        .send({
          name: 'Lote Futuro Atualizado',
          price: 25,
          maxTickets: 40,
          endDate: newEndDate.toISOString(),
        })
        .expect(200)
        .expect(res => {
          expect(res.body.result.name).toBe('Lote Futuro Atualizado');
          expect(res.body.result.maxTickets).toBe(40);
        });
    });

    it('should allow only reducing endDate on current batch', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);

      const batch = await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Atual',
          type: 'REGULAR',
          price: 20,
          maxTickets: 30,
          startDate,
          endDate,
        },
      });

      await request(app.getHttpServer())
        .patch(`/events/${eventId}/batches/${batch.id}`)
        .send({ price: 22 })
        .expect(400)
        .expect(res => {
          expect(res.body.message).toContain(
            'Para lote vigente, apenas endDate pode ser alterado',
          );
        });
    });
  });

  describe('GET /events/:eventId/batches/available', () => {
    it('should return available regular batches', async () => {
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 10);

      await prisma.batch.create({
        data: {
          eventId,
          name: '1º Lote',
          type: 'REGULAR',
          price: 15.0,
          maxTickets: 50,
          startDate,
          endDate,
        },
      });

      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.message).toBe('Lotes disponíveis encontrados com sucesso');
          expect(res.body.result).toHaveLength(2);
          expect(res.body.result[0].name).toBe('1º Lote');
          expect(res.body.result[0].isVirtual).toBe(false);
          expect(res.body.result[1].name).toBe('Lote Promocional');
          expect(res.body.result[1].isVirtual).toBe(true);
        });
    });

    it('should return promotional batch if exists', async () => {
      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Promocional',
          type: 'PROMOTIONAL',
          maxTickets: 0,
        },
      });

      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result).toHaveLength(1);
          expect(res.body.result[0].name).toBe('Lote Promocional');
          expect(res.body.result[0].isVirtual).toBe(false);
        });
    });

    it('should return virtual promotional batch if not exists', () => {
      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result).toHaveLength(1);
          expect(res.body.result[0].name).toBe('Lote Promocional');
          expect(res.body.result[0].isVirtual).toBe(true);
          expect(res.body.result[0].price).toBeNull();
        });
    });

    it('should filter out expired batches', async () => {
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 20);
      const pastEnd = new Date();
      pastEnd.setDate(pastEnd.getDate() - 10);

      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Expirado',
          type: 'REGULAR',
          price: 10.0,
          maxTickets: 20,
          startDate: pastStart,
          endDate: pastEnd,
        },
      });

      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 5);
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 10);

      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Ativo',
          type: 'REGULAR',
          price: 15.0,
          maxTickets: 40,
          startDate,
          endDate,
        },
      });

      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result).toHaveLength(2);
          expect(res.body.result[0].name).toBe('Lote Ativo');
          expect(res.body.result.some((b: any) => b.name === 'Lote Expirado')).toBe(false);
        });
    });

    it('should filter out future batches', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 10);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 20);

      await prisma.batch.create({
        data: {
          eventId,
          name: 'Lote Futuro',
          type: 'REGULAR',
          price: 20.0,
          maxTickets: 50,
          startDate: futureStart,
          endDate: futureEnd,
        },
      });

      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result).toHaveLength(1);
          expect(res.body.result[0].name).toBe('Lote Promocional');
          expect(res.body.result[0].isVirtual).toBe(true);
        });
    });

    it('should fail when event does not exist', () => {
      return request(app.getHttpServer())
        .get('/events/non-existent-id/batches/available')
        .expect(404)
        .expect(res => {
          expect(res.body.message).toBe('Evento não encontrado');
        });
    });

    it('should work with USER role', () => {
      mockJwtGuard.setUser(createMockUserWithRole(UserRole.USER));

      return request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200);
    });

    it('should move automatically to next batch when current sells out', async () => {
      const now = new Date();
      const firstStart = new Date(now);
      firstStart.setDate(firstStart.getDate() - 2);
      const firstEnd = new Date(now);
      firstEnd.setDate(firstEnd.getDate() + 5);

      const secondStart = new Date(now);
      secondStart.setDate(secondStart.getDate() + 5);
      const secondEnd = new Date(secondStart);
      secondEnd.setDate(secondEnd.getDate() + 5);

      await prisma.batch.createMany({
        data: [
          {
            eventId,
            name: '1º Lote',
            type: 'REGULAR',
            price: 10,
            maxTickets: 2,
            startDate: firstStart,
            endDate: firstEnd,
          },
          {
            eventId,
            name: '2º Lote',
            type: 'REGULAR',
            price: 15,
            maxTickets: 10,
            startDate: secondStart,
            endDate: secondEnd,
          },
        ],
      });

      await createSoldTickets(2);

      await request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result[0].name).toBe('2º Lote');
        });
    });

    it('should carry remaining tickets to next batch when previous expires', async () => {
      const now = new Date();
      const firstStart = new Date(now);
      firstStart.setDate(firstStart.getDate() - 10);
      const firstEnd = new Date(now);
      firstEnd.setDate(firstEnd.getDate() - 1);

      const secondStart = new Date(now);
      secondStart.setDate(secondStart.getDate() + 5);
      const secondEnd = new Date(secondStart);
      secondEnd.setDate(secondEnd.getDate() + 5);

      await prisma.batch.createMany({
        data: [
          {
            eventId,
            name: '1º Lote',
            type: 'REGULAR',
            price: 10,
            maxTickets: 5,
            startDate: firstStart,
            endDate: firstEnd,
          },
          {
            eventId,
            name: '2º Lote',
            type: 'REGULAR',
            price: 15,
            maxTickets: 5,
            startDate: secondStart,
            endDate: secondEnd,
          },
        ],
      });

      await createSoldTickets(1);

      await request(app.getHttpServer())
        .get(`/events/${eventId}/batches/available`)
        .expect(200)
        .expect(res => {
          expect(res.body.result[0].name).toBe('2º Lote');
        });
    });
  });
});
