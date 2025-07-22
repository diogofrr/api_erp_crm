import { EventStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString({ message: 'name deve ser uma string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'description deve ser uma string' })
  description: string;

  @IsOptional()
  @IsEnum(EventStatus, {
    message:
      'status deve ser um dos seguintes valores: PENDING, ACTIVE, CANCELLED, COMPLETED',
  })
  status: EventStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'date deve ser uma data válida' })
  date: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startTime deve ser uma data válida' })
  startTime: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'startTime deve ser uma data válida' })
  endTime: Date;

  @IsOptional()
  @IsString({ message: 'location deve ser uma string' })
  location: string;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 0 },
    { message: 'totalTickets deve ser um número inteiro' },
  )
  totalTickets: number;

  @IsOptional()
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'price deve ser um número com até duas casas decimais' },
  )
  price: number;

  @IsOptional()
  @IsString({ message: 'logoUrl deve ser uma string' })
  logoUrl?: string;
}
