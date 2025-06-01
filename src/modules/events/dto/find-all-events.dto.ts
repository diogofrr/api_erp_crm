import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  IsEnum,
  IsDate,
  IsString,
} from 'class-validator';
import { EventStatus } from '@prisma/client';

export class FindAllEventsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um número inteiro' })
  @Min(1, { message: 'page deve ser maior ou igual a 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit deve ser um número inteiro' })
  @Min(1, { message: 'limit deve ser maior ou igual a 1' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'search deve ser uma string' })
  search?: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message:
      'status deve ser um dos seguintes valores: PENDING, ACTIVE, CANCELED, COMPLETED',
  })
  status?: EventStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data válida' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida' })
  endDate?: Date;
}
