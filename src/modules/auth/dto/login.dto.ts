import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'email não pode ser vazio' })
  @IsEmail(undefined, { message: 'email deve ser um endereço de email válido' })
  email: string;

  @IsNotEmpty({ message: 'email não pode ser vazio' })
  @IsString({ message: 'password deve ser uma string' })
  @MinLength(8, { message: 'password deve ter pelo menos 8 caracteres' })
  password: string;
}
