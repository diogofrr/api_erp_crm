import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ResponseDto } from 'src/dto/response.dto';
import { HerbariumRepository } from './herbarium.repository';
import { CreateHerbMarkerDto } from './dto/create-herb-marker.dto';
import { FindHerbMarkersDto } from './dto/find-herb-markers.dto';
import { UpdateHerbMarkerDto } from './dto/update-herb-marker.dto';
import { isWithinUberlandia } from '../../common/uberlandia';

@Injectable()
export class HerbariumService {
  constructor(private repository: HerbariumRepository) {}

  async findCatalog(): Promise<ResponseDto> {
    const catalog = await this.repository.findAllCatalog();
    return new ResponseDto('Catálogo de ervas', catalog);
  }

  async findAll(filter: FindHerbMarkersDto): Promise<ResponseDto> {
    const where: Record<string, unknown> = {};

    if (filter.status) where.status = filter.status;

    if (filter.q?.trim()) {
      const q = filter.q.trim();
      where.OR = [
        { notes: { contains: q, mode: 'insensitive' } },
        { addressLabel: { contains: q, mode: 'insensitive' } },
        { catalog: { name: { contains: q, mode: 'insensitive' } } },
        { catalog: { alternativeNames: { has: q } } },
        { catalog: { orixas: { has: q } } },
      ];
    }

    const markers = await this.repository.findAll(where);
    return new ResponseDto('Lista de marcadores', markers);
  }

  async findOne(id: string): Promise<ResponseDto> {
    const marker = await this.repository.findById(id);
    if (!marker) {
      throw new HttpException('Marcador não encontrado', HttpStatus.NOT_FOUND);
    }
    return new ResponseDto('Marcador encontrado', marker);
  }

  async create(dto: CreateHerbMarkerDto): Promise<ResponseDto> {
    this.assertCoords(dto.lat, dto.lng);

    const catalog = await this.repository.findCatalogEntry(dto.herbKey);
    if (!catalog) {
      throw new HttpException(
        'Erva não encontrada no catálogo.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const marker = await this.repository.create({
      herbKey: catalog.key,
      notes: dto.notes ?? '',
      status: dto.status,
      addressLabel: dto.addressLabel ?? '',
      lat: dto.lat,
      lng: dto.lng,
    });

    return new ResponseDto('Marcador criado', marker);
  }

  async update(id: string, dto: UpdateHerbMarkerDto): Promise<ResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpException('Marcador não encontrado', HttpStatus.NOT_FOUND);
    }

    const data: Record<string, unknown> = {};

    if (dto.herbKey !== undefined) {
      const catalog = await this.repository.findCatalogEntry(dto.herbKey);
      if (!catalog) {
        throw new HttpException(
          'Erva não encontrada no catálogo.',
          HttpStatus.BAD_REQUEST,
        );
      }
      data.herbKey = catalog.key;
    }

    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.addressLabel !== undefined) data.addressLabel = dto.addressLabel;

    const marker = await this.repository.update(id, data);
    return new ResponseDto('Marcador atualizado', marker);
  }

  async remove(id: string): Promise<ResponseDto> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new HttpException('Marcador não encontrado', HttpStatus.NOT_FOUND);
    }
    await this.repository.delete(id);
    return new ResponseDto('Marcador removido', null);
  }

  private assertCoords(lat: number, lng: number) {
    if (!isWithinUberlandia(lat, lng)) {
      throw new HttpException(
        'Coordenadas fora dos limites de Uberlândia - MG.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
