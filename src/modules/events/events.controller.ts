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
import { CreateEventDto } from './dto/create-event.dto';
import { FindAllEventsDto } from './dto/find-all-events.dto';
import { UpdateEventStatusDto } from './dto/update-event-status.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.USER)
  async findAll(@Query() findAllEventsDto: FindAllEventsDto) {
    return await this.eventsService.findAllEvents(findAllEventsDto);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.USER)
  async findOne(@Param('id') id: string) {
    return await this.eventsService.findEventById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  async create(@Body() createEventDto: CreateEventDto, @Req() req: Request) {
    const headers = req.headers;
    return await this.eventsService.createEvent(createEventDto, headers);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
  ) {
    return await this.eventsService.updateEvent(id, updateEventDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateEventStatusDto: UpdateEventStatusDto,
  ) {
    return await this.eventsService.updateEventStatus(id, updateEventStatusDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return await this.eventsService.deleteEvent(id);
  }
}
