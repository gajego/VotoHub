import { Module } from '@nestjs/common';
import { VotacaoService } from './votacao.service';
import { VotacaoController } from './votacao.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Votacao } from './entities/votacao.entity';
import { Voto } from './entities/voto.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { UserModule } from 'src/user/user.module';
import { VoteIdentifierBootstrapService } from './services/vote-identifier-bootstrap.service';

@Module({
  controllers: [VotacaoController],
  providers: [VotacaoService, VoteIdentifierBootstrapService],
  imports: [TypeOrmModule.forFeature([Votacao, Voto, Candidato]), UserModule],
})
export class VotacaoModule {}
