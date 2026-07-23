import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateVotoDto {
  @IsNumber()
  @IsNotEmpty()
  candidatoId: number;

  @IsString()
  @IsNotEmpty()
  fingerprint: string;
}
