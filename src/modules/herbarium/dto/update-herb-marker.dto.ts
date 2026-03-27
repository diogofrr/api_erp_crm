import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateHerbMarkerDto {
  @IsOptional()
  @IsString()
  herbKey?: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'notes deve ter no máximo 280 caracteres' })
  notes?: string;

  @IsOptional()
  @IsIn(['pouca', 'muita'], { message: 'status deve ser pouca ou muita' })
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(140, { message: 'addressLabel deve ter no máximo 140 caracteres' })
  addressLabel?: string;
}
