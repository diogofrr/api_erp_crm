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

import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FindAllEventsDto } from './dto/find-all-events.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async findAll(@Query() findAllEventsDto: FindAllEventsDto) {
    return await this.eventsService.findAllEvents(findAllEventsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.eventsService.findEventById(id);
  }

  @Post()
  async create(@Body() createEventDto: CreateEventDto, @Req() req: Request) {
    const headers = req.headers;
    return await this.eventsService.createEvent(createEventDto, headers);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return await this.eventsService.updateEvent(id, updateEventDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateEventStatusDto: UpdateEventStatusDto,
  ) {
    return await this.eventsService.updateEventStatus(id, updateEventStatusDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
