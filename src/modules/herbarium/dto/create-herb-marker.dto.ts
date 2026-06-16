import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { UBERLANDIA_BOUNDS } from '../../../common/uberlandia';

export class CreateHerbMarkerDto {
  @IsNotEmpty({ message: 'herbKey não pode ser vazio' })
  @IsString()
  herbKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(280, { message: 'notes deve ter no máximo 280 caracteres' })
  notes?: string;

  @IsNotEmpty({ message: 'status não pode ser vazio' })
  @IsIn(['pouca', 'muita'], { message: 'status deve ser pouca ou muita' })
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(140, { message: 'addressLabel deve ter no máximo 140 caracteres' })
  addressLabel?: string;

  @IsNotEmpty({ message: 'lat não pode ser vazio' })
  @IsNumber()
  @Min(UBERLANDIA_BOUNDS.south)
  @Max(UBERLANDIA_BOUNDS.north)
  lat: number;

  @IsNotEmpty({ message: 'lng não pode ser vazio' })
  @IsNumber()
  @Min(UBERLANDIA_BOUNDS.west)
  @Max(UBERLANDIA_BOUNDS.east)
  lng: number;
}
