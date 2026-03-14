import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Batch, BatchType } from '@prisma/client';
import { isAfter, isBefore, isEqual } from 'date-fns';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateManyBatchesDto } from './dto/create-many-batches.dto';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  private async ensureEventExists(eventId: string) {
    if (!eventId) {
      throw new HttpException(
        'ID do evento não fornecido',
        HttpStatus.BAD_REQUEST,
      );
    }
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new HttpException('Evento não encontrado', HttpStatus.NOT_FOUND);
    }
    return event;
  }

  private validateRegularBatchFields(batch: CreateBatchDto) {
    if (batch.price === undefined || batch.price === null) {
      throw new HttpException(
        `Lote "${batch.name}": price é obrigatório para lotes REGULAR`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (batch.price < 0) {
      throw new HttpException(
        `Lote "${batch.name}": price não pode ser negativo`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!batch.startDate || !batch.endDate) {
      throw new HttpException(
        `Lote "${batch.name}": startDate e endDate são obrigatórios para lotes REGULAR`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const start = new Date(batch.startDate);
    const end = new Date(batch.endDate);
    if (isAfter(start, end) || isEqual(start, end)) {
      throw new HttpException(
        `Lote "${batch.name}": startDate deve ser anterior a endDate`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateNoOverlaps(
    eventId: string,
    incoming: CreateBatchDto[],
  ): Promise<void> {
    const existingRegular = await this.prisma.batch.findMany({
      where: { eventId, type: BatchType.REGULAR },
      select: { id: true, name: true, startDate: true, endDate: true },
    });

    const incomingRegular = incoming
      .filter(b => (b.type ?? BatchType.REGULAR) === BatchType.REGULAR)
      .map(b => {
        if (!(b.startDate instanceof Date) || !(b.endDate instanceof Date)) {
          throw new HttpException(
            `Lote "${b.name}": datas inválidas`,
            HttpStatus.BAD_REQUEST,
          );
        }
        return {
          name: b.name,
          startDate: b.startDate,
          endDate: b.endDate,
        };
      });

    this.checkOverlapsBetweenIntervals(incomingRegular, incomingRegular, true);

    type RegularWindow = {
      name: string;
      startDate: Date;
      endDate: Date;
    };

    const existingWindows: RegularWindow[] = [];
    for (const e of existingRegular) {
      if (e.startDate !== null && e.endDate !== null) {
        existingWindows.push({
          name: e.name,
          startDate: e.startDate,
          endDate: e.endDate,
        });
      }
    }

    this.checkOverlapsBetweenIntervals(incomingRegular, existingWindows, false);
  }

  private checkOverlapsBetweenIntervals(
    intervalsA: Array<{ name: string; startDate: Date; endDate: Date }>,
    intervalsB: Array<{ name: string; startDate: Date; endDate: Date }>,
    isSameArray = false,
  ): void {
    for (let i = 0; i < intervalsA.length; i++) {
      const start = isSameArray ? i + 1 : 0;
      for (let j = start; j < intervalsB.length; j++) {
        const a = intervalsA[i];
        const b = intervalsB[j];

        if (
          this.intervalsOverlap(a.startDate, a.endDate, b.startDate, b.endDate)
        ) {
          const message = isSameArray
            ? `Sobreposição detectada entre lotes enviados: "${a.name}" (${a.startDate.toISOString()} - ${a.endDate.toISOString()}) e "${b.name}" (${b.startDate.toISOString()} - ${b.endDate.toISOString()}).`
            : `Lote "${a.name}" (${a.startDate.toISOString()} - ${a.endDate.toISOString()}) sobrepõe período do lote existente "${b.name}" (${b.startDate.toISOString()} - ${b.endDate.toISOString()}).`;

          throw new HttpException(message, HttpStatus.BAD_REQUEST);
        }
      }
    }
  }

  private intervalsOverlap(
    aStart: Date,
    aEnd: Date,
    bStart: Date,
    bEnd: Date,
  ): boolean {
    return !isAfter(aStart, bEnd) && !isBefore(aEnd, bStart);
  }

  async createBatches(
    eventId: string,
    dto: CreateManyBatchesDto,
  ): Promise<ResponseDto> {
    await this.ensureEventExists(eventId);

    const batches = dto.batches.map(b => ({
      ...b,
      type: b.type ?? BatchType.REGULAR,
    }));

    const promoCount = batches.filter(
      b => b.type === BatchType.PROMOTIONAL,
    ).length;
    if (promoCount > 1) {
      throw new HttpException(
        'Apenas um Lote PROMOTIONAL pode ser criado por requisição',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (promoCount === 1) {
      const existsPromo = await this.prisma.batch.findFirst({
        where: { eventId, type: BatchType.PROMOTIONAL },
      });
      if (existsPromo) {
        throw new HttpException(
          'Já existe um Lote PROMOTIONAL para este evento',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const now = new Date();
    now.setMilliseconds(0);
    for (const b of batches) {
      if (b.type === BatchType.REGULAR) {
        this.validateRegularBatchFields(b);
        const end = new Date(b.endDate as Date);
        if (isBefore(end, now)) {
          throw new HttpException(
            `Lote "${b.name}": endDate (${end.toISOString()}) não pode estar totalmente no passado.`,
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        b.price = undefined;
        b.startDate = undefined;
        b.endDate = undefined;
        b.name = 'Lote Promocional';
      }
    }

    await this.validateNoOverlaps(eventId, batches);

    const names = batches.map(b => b.name);
    const namesSet = new Set(names);
    if (namesSet.size !== names.length) {
      throw new HttpException(
        'Existem nomes de lotes duplicados na solicitação',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existingWithSameName = await this.prisma.batch.findMany({
      where: { eventId, name: { in: names } },
      select: { name: true },
    });
    if (existingWithSameName.length > 0) {
      throw new HttpException(
        `Já existem lotes com os nomes: ${existingWithSameName.map(n => `"${n.name}"`).join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const toCreate = batches.map(b => ({
      eventId,
      name: b.name,
      type: b.type ?? BatchType.REGULAR,
      price: b.price ?? null,
      startDate: (b.startDate as Date) ?? null,
      endDate: (b.endDate as Date) ?? null,
    }));

    const createBatchInTransaction = async (
      tx: Parameters<Parameters<typeof this.prisma.$transaction>[0]>[0],
    ): Promise<Batch[]> => {
      const results: Batch[] = [];
      for (const data of toCreate) {
        const batch: Batch = await tx.batch.create({ data });
        results.push(batch);
      }
      return results;
    };

    const created: Batch[] = await this.prisma.$transaction(
      createBatchInTransaction,
    );

    return new ResponseDto('Lotes criados com sucesso', created);
  }

  async getAvailableBatches(eventId: string): Promise<ResponseDto> {
    await this.ensureEventExists(eventId);
    const now = new Date();
    now.setMilliseconds(0);

    const [regular, promoList] = await Promise.all([
      this.prisma.batch.findMany({
        where: {
          eventId,
          type: BatchType.REGULAR,
          startDate: { lte: now },
          endDate: { gte: now },
        },
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.batch.findMany({
        where: { eventId, type: BatchType.PROMOTIONAL },
      }),
    ]);

    if (promoList.length > 1) {
      throw new HttpException(
        'Mais de um Lote PROMOTIONAL encontrado para este evento. Contate o suporte.',
        HttpStatus.CONFLICT,
      );
    }

    type AvailableBatch = {
      id: string;
      eventId: string;
      name: string;
      type: BatchType;
      price: number | null;
      startDate: Date | null;
      endDate: Date | null;
      createdAt: Date;
      updatedAt: Date;
      isVirtual?: boolean;
    };

    const result: AvailableBatch[] = regular.map<AvailableBatch>(r => ({
      id: r.id,
      eventId: r.eventId,
      name: r.name,
      type: r.type,
      price: r.price,
      startDate: r.startDate,
      endDate: r.endDate,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      isVirtual: false,
    }));

    const promotional = promoList[0];
    if (promotional) {
      const promo: AvailableBatch = {
        id: promotional.id,
        eventId: promotional.eventId,
        name: promotional.name,
        type: promotional.type,
        price: promotional.price,
        startDate: promotional.startDate,
        endDate: promotional.endDate,
        createdAt: promotional.createdAt,
        updatedAt: promotional.updatedAt,
        isVirtual: false,
      };
      result.push(promo);
    } else {
      result.push({
        id: 'PROMOTIONAL',
        eventId,
        name: 'Lote Promocional',
        type: BatchType.PROMOTIONAL,
        price: null,
        startDate: null,
        endDate: null,
        createdAt: now,
        updatedAt: now,
        isVirtual: true,
      });
    }

    return new ResponseDto('Lotes disponíveis encontrados com sucesso', result);
  }
}
