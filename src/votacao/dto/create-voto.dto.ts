import { IsNotEmpty, IsNumber, IsString, ValidateIf } from 'class-validator';

export class CreateVotoDto {
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsNumber()
  candidatoId?: number | null;

  @IsString()
  @IsNotEmpty()
  fingerprint: string;
}
