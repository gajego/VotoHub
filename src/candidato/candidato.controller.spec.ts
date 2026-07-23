import { Test, TestingModule } from '@nestjs/testing';
import { CandidatoController } from './candidato.controller';
import { CandidatoService } from './candidato.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Candidato } from './entities/candidato.entity';

describe('CandidatoController', () => {
  let controller: CandidatoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CandidatoController],
      providers: [
        CandidatoService,
        { provide: getRepositoryToken(Candidato), useValue: {} },
      ],
    }).compile();

    controller = module.get<CandidatoController>(CandidatoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
