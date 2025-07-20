import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Event, EventStatus } from '@prisma/client';
import { IncomingHttpHeaders } from 'http2';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateEventDto } from './dto/create-event.dto';
import { FindAllEventsDto } from './dto/find-all-events.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  private async verifyIsValidEventById(id: string): Promise<Event> {
    if (!id) {
      throw new HttpException('ID não fornecido', HttpStatus.BAD_REQUEST);
    }

    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

    return event;
  }

  async createEvent(
    createEventDto: CreateEventDto,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    const decodedToken = this.authService.decodeToken(headers);

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const eventDate = new Date(createEventDto.date);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < now) {
      throw new HttpException(
        'A data do evento não pode ser no passado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const startTime = new Date(createEventDto.startTime);
    const endTime = new Date(createEventDto.endTime);

    if (startTime >= endTime) {
      throw new HttpException(
        'O horário de início deve ser anterior ao horário de término',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (createEventDto.totalTickets <= 0) {
      throw new HttpException(
        'O número total de ingressos deve ser maior que zero',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (createEventDto.price < 0) {
      throw new HttpException(
        'O preço do evento não pode ser negativo',
        HttpStatus.BAD_REQUEST,
      );
    }

    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        status: EventStatus.PENDING,
        createdById: decodedToken.sub,
      },
    });

    if (!event) {
      throw new HttpException('Erro ao criar evento', HttpStatus.BAD_REQUEST);
    }

    return new ResponseDto('Evento criado com sucesso', event);
  }

  async findAllEvents(
    findAllEventsDto: FindAllEventsDto,
  ): Promise<ResponseDto> {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      startDate,
      endDate,
    } = findAllEventsDto;

    const filteredSearch = search.trim();
    const skip = (page - 1) * limit;

    const whereClause: {
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' };
        description?: { contains: string; mode: 'insensitive' };
        location?: { contains: string; mode: 'insensitive' };
      }>;
      status?: EventStatus;
      date?: { gte?: Date; lte?: Date };
    } = {};

    if (filteredSearch) {
      whereClause.OR = [
        {
          name: {
            contains: filteredSearch,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filteredSearch,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: filteredSearch,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (status) {
      whereClause.status = status;
    }

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = startDate;
      }
      if (endDate) {
        whereClause.date.lte = endDate;
      }
    }

    const total = await this.prisma.event.count({
      where: whereClause,
    });

    const events = await this.prisma.event.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            EventTicket: {
              where: {
                status: { not: 'CANCELED' },
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const formattedEvents = events.map(event => {
      const { _count, ...eventData } = event;
      return {
        ...eventData,
        ticketsSold: _count.EventTicket,
        ticketsRemaining: event.totalTickets - _count.EventTicket,
      };
    });

    return new ResponseDto('Eventos encontrados com sucesso', {
      data: formattedEvents,
      meta: {
        query: filteredSearch,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        status,
        dateRange: { startDate, endDate },
      },
    });
  }

  async findEventById(id: string): Promise<ResponseDto> {
    const event = await this.verifyIsValidEventById(id);

    return new ResponseDto('Evento encontrado com sucesso', event);
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<ResponseDto> {
    const event = await this.verifyIsValidEventById(id);

    const now = new Date();
    const eventStartTime = new Date(event.startTime);

    if (now >= eventStartTime && event.status === EventStatus.ACTIVE) {
      throw new HttpException(
        'Não é possível editar um evento que já está em andamento',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      event.status === EventStatus.CANCELED ||
      event.status === EventStatus.COMPLETED
    ) {
      throw new HttpException(
        'Não é possível editar um evento cancelado ou finalizado',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (updateEventDto.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newEventDate = new Date(updateEventDto.date);
      newEventDate.setHours(0, 0, 0, 0);

      if (newEventDate < today) {
        throw new HttpException(
          'A nova data do evento não pode ser no passado',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (updateEventDto.startTime && updateEventDto.endTime) {
      const startTime = new Date(updateEventDto.startTime);
      const endTime = new Date(updateEventDto.endTime);

      if (startTime >= endTime) {
        throw new HttpException(
          'O horário de início deve ser anterior ao horário de término',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (updateEventDto.totalTickets !== undefined) {
      if (updateEventDto.totalTickets <= 0) {
        throw new HttpException(
          'O número total de ingressos deve ser maior que zero',
          HttpStatus.BAD_REQUEST,
        );
      }

      const ticketsSold = await this.prisma.eventTicket.count({
        where: {
          eventId: id,
          status: { not: 'CANCELED' },
        },
      });

      if (updateEventDto.totalTickets < ticketsSold) {
        throw new HttpException(
          `Não é possível reduzir o limite para ${updateEventDto.totalTickets} ingressos. Já foram vendidos ${ticketsSold} ingressos`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (updateEventDto.price !== undefined && updateEventDto.price < 0) {
      throw new HttpException(
        'O preço do evento não pode ser negativo',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: updateEventDto,
    });

    if (!updatedEvent) {
      throw new HttpException(
        'Erro ao atualizar evento',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new ResponseDto('Evento atualizado com sucesso', updatedEvent);
  }

  async updateEventStatus(
    id: string,
    updateEventStatusDto: UpdateEventStatusDto,
  ): Promise<ResponseDto> {
    const event = await this.verifyIsValidEventById(id);
    const { status: newStatus } = updateEventStatusDto;

    if (event.status === newStatus) {
      throw new HttpException(
        `O evento já está com o status ${newStatus}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    switch (event.status) {
      case EventStatus.PENDING:
        if (
          newStatus !== EventStatus.ACTIVE &&
          newStatus !== EventStatus.CANCELED
        ) {
          throw new HttpException(
            'Um evento pendente só pode ser ativado ou cancelado',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case EventStatus.ACTIVE:
        if (
          newStatus !== EventStatus.COMPLETED &&
          newStatus !== EventStatus.CANCELED
        ) {
          throw new HttpException(
            'Um evento ativo só pode ser finalizado ou cancelado',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case EventStatus.CANCELED:
        throw new HttpException(
          'Um evento cancelado não pode ter seu status alterado',
          HttpStatus.BAD_REQUEST,
        );

      case EventStatus.COMPLETED:
        throw new HttpException(
          'Um evento finalizado não pode ter seu status alterado',
          HttpStatus.BAD_REQUEST,
        );
    }

    if (newStatus === EventStatus.ACTIVE) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (eventDate < today) {
        throw new HttpException(
          'Não é possível ativar um evento cuja data já passou',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (newStatus === EventStatus.COMPLETED) {
      const now = new Date();
      const eventEndTime = new Date(event.endTime);

      if (now < eventEndTime) {
        throw new HttpException(
          'Só é possível finalizar um evento após seu horário de término',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updatedEvent = await this.prisma.event.update({
      where: { id },
      data: { status: newStatus },
    });

    if (!updatedEvent) {
      throw new HttpException(
        'Erro ao atualizar status do evento',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new ResponseDto(
      `Status do evento atualizado para ${newStatus} com sucesso`,
      updatedEvent,
    );
  }

  async deleteEvent(id: string): Promise<ResponseDto> {
    this.authService.verifyIsDevelopmentMode();
    await this.verifyIsValidEventById(id);

    const deletedEvent = await this.prisma.$transaction(async prisma => {
      await prisma.eventTicket.deleteMany({
        where: { eventId: id },
      });

      return prisma.event.delete({
        where: { id },
      });
    });

    if (!deletedEvent) {
      throw new HttpException('Erro ao deletar evento', HttpStatus.BAD_REQUEST);
    }

    return new ResponseDto('Evento deletado com sucesso', null);
  }
}
