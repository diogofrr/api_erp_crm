import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  date: Date;

  @IsString()
  @IsOptional()
  location: string;

  @IsNumber()
  @IsOptional()
  price: number;
}
