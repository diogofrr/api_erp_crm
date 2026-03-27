import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/prisma';
import { PrismaService } from '../../database/prisma/prisma.service';

@Injectable()
export class HerbariumRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(
    where: Prisma.HerbMarkerWhereInput,
    orderBy: Prisma.HerbMarkerOrderByWithRelationInput = { updatedAt: 'desc' },
  ) {
    return this.prisma.herbMarker.findMany({ where, orderBy });
  }

  async findById(id: string) {
    return this.prisma.herbMarker.findUnique({ where: { id } });
  }

  async create(data: Prisma.HerbMarkerUncheckedCreateInput) {
    return this.prisma.herbMarker.create({ data });
  }

  async update(id: string, data: Prisma.HerbMarkerUpdateInput) {
    return this.prisma.herbMarker.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.herbMarker.delete({ where: { id } });
  }

  async findCatalogEntry(key: string) {
    return this.prisma.herbCatalog.findUnique({ where: { key } });
  }
}
