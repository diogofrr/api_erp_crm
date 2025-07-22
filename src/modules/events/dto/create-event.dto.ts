import { Type } from 'class-transformer';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @IsString({ message: 'name deve ser uma string' })
  name: string;

  @IsOptional({ message: 'description é opcional' })
  @IsString({ message: 'description deve ser uma string' })
  description: string;

  @IsNotEmpty({ message: 'date não pode ser vazio' })
  @Type(() => Date)
  @IsDate({ message: 'date deve ser uma data válida' })
  date: Date;

  @IsNotEmpty({ message: 'startTime não pode ser vazio' })
  @Type(() => Date)
  @IsDate({ message: 'startTime deve ser uma data válida' })
  startTime: Date;

  @IsNotEmpty({ message: 'startTime não pode ser vazio' })
  @Type(() => Date)
  @IsDate({ message: 'startTime deve ser uma data válida' })
  endTime: Date;

  @IsNotEmpty({ message: 'location não pode ser vazio' })
  @IsString({ message: 'location deve ser uma string' })
  location: string;

  @IsNotEmpty({ message: 'totalTickets não pode ser vazio' })
  @IsNumber(undefined, { message: 'totalTickets deve ser um número' })
  totalTickets: number;

  @IsNotEmpty({ message: 'price não pode ser vazio' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'price deve ser um número' })
  price: number;

  @IsOptional({ message: 'logoUrl é opcional' })
  @IsString({ message: 'logoUrl deve ser uma string' })
  logoUrl?: string;
}
