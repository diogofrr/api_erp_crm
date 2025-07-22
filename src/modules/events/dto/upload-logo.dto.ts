import { IsNotEmpty, IsString } from 'class-validator';

export class UploadLogoDto {
  @IsNotEmpty({ message: 'eventId não pode ser vazio' })
  @IsString({ message: 'eventId deve ser uma string' })
  eventId: string;
}
