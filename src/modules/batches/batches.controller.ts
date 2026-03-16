import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { BatchesService } from './batches.service';
import { CreateManyBatchesDto } from './dto/create-many-batches.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

@Controller('events/:eventId/batches')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  async createMany(
    @Param('eventId') eventId: string,
    @Body() dto: CreateManyBatchesDto,
  ) {
    return await this.batchesService.createBatches(eventId, dto);
  }

  @Patch(':batchId')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER)
  async updateBatch(
    @Param('eventId') eventId: string,
    @Param('batchId') batchId: string,
    @Body() dto: UpdateBatchDto,
  ) {
    return await this.batchesService.updateBatch(eventId, batchId, dto);
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.EVENT_MANAGER, UserRole.USER)
  async getAvailable(@Param('eventId') eventId: string) {
    return await this.batchesService.getAvailableBatches(eventId);
  }
}
