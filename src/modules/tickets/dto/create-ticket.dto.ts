import {
  IsString,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsDateString()
  @IsNotEmpty()
  birthDate: Date;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
