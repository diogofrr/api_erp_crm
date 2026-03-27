import { BatchType } from '@generated/prisma';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBatchDto {
  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @IsString({ message: 'name deve ser uma string' })
  name: string;

  @IsOptional()
  @IsEnum(BatchType, {
    message: 'type deve ser REGULAR ou PROMOTIONAL',
  })
  type?: BatchType;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price deve ser um número' })
  price?: number;

  @IsOptional()
  @IsInt({ message: 'maxTickets deve ser um número inteiro' })
  @Min(1, { message: 'maxTickets deve ser maior que zero' })
  maxTickets?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data válida' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida' })
  endDate?: Date;
}
