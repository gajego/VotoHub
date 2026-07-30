import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return value ?? null;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : null;
}

export class CreateCandidatoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsString()
  cpf?: string | null;

  @Transform(({ value }) => normalizeOptionalString(value))
  @IsOptional()
  @IsEmail()
  email?: string | null;
}
