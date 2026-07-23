import { Test, TestingModule } from '@nestjs/testing';
import { VotacaoService } from './votacao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votacao } from './entities/votacao.entity';
import { Voto } from './entities/voto.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { User } from 'src/user/entities/user.entity';

describe('VotacaoService', () => {
  let service: VotacaoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotacaoService,
        { provide: getRepositoryToken(Votacao), useValue: {} },
        { provide: getRepositoryToken(Voto), useValue: {} },
        { provide: getRepositoryToken(Candidato), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
      ],
    }).compile();

    service = module.get<VotacaoService>(VotacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
