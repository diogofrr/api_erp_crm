import { Type } from 'class-transformer';
import { IsString, IsEmail, IsNotEmpty, IsUUID, IsDate } from 'class-validator';

export class CreateTicketDto {
  @IsNotEmpty({ message: 'fullName não pode ser vazio' })
  @IsString({ message: 'fullName deve ser uma string' })
  fullName: string;

  @IsNotEmpty({ message: 'email não pode ser vazio' })
  @IsEmail(undefined, { message: 'o campo deve ser um email válido' })
  email: string;

  @IsNotEmpty({ message: 'phone não pode ser vazio' })
  @IsString({ message: 'phone deve ser uma string' })
  phone: string;

  @IsNotEmpty({ message: 'birthDate não pode ser vazio' })
  @Type(() => Date)
  @IsDate({ message: 'birthDate deve ser uma data válida' })
  birthDate: Date;

  @IsNotEmpty({ message: 'cpf não pode ser vazio' })
  @IsString({ message: 'cpf deve ser uma string' })
  cpf: string;

  @IsNotEmpty({ message: 'eventId não pode ser vazio' })
  @IsUUID(undefined, { message: 'eventId deve ser um UUID válido' })
  eventId: string;
}
