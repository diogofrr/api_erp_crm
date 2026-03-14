import { BatchType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
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
  @Type(() => Date)
  @IsDate({ message: 'startDate deve ser uma data válida' })
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'endDate deve ser uma data válida' })
  endDate?: Date;
}
