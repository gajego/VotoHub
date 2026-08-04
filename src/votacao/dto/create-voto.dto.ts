import { IsIn, IsNumber, IsOptional, ValidateIf } from 'class-validator';
import { VOTE_TYPES, VoteType } from '../types/vote-type';

export class CreateVotoDto {
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsNumber()
  candidatoId?: number | null;

  @IsOptional()
  @IsIn(VOTE_TYPES)
  voteType?: VoteType;
}
