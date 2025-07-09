import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CancelTicketDto } from './dto/cancel-ticket.dto';
import { ConfirmEntryDto } from './dto/confirm-entry.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { FindAllTicketsDto } from './dto/find-all-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER, UserRole.USER)
  async findAll(@Query() findAllTicketsDto: FindAllTicketsDto) {
    return await this.ticketsService.findAll(findAllTicketsDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER, UserRole.USER)
  async findOne(@Param('id') id: string) {
    return await this.ticketsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER)
  async create(@Body() createTicketDto: CreateTicketDto, @Req() req: Request) {
    const headers = req.headers;
    return await this.ticketsService.create(createTicketDto, headers);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketsService.update(id, updateTicketDto);
  }

  @Patch('/confirm')
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER)
  async confirmEntry(
    @Body() confirmEntryDto: ConfirmEntryDto,
    @Req() req: Request,
  ) {
    const headers = req.headers;
    return await this.ticketsService.confirmEntry(confirmEntryDto, headers);
  }

  @Patch('/cancel')
  @Roles(UserRole.ADMIN, UserRole.TICKET_MANAGER)
  async cancelTicket(
    @Body() cancelTicketDto: CancelTicketDto,
    @Req() req: Request,
  ) {
    const headers = req.headers;
    return await this.ticketsService.cancelTicket(cancelTicketDto, headers);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return await this.ticketsService.remove(id);
  }
}
