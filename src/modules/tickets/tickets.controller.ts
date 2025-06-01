import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { FindAllTicketsDto } from './dto/find-all-tickets.dto';
import { ConfirmEntryDto } from './dto/confirm-entry.dto';
import { CancelTicketDto } from './dto/cancel-ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  async findAll(@Query() findAllTicketsDto: FindAllTicketsDto) {
    return await this.ticketsService.findAll(findAllTicketsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.ticketsService.findOne(id);
  }

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto, @Req() req: Request) {
    const headers = req.headers;
    return await this.ticketsService.create(createTicketDto, headers);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return await this.ticketsService.update(id, updateTicketDto);
  }

  @Patch('/confirm')
  async confirmEntry(
    @Body() confirmEntryDto: ConfirmEntryDto,
    @Req() req: Request,
  ) {
    const headers = req.headers;
    return await this.ticketsService.confirmEntry(confirmEntryDto, headers);
  }

  @Patch('/cancel')
  async cancelTicket(
    @Body() cancelTicketDto: CancelTicketDto,
    @Req() req: Request,
  ) {
    const headers = req.headers;
    return await this.ticketsService.cancelTicket(cancelTicketDto, headers);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.ticketsService.remove(id);
  }
}
