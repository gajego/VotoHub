import { Module } from '@nestjs/common';
import { CandidatoService } from './candidato.service';
import { CandidatoController } from './candidato.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Candidato } from './entities/candidato.entity';

@Module({
  controllers: [CandidatoController],
  providers: [CandidatoService],
  imports: [TypeOrmModule.forFeature([Candidato])],
})
export class CandidatoModule {}
