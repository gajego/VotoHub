import { IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({
    message: 'Por favor, forneça seu nome completo',
  })
  fullName: string;

  @IsNotEmpty({
    message: 'Por favor, forneça um nome de usuário',
  })
  email: string;

  @IsNotEmpty({
    message: 'Por favor, forneça a senha do usuário',
  })
  @Length(8, undefined, {
    message: 'Senha deve ter pelomenos 8 caracteres',
  })
  password: string;
}
