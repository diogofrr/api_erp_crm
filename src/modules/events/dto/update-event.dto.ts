import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { EventStatus } from '@prisma/client';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEnum(EventStatus)
  @IsOptional()
  status: EventStatus;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date: Date;

  @IsString()
  @IsOptional()
  location: string;

  @IsNumber()
  @IsOptional()
  totalTickets: number;

  @IsNumber()
  @IsOptional()
  price: number;
}
