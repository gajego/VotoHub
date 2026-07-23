import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateCandidatoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  email: string;
}
