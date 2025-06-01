import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'email não pode ser vazio' })
  @IsEmail(undefined, { message: 'email deve ser um endereço de email válido' })
  email: string;

  @IsNotEmpty({ message: 'password não pode ser vazio' })
  @IsString({ message: 'password deve ser uma string' })
  @MinLength(8, { message: 'password deve ter pelo menos 8 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'name não pode ser vazio' })
  @IsString({ message: 'name deve ser uma string' })
  @MaxLength(100, { message: 'name deve ter no máximo 100 caracteres' })
  name: string;
}
