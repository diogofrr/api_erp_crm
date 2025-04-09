import { Type } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsUUID, IsDate } from 'class-validator';

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

  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  birthDate: Date;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
