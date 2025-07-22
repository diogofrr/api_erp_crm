import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString({ message: 'fullName deve ser uma string' })
  fullName?: string;

  @IsOptional()
  @IsEmail(undefined, {
    message: 'email deve ser um endereço de e-mail válido',
  })
  email?: string;

  @IsOptional()
  @IsString({
    message: 'phone deve ser uma string',
  })
  phone?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'birthDate deve ser uma data válida' })
  birthDate?: Date;

  @IsOptional()
  @IsString({ message: 'cpf deve ser uma string' })
  @Length(11, 14, {
    message: 'cpf deve ter entre 11 e 14 caracteres',
  })
  cpf?: string;
}
