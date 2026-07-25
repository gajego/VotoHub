import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCandidatoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Por favor, forneça o CPF do candidato' })
  cpf: string;

  @IsEmail()
  email: string;
}
