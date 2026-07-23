import { Test, TestingModule } from '@nestjs/testing';
import { VotacaoController } from './votacao.controller';
import { VotacaoService } from './votacao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votacao } from './entities/votacao.entity';
import { Voto } from './entities/voto.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { User } from 'src/user/entities/user.entity';

describe('VotacaoController', () => {
  let controller: VotacaoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VotacaoController],
      providers: [
        VotacaoService,
        { provide: getRepositoryToken(Votacao), useValue: {} },
        { provide: getRepositoryToken(Voto), useValue: {} },
        { provide: getRepositoryToken(Candidato), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
      ],
    }).compile();

    controller = module.get<VotacaoController>(VotacaoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
