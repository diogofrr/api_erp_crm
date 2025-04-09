import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { IncomingHttpHeaders } from 'http2';
import { ResponseDto } from 'src/dto/response.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async createEvent(
    createEventDto: CreateEventDto,
    headers: IncomingHttpHeaders,
  ): Promise<ResponseDto> {
    if (!headers.authorization) {
      throw new HttpException('Token não fornecido', HttpStatus.UNAUTHORIZED);
    }

    const token = headers.authorization.replace('Bearer ', '');
    const decodedToken = this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!decodedToken) {
      throw new HttpException('Token inválido', HttpStatus.UNAUTHORIZED);
    }

    const event = await this.prisma.event.create({
      data: {
        ...createEventDto,
        createdById: decodedToken.sub,
      },
    });

    if (!event) {
      throw new HttpException('Erro ao criar evento', HttpStatus.BAD_REQUEST);
    }

    return new ResponseDto(false, 'Evento criado com sucesso', event);
  }

  async findAllEvents(): Promise<ResponseDto> {
    const events = await this.prisma.event.findMany();

    if (!events) {
      throw new HttpException('Nenhum evento encontrado', HttpStatus.NOT_FOUND);
    }

    return new ResponseDto(false, 'Eventos encontrados com sucesso', events);
  }

  async findEventById(id: string): Promise<ResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

    return new ResponseDto(false, 'Evento encontrado com sucesso', event);
  }

  async updateEvent(
    id: string,
    updateEventDto: UpdateEventDto,
  ): Promise<ResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
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

    return new ResponseDto(
      false,
      'Evento atualizado com sucesso',
      updatedEvent,
    );
  }

  async deleteEvent(id: string): Promise<ResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }

    const deletedEvent = await this.prisma.event.delete({
      where: { id },
    });

    if (!deletedEvent) {
      throw new HttpException('Erro ao deletar evento', HttpStatus.BAD_REQUEST);
    }

    return new ResponseDto(false, 'Evento deletado com sucesso', null);
  }
}
