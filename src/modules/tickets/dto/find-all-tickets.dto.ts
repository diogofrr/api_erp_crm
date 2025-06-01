import {
  IsOptional,
  IsString,
  Min,
  Max,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllTicketsDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'page deve ser maior que 0' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(1, { message: 'limit deve ser maior que 0' })
  @Max(100, { message: 'limit deve ser menor ou igual a 100' })
  limit?: number;

  @IsOptional()
  @IsString({ message: 'search deve ser uma string' })
  search?: string;

  @IsNotEmpty()
  @IsUUID(undefined, { message: 'eventId não pode ser vazio' })
  eventId: string;
}
