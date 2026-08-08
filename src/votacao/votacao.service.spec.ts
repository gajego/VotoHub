import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { VotacaoService } from './votacao.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Votacao } from './entities/votacao.entity';
import { Voto } from './entities/voto.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { User } from 'src/user/entities/user.entity';

describe('VotacaoService', () => {
  let service: VotacaoService;
  let votacaoRepository: { findOne: ReturnType<typeof jest.fn> };
  let votoRepository: { find: ReturnType<typeof jest.fn> };

  beforeEach(async () => {
    votacaoRepository = { findOne: jest.fn() };
    votoRepository = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VotacaoService,
        { provide: getRepositoryToken(Votacao), useValue: votacaoRepository },
        { provide: getRepositoryToken(Voto), useValue: votoRepository },
        { provide: getRepositoryToken(Candidato), useValue: {} },
        { provide: getRepositoryToken(User), useValue: {} },
      ],
    }).compile();

    service = module.get<VotacaoService>(VotacaoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns vote counters with voter identities but without vote choices', async () => {
    const election = {
      id: 7,
      title: 'Eleição central',
      description: 'Teste',
      startDate: new Date('2026-08-07T10:00:00.000Z'),
      endDate: new Date('2026-08-07T12:00:00.000Z'),
      candidatos: [
        {
          id: 1,
          nome: 'Ana',
          cpf: null,
          email: 'ana@teste.com',
          image: null,
          imageContentType: null,
        },
        {
          id: 2,
          nome: 'Bruno',
          cpf: null,
          email: 'bruno@teste.com',
          image: null,
          imageContentType: null,
        },
      ],
    };

    votacaoRepository.findOne.mockResolvedValue(election);
    votoRepository.find.mockResolvedValue([
      {
        voteType: 'VALID',
        candidato: election.candidatos[0],
        user: {
          id: 11,
          fullName: 'Maria Silva',
          username: 'maria',
          email: 'maria@teste.com',
        },
        createdAt: new Date('2026-08-07T10:05:00.000Z'),
      },
      {
        voteType: 'BLANK',
        candidato: null,
        user: {
          id: 12,
          fullName: 'João Souza',
          username: 'joao',
          email: null,
        },
        createdAt: new Date('2026-08-07T10:08:00.000Z'),
      },
      {
        voteType: 'NULL',
        candidato: null,
        user: {
          id: 13,
          fullName: 'Clara Lima',
          username: 'clara',
          email: 'clara@teste.com',
        },
        createdAt: new Date('2026-08-07T10:10:00.000Z'),
      },
    ]);

    const result = await service.findCountersById('7');

    expect(result.totalVotes).toBe(3);
    expect(result.validVotes).toBe(1);
    expect(result.blankVotes).toBe(1);
    expect(result.nullVotes).toBe(1);
    expect(result.candidateStats).toEqual([
      expect.objectContaining({
        candidate: expect.objectContaining({ id: 1, nome: 'Ana' }),
        votes: 1,
      }),
      expect.objectContaining({
        candidate: expect.objectContaining({ id: 2, nome: 'Bruno' }),
        votes: 0,
      }),
    ]);
    expect(result.voters).toEqual([
      expect.objectContaining({
        id: 11,
        fullName: 'Maria Silva',
        username: 'maria',
        email: 'maria@teste.com',
      }),
      expect.objectContaining({
        id: 12,
        fullName: 'João Souza',
        username: 'joao',
        email: null,
      }),
      expect.objectContaining({
        id: 13,
        fullName: 'Clara Lima',
        username: 'clara',
        email: 'clara@teste.com',
      }),
    ]);
    expect(result.voters[0]).not.toHaveProperty('candidato');
  });
});
