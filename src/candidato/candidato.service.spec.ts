import { Test, TestingModule } from '@nestjs/testing';
import { CandidatoService } from './candidato.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Candidato } from './entities/candidato.entity';

describe('CandidatoService', () => {
  let service: CandidatoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatoService,
        { provide: getRepositoryToken(Candidato), useValue: {} },
      ],
    }).compile();

    service = module.get<CandidatoService>(CandidatoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
