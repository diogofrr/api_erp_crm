import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket, TicketStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { ResponseDto } from 'src/dto/response.dto';
import { IncomingHttpHeaders } from 'http2';
import { FindAllTicketsDto } from './dto/find-all-tickets.dto';
import { AuthService } from '../auth/auth.service';
import { ConfirmEntryDto } from './dto/confirm-entry.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  private generateQRCode(cpf: string): string {
    if (!cpf) {
      throw new Error('CPF is required');
    }

    if (cpf.length !== 11 && cpf.length !== 14) {
      throw new Error('CPF must be 11 digits');
    }

    const cpfWithoutMask = cpf.replace(/\D/g, '');

    const hash = crypto
      .createHash('sha256')
      .update(cpfWithoutMask)
      .digest('hex');

    return hash;
  }

  async verifyIfTicketExists(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    return ticket;
  }

  async verifyIfCpfAlreadyExistsInEvent(
    eventId: string,
    cpf: string,
    excludeTicketId?: string,
  ): Promise<boolean> {
    const existingTicketWithCurrentCpf = await this.prisma.ticket.findFirst({
      where: {
        cpf,
        id: excludeTicketId ? { not: excludeTicketId } : undefined,
        EventTicket: {
          some: {
            eventId,
            status: { not: TicketStatus.CANCELED }, // Não considerar tickets cancelados
          },
        },
      },
    });

    if (existingTicketWithCurrentCpf) {
      throw new HttpException(
        'Já existe um ingresso cadastrado com este CPF para este evento',
        HttpStatus.CONFLICT,
      );
    }

    return true;
  }

  async findAll(findAllTicketsDto: FindAllTicketsDto): Promise<ResponseDto> {
    const { page = 1, limit = 10, search = '', eventId } = findAllTicketsDto;

    const filteredSearch = search.trim();
    const skip = (page - 1) * limit;

    const whereClause = {
      EventTicket: {
        some: {
          eventId,
        },
      },
      OR: filteredSearch
        ? [
            {
              cpf: {
                contains: filteredSearch,
                mode: 'insensitive' as const,
              },
            },
            {
              fullName: {
                contains: filteredSearch,
                mode: 'insensitive' as const,
              },
            },
          ]
        : undefined,
    };

    // Busca total correta
    const total = await this.prisma.ticket.count({
      where: whereClause,
    });

    const tickets = await this.prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        cpf: true,
        EventTicket: {
          where: { eventId },
          select: {
            status: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const formattedTickets = tickets.map(ticket => {
      const { EventTicket, ...ticketValue } = ticket;
      const status = EventTicket[0].status;

      return {
        ...ticketValue,
        status,
      };
    });

    return new ResponseDto('Tickets encontrados com sucesso', {
      data: formattedTickets,
      meta: {
        query: filteredSearch,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findOne(id: string): Promise<ResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        EventTicket: {
          select: {
            status: true,
            qrCode: true,
            event: {
              select: {
                name: true,
                date: true,
                location: true,
                startTime: true,
                endTime: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    return new ResponseDto('Ingresso encontrado com sucesso', ticket);
  }

  async create(
    createTicketDto: CreateTicketDto,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    const decodedToken = this.authService.decodeToken(headers);

    const event = await this.prisma.event.findUnique({
      where: { id: createTicketDto.eventId },
      include: {
        _count: {
          select: {
            EventTicket: {
              where: {
                status: { not: TicketStatus.CANCELED },
              },
            },
          },
        },
      },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

    const ticketsVendidos = event._count.EventTicket;
    if (ticketsVendidos >= event.totalTickets) {
      throw new HttpException(
        'Não há mais ingressos disponíveis para este evento',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.verifyIfCpfAlreadyExistsInEvent(
      createTicketDto.eventId,
      createTicketDto.cpf,
    );

    const { eventId, ...ticketData } = createTicketDto;

    const ticket = await this.prisma.ticket.create({
      data: {
        ...ticketData,
        EventTicket: {
          create: {
            eventId,
            qrCode: this.generateQRCode(createTicketDto.cpf),
            status: TicketStatus.PENDING,
            userId: decodedToken.sub,
          },
        },
      },
    });

    if (!ticket) {
      throw new HttpException(
        'Erro ao criar o ingresso. Verifique os dados fornecidos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new ResponseDto('Ingresso criado com sucesso', null);
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<ResponseDto> {
    await this.verifyIfTicketExists(id);

    if (updateTicketDto.cpf) {
      await this.verifyIfCpfAlreadyExistsInEvent(
        updateTicketDto.eventId,
        updateTicketDto.cpf,
        id, // Excluir o ticket atual da verificação
      );
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        EventTicket: {
          select: {
            status: true,
          },
        },
      },
    });

    if (!updatedTicket) {
      throw new HttpException(
        'Erro ao atualizar o ingresso',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new ResponseDto('Ingresso atualizado com sucesso', null);
  }

  async remove(id: string): Promise<ResponseDto> {
    this.authService.verifyIsDevelopmentMode();
    await this.verifyIfTicketExists(id);

    await this.prisma.ticket.delete({
      where: { id },
    });

    return new ResponseDto('Ingresso removido com sucesso', null);
  }

  async confirmEntry(
    confirmEntryDto: ConfirmEntryDto,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    const now = new Date();

    const decodedToken = this.authService.decodeToken(headers);
    const { eventId, ticketId } = confirmEntryDto;

    const eventTicket = await this.prisma.eventTicket.findFirst({
      where: {
        eventId,
        ticketId,
      },
      include: {
        event: true,
      },
    });

    if (!eventTicket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    const ticketIsNotPending = eventTicket.status !== TicketStatus.PENDING;

    if (ticketIsNotPending) {
      throw new HttpException(
        'Ingresso já foi confirmado ou está cancelado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const eventDate = new Date(eventTicket.event.date);
    const eventStartTime = new Date(eventTicket.event.startTime);
    const eventEndTime = new Date(eventTicket.event.endTime);

    const isEventDay =
      now.getDate() === eventDate.getDate() &&
      now.getMonth() === eventDate.getMonth() &&
      now.getFullYear() === eventDate.getFullYear();

    const isWithinEventTime = now >= eventStartTime && now <= eventEndTime;

    if (!isEventDay) {
      throw new HttpException(
        'A confirmação só pode ser feita no dia do evento',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!isWithinEventTime) {
      throw new HttpException(
        'A confirmação só pode ser feita durante o horário do evento',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedEventTicket = await this.prisma.eventTicket.update({
      where: {
        eventId_ticketId_userId: {
          eventId,
          ticketId,
          userId: decodedToken.sub,
        },
      },
      data: {
        status: TicketStatus.CONFIRMED,
      },
    });

    if (!updatedEventTicket) {
      throw new HttpException(
        'Houve um erro inesperado ao confirmar o ingresso.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new ResponseDto('Ingresso confirmado com sucesso', null);
  }

  async cancelTicket(
    cancelTicketDto: ConfirmEntryDto,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const decodedToken = this.authService.decodeToken(headers);
    const { eventId, ticketId } = cancelTicketDto;

    const eventTicket = await this.prisma.eventTicket.findFirst({
      where: {
        eventId,
        ticketId,
      },
      include: {
        event: true,
      },
    });

    if (!eventTicket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    const ticketIsNotPending = eventTicket.status !== TicketStatus.PENDING;

    if (ticketIsNotPending) {
      throw new HttpException(
        'Ingresso já foi confirmado ou está cancelado',
        HttpStatus.BAD_REQUEST,
      );
    }

    const eventDate = new Date(eventTicket.event.date);
    eventDate.setHours(0, 0, 0, 0);

    const eventIsTodayOrPast = eventDate <= today;

    if (eventIsTodayOrPast) {
      throw new HttpException(
        'Não é possível cancelar o ingresso pois o evento está ocorrendo ou já ocorreu.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updatedEventTicket = await this.prisma.eventTicket.update({
      where: {
        eventId_ticketId_userId: {
          eventId,
          ticketId,
          userId: decodedToken.sub,
        },
      },
      data: {
        status: TicketStatus.CANCELED,
      },
    });

    if (!updatedEventTicket) {
      throw new HttpException(
        'Houve um erro inesperado ao cancelar o ingresso.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new ResponseDto('Ingresso cancelado com sucesso', null);
  }
}
