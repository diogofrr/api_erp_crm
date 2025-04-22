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

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  async create(@Body() createTicketDto: CreateTicketDto, @Req() req: Request) {
    const headers = req.headers;
    return this.ticketsService.create(createTicketDto, headers);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.ticketsService.findAll(parseInt(page), parseInt(limit));
  }

  @Get('search')
  async search(@Query('query') query: string) {
    return this.ticketsService.search(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketsService.findOne(id);
  }

  @Get('event')
  async findByEventId(@Query('eventId') eventId: string) {
    return this.ticketsService.findByEventId(eventId);
  }

  // @Get(':eventId/:ticketId/pdf')
  // async generatePDF(
  //   @Param('eventId') eventId: string,
  //   @Param('ticketId') ticketId: string,
  //   @Res() res: Response,
  // ) {
  //   const ticketData = await this.ticketsService.generateTicketPDF(
  //     eventId,
  //     ticketId,
  //     res,
  //   );
  //   return ticketData;
  // }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto);
  }

  @Patch(':eventId/:ticketId/confirm')
  async confirmEntry(
    @Param('eventId') eventId: string,
    @Param('ticketId') ticketId: string,
    @Req() req: Request,
  ) {
    const headers = req.headers;
    return this.ticketsService.confirmEntry(eventId, ticketId, headers);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ticketsService.remove(id);
  }
}
