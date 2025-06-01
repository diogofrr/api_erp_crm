import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus } from '@prisma/client';
import * as crypto from 'crypto';
import { ResponseDto } from 'src/dto/response.dto';
import { IncomingHttpHeaders } from 'http2';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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

  async findAll(page = 1, limit = 10): Promise<ResponseDto> {
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        skip,
        take: limit,
        include: {
          EventTicket: {
            include: {
              event: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.ticket.count(),
    ]);

    return new ResponseDto('Tickets encontrados com sucesso', {
      data: tickets,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  async findByEventId(eventId: string): Promise<ResponseDto> {
    if (!eventId) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        EventTicket: {
          some: {
            eventId,
          },
        },
      },
      include: {
        EventTicket: {
          include: {
            event: true,
          },
        },
      },
    });

    return new ResponseDto('Ingressos encontrados com sucesso', tickets);
  }

  async findOne(id: string): Promise<ResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        EventTicket: {
          include: {
            event: true,
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
    if (!headers.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const token = headers.authorization.replace('Bearer ', '');
    const decodedToken = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const event = await this.prisma.event.findUnique({
      where: { id: createTicketDto.eventId },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

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
      include: {
        EventTicket: {
          include: {
            event: true,
          },
        },
      },
    });

    return new ResponseDto('Ingresso criado com sucesso', ticket);
  }

  async update(
    id: string,
    updateTicketDto: UpdateTicketDto,
  ): Promise<ResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
      include: {
        EventTicket: {
          include: {
            event: true,
          },
        },
      },
    });

    return new ResponseDto('Ingresso atualizado com sucesso', updatedTicket);
  }

  async remove(id: string): Promise<ResponseDto> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    await this.prisma.ticket.delete({
      where: { id },
    });

    return new ResponseDto('Ingresso removido com sucesso', null);
  }

  async search(query: string): Promise<ResponseDto> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        OR: [{ cpf: { contains: query } }, { fullName: { contains: query } }],
      },
      include: {
        EventTicket: {
          include: {
            event: true,
          },
        },
      },
    });

    if (tickets.length === 0) {
      throw new HttpException(
        'Nenhum ingresso encontrado',
        HttpStatus.NOT_FOUND,
      );
    }

    return new ResponseDto('Ingressos encontrados com sucesso', tickets);
  }

  async confirmEntry(
    eventId: string,
    ticketId: string,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    if (!headers.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const token = headers.authorization.replace('Bearer ', '');
    const decodedToken = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const eventTicket = await this.prisma.eventTicket.findFirst({
      where: {
        eventId,
        ticketId,
      },
    });

    if (!eventTicket) {
      throw new HttpException('Ingresso não encontrado', HttpStatus.NOT_FOUND);
    }

    if (eventTicket.status === TicketStatus.CONFIRMED) {
      throw new HttpException('Ingresso já confirmado', HttpStatus.BAD_REQUEST);
    }

    if (eventTicket.status === TicketStatus.CANCELED) {
      throw new HttpException('Ingresso cancelado', HttpStatus.BAD_REQUEST);
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
        'Erro ao atualizar o ingresso. Verifique se o cadastro foi feito por você.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return new ResponseDto(
      'Ingresso confirmado com sucesso',
      updatedEventTicket,
    );
  }
}
