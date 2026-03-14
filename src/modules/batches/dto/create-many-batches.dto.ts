import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateBatchDto } from './create-batch.dto';

export class CreateManyBatchesDto {
  @IsArray({ message: 'batches deve ser um array' })
  @ArrayMinSize(1, { message: 'informe pelo menos um lote' })
  @ValidateNested({ each: true })
  @Type(() => CreateBatchDto)
  batches: CreateBatchDto[];
}
