import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Batch, BatchType, Event } from '@prisma/client';
import { isAfter, isBefore, isEqual } from 'date-fns';
import { ResponseDto } from 'src/dto/response.dto';
import { PrismaService } from '../../database/prisma/prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateManyBatchesDto } from './dto/create-many-batches.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';

type RegularBatchWindow = {
  id?: string;
  name: string;
  maxTickets: number;
  startDate: Date;
  endDate: Date;
};

type ActiveRegularBatch = {
  batch: Batch;
  effectiveMaxTickets: number;
  soldInBatch: number;
  remainingTickets: number;
};

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  private async ensureEventExists(eventId: string): Promise<Event> {
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

  private buildBadRequest(message: string): HttpException {
    return new HttpException(message, HttpStatus.BAD_REQUEST);
  }

  private normalizeBatchType(type?: BatchType): BatchType {
    return type ?? BatchType.REGULAR;
  }

  private validateRegularBatchFields(batch: CreateBatchDto | UpdateBatchDto) {
    if (batch.maxTickets === undefined || batch.maxTickets === null) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": maxTickets é obrigatório para lotes REGULAR`,
      );
    }

    if (batch.maxTickets <= 0) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": maxTickets deve ser maior que zero`,
      );
    }

    if (batch.price === undefined || batch.price === null) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": price é obrigatório para lotes REGULAR`,
      );
    }

    if (batch.price < 0) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": price não pode ser negativo`,
      );
    }

    if (!batch.startDate || !batch.endDate) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": startDate e endDate são obrigatórios para lotes REGULAR`,
      );
    }

    const start = new Date(batch.startDate);
    const end = new Date(batch.endDate);
    if (isAfter(start, end) || isEqual(start, end)) {
      throw this.buildBadRequest(
        `Lote "${batch.name ?? 'sem nome'}": startDate deve ser anterior a endDate`,
      );
    }
  }

  private regularWindowFromDto(
    batch: CreateBatchDto | UpdateBatchDto,
    fallback?: RegularBatchWindow,
  ): RegularBatchWindow {
    const name = batch.name ?? fallback?.name ?? 'Lote sem nome';
    const maxTickets = batch.maxTickets ?? fallback?.maxTickets;
    const startDate = batch.startDate ?? fallback?.startDate;
    const endDate = batch.endDate ?? fallback?.endDate;

    if (
      maxTickets === undefined ||
      maxTickets === null ||
      !startDate ||
      !endDate
    ) {
      throw this.buildBadRequest(
        `Lote "${name}": dados obrigatórios para REGULAR não informados corretamente`,
      );
    }

    return {
      id: fallback?.id,
      name,
      maxTickets,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };
  }

  private validateBatchLimitsByEvent(
    eventLimit: number,
    regularBatches: RegularBatchWindow[],
  ): void {
    for (const batch of regularBatches) {
      if (batch.maxTickets > eventLimit) {
        throw this.buildBadRequest(
          `Lote "${batch.name}": maxTickets individual não pode ultrapassar o limite de ingressos do evento (${eventLimit})`,
        );
      }
    }

    const totalRegular = regularBatches.reduce(
      (sum, batch) => sum + batch.maxTickets,
      0,
    );

    if (totalRegular > eventLimit) {
      throw this.buildBadRequest(
        `A soma de maxTickets dos lotes REGULAR (${totalRegular}) não pode ultrapassar o limite de ingressos do evento (${eventLimit})`,
      );
    }
  }

  private async validateNoOverlaps(
    eventId: string,
    incoming: RegularBatchWindow[],
    ignoreBatchId?: string,
  ): Promise<void> {
    const existingRegular = await this.prisma.batch.findMany({
      where: {
        eventId,
        type: BatchType.REGULAR,
        ...(ignoreBatchId ? { id: { not: ignoreBatchId } } : {}),
      },
      select: {
        id: true,
        name: true,
        maxTickets: true,
        startDate: true,
        endDate: true,
      },
    });

    const existingWindows: RegularBatchWindow[] = [];
    for (const e of existingRegular) {
      if (e.startDate !== null && e.endDate !== null) {
        existingWindows.push({
          id: e.id,
          name: e.name,
          maxTickets: e.maxTickets,
          startDate: e.startDate,
          endDate: e.endDate,
        });
      }
    }

    this.checkOverlapsBetweenIntervals(incoming, incoming, true);
    this.checkOverlapsBetweenIntervals(incoming, existingWindows, false);
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
    const event = await this.ensureEventExists(eventId);

    const batches = dto.batches.map(b => ({
      ...b,
      type: this.normalizeBatchType(b.type),
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
    const regularIncoming: RegularBatchWindow[] = [];

    for (const b of batches) {
      if (b.type === BatchType.REGULAR) {
        this.validateRegularBatchFields(b);

        const regularWindow = this.regularWindowFromDto(b);
        regularIncoming.push(regularWindow);

        const end = new Date(b.endDate as Date);
        if (isBefore(end, now)) {
          throw this.buildBadRequest(
            `Lote "${b.name}": endDate (${end.toISOString()}) não pode estar totalmente no passado.`,
          );
        }
      } else {
        b.price = undefined;
        b.maxTickets = undefined;
        b.startDate = undefined;
        b.endDate = undefined;
        b.name = 'Lote Promocional';
      }
    }

    await this.validateNoOverlaps(eventId, regularIncoming);

    const existingRegular = await this.prisma.batch.findMany({
      where: { eventId, type: BatchType.REGULAR },
      select: {
        id: true,
        name: true,
        maxTickets: true,
        startDate: true,
        endDate: true,
      },
    });

    const capacitySource: RegularBatchWindow[] = [
      ...existingRegular
        .filter(batch => batch.startDate && batch.endDate)
        .map(batch => ({
          id: batch.id,
          name: batch.name,
          maxTickets: batch.maxTickets,
          startDate: batch.startDate as Date,
          endDate: batch.endDate as Date,
        })),
      ...regularIncoming,
    ];

    this.validateBatchLimitsByEvent(event.totalTickets, capacitySource);

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
      type: this.normalizeBatchType(b.type),
      price: b.price ?? null,
      maxTickets: b.maxTickets ?? 0,
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

  private async getRegularBatchesOrdered(eventId: string): Promise<Batch[]> {
    return await this.prisma.batch.findMany({
      where: {
        eventId,
        type: BatchType.REGULAR,
      },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  private async countSoldTickets(eventId: string): Promise<number> {
    return await this.prisma.eventTicket.count({
      where: {
        eventId,
        status: { not: 'CANCELED' },
      },
    });
  }

  private getActiveRegularBatch(
    regularBatches: Batch[],
    soldTickets: number,
    referenceDate: Date,
  ): ActiveRegularBatch | null {
    if (regularBatches.length === 0) {
      return null;
    }

    let carryOver = 0;
    let soldRemaining = soldTickets;
    let canBypassStartDate = false;

    for (let i = 0; i < regularBatches.length; i++) {
      const batch = regularBatches[i];
      const effectiveMaxTickets = batch.maxTickets + carryOver;
      const soldInBatch = Math.min(soldRemaining, effectiveMaxTickets);
      soldRemaining -= soldInBatch;

      const remainingTickets = effectiveMaxTickets - soldInBatch;
      const soldOut = remainingTickets === 0;
      const expired = batch.endDate ? isAfter(referenceDate, batch.endDate) : false;
      const started = batch.startDate
        ? !isBefore(referenceDate, batch.startDate)
        : true;

      if (!soldOut && !expired) {
        if (started || canBypassStartDate) {
          return {
            batch,
            effectiveMaxTickets,
            soldInBatch,
            remainingTickets,
          };
        }

        return null;
      }

      const isLastBatch = i === regularBatches.length - 1;
      carryOver = !isLastBatch && expired ? remainingTickets : 0;
      canBypassStartDate = canBypassStartDate || soldOut || expired;
    }

    return null;
  }

  async resolveActiveRegularBatchForSale(
    eventId: string,
    soldTickets?: number,
  ): Promise<ActiveRegularBatch | null> {
    await this.ensureEventExists(eventId);
    const now = new Date();
    now.setMilliseconds(0);

    const [regularBatches, soldCount] = await Promise.all([
      this.getRegularBatchesOrdered(eventId),
      soldTickets === undefined
        ? this.countSoldTickets(eventId)
        : Promise.resolve(soldTickets),
    ]);

    return this.getActiveRegularBatch(regularBatches, soldCount, now);
  }

  async updateBatch(
    eventId: string,
    batchId: string,
    dto: UpdateBatchDto,
  ): Promise<ResponseDto> {
    const event = await this.ensureEventExists(eventId);

    const batch = await this.prisma.batch.findFirst({
      where: { id: batchId, eventId },
    });

    if (!batch) {
      throw new HttpException('Lote não encontrado', HttpStatus.NOT_FOUND);
    }

    if (batch.type !== BatchType.REGULAR) {
      throw this.buildBadRequest('Apenas lotes REGULAR podem ser atualizados');
    }

    const now = new Date();
    now.setMilliseconds(0);
    const isFutureBatch =
      batch.startDate !== null && isBefore(now, new Date(batch.startDate));
    const isCurrentBatch =
      batch.startDate !== null &&
      batch.endDate !== null &&
      !isBefore(now, batch.startDate) &&
      !isAfter(now, batch.endDate);

    if (!isFutureBatch && !isCurrentBatch) {
      throw this.buildBadRequest(
        'Só é permitido atualizar lotes futuros ou reduzir endDate de lote vigente',
      );
    }

    if (isCurrentBatch) {
      const hasUnexpectedField =
        dto.name !== undefined ||
        dto.type !== undefined ||
        dto.price !== undefined ||
        dto.maxTickets !== undefined ||
        dto.startDate !== undefined;

      if (hasUnexpectedField) {
        throw this.buildBadRequest(
          'Para lote vigente, apenas endDate pode ser alterado',
        );
      }

      if (!dto.endDate) {
        throw this.buildBadRequest(
          'Para lote vigente, informe o novo endDate',
        );
      }

      if (!batch.endDate) {
        throw this.buildBadRequest('Lote sem endDate não pode ser atualizado');
      }

      const newEndDate = new Date(dto.endDate);

      if (!isBefore(newEndDate, batch.endDate)) {
        throw this.buildBadRequest(
          'Para lote vigente, endDate só pode ser reduzido para uma data anterior à atual',
        );
      }

      if (!isAfter(newEndDate, now)) {
        throw this.buildBadRequest(
          'Para lote vigente, o novo endDate deve ser futuro',
        );
      }

      const updated = await this.prisma.batch.update({
        where: { id: batch.id },
        data: { endDate: newEndDate },
      });

      return new ResponseDto('Lote atualizado com sucesso', updated);
    }

    const nextType = this.normalizeBatchType(dto.type ?? batch.type);
    if (nextType !== BatchType.REGULAR) {
      throw this.buildBadRequest('O lote não pode ser convertido para PROMOTIONAL');
    }

    const mergedPayload: UpdateBatchDto = {
      name: dto.name ?? batch.name,
      type: batch.type,
      price: dto.price ?? batch.price ?? undefined,
      maxTickets: dto.maxTickets ?? batch.maxTickets,
      startDate: dto.startDate ?? batch.startDate ?? undefined,
      endDate: dto.endDate ?? batch.endDate ?? undefined,
    };

    this.validateRegularBatchFields(mergedPayload);

    const updatedWindow = this.regularWindowFromDto(mergedPayload, {
      id: batch.id,
      name: batch.name,
      maxTickets: batch.maxTickets,
      startDate: batch.startDate as Date,
      endDate: batch.endDate as Date,
    });

    await this.validateNoOverlaps(eventId, [updatedWindow], batch.id);

    const otherRegular = await this.prisma.batch.findMany({
      where: {
        eventId,
        type: BatchType.REGULAR,
        id: { not: batch.id },
      },
      select: {
        id: true,
        name: true,
        maxTickets: true,
        startDate: true,
        endDate: true,
      },
    });

    const capacitySource: RegularBatchWindow[] = [
      ...otherRegular
        .filter(value => value.startDate && value.endDate)
        .map(value => ({
          id: value.id,
          name: value.name,
          maxTickets: value.maxTickets,
          startDate: value.startDate as Date,
          endDate: value.endDate as Date,
        })),
      updatedWindow,
    ];

    this.validateBatchLimitsByEvent(event.totalTickets, capacitySource);

    const updatedBatch = await this.prisma.batch.update({
      where: { id: batch.id },
      data: {
        name: mergedPayload.name,
        type: batch.type,
        price: mergedPayload.price ?? null,
        maxTickets: mergedPayload.maxTickets,
        startDate: mergedPayload.startDate ? new Date(mergedPayload.startDate) : null,
        endDate: mergedPayload.endDate ? new Date(mergedPayload.endDate) : null,
      },
    });

    return new ResponseDto('Lote atualizado com sucesso', updatedBatch);
  }

  async getAvailableBatches(eventId: string): Promise<ResponseDto> {
    await this.ensureEventExists(eventId);
    const now = new Date();
    now.setMilliseconds(0);

    const [activeRegular, promoList] = await Promise.all([
      this.resolveActiveRegularBatchForSale(eventId),
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

    const result: AvailableBatch[] = [];
    if (activeRegular) {
      result.push({
        id: activeRegular.batch.id,
        eventId: activeRegular.batch.eventId,
        name: activeRegular.batch.name,
        type: activeRegular.batch.type,
        price: activeRegular.batch.price,
        startDate: activeRegular.batch.startDate,
        endDate: activeRegular.batch.endDate,
        createdAt: activeRegular.batch.createdAt,
        updatedAt: activeRegular.batch.updatedAt,
        isVirtual: false,
      });
    }

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
