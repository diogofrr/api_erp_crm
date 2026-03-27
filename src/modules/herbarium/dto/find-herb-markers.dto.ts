import { IsIn, IsOptional, IsString } from 'class-validator';

export class FindHerbMarkersDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['pouca', 'muita'], { message: 'status deve ser pouca ou muita' })
  status?: string;

  @IsOptional()
  @IsIn(['flor', 'erva', 'arvore'], {
    message: 'classification deve ser flor, erva ou arvore',
  })
  classification?: string;
}
