import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateHerbMarkerDto } from './dto/create-herb-marker.dto';
import { FindHerbMarkersDto } from './dto/find-herb-markers.dto';
import { UpdateHerbMarkerDto } from './dto/update-herb-marker.dto';
import { HerbariumService } from './herbarium.service';

@Controller('herbarium')
export class HerbariumController {
  constructor(private readonly herbariumService: HerbariumService) {}

  @Get('catalog')
  async findCatalog() {
    return this.herbariumService.findCatalog();
  }

  @Get()
  async findAll(@Query() filter: FindHerbMarkersDto) {
    return this.herbariumService.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.herbariumService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateHerbMarkerDto) {
    return this.herbariumService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateHerbMarkerDto) {
    return this.herbariumService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.herbariumService.remove(id);
  }
}
