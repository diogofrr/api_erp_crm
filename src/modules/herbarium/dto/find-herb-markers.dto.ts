import { IsIn, IsOptional, IsString } from 'class-validator';

export class FindHerbMarkersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['pouca', 'muita'], { message: 'status deve ser pouca ou muita' })
  status?: string;
}
