import { IsNotEmpty } from 'class-validator';

export class AuthDto {
  @IsNotEmpty({
    message: 'Por favor, forneça um nome de usuário',
  })
  username: string;

  @IsNotEmpty({
    message: 'Por favor, forneça a senha do usuário',
  })
  password: string;
}
