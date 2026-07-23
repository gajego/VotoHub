import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { CreateVotacaoDto } from './dto/create-votacao.dto';
import { UpdateVotacaoDto } from './dto/update-votacao.dto';
import { CreateVotoDto } from './dto/create-voto.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Votacao } from './entities/votacao.entity';
import { Voto } from './entities/voto.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class VotacaoService {
  constructor(
    @InjectRepository(Votacao)
    private readonly votacaoRepository: Repository<Votacao>,
    @InjectRepository(Voto)
    private readonly votoRepository: Repository<Voto>,
    @InjectRepository(Candidato)
    private readonly candidatoRepository: Repository<Candidato>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createVotacaoDto: CreateVotacaoDto) {
    const { startDate, endDate } = this.parseDates(createVotacaoDto);
    const candidatos = await this.getCandidates(createVotacaoDto.candidatoIds);
    const votacao = await this.votacaoRepository.save({
      title: createVotacaoDto.title,
      description: createVotacaoDto.description,
      startDate,
      endDate,
      candidatos,
    });
    return this.serializeElection(votacao);
  }

  async findAll() {
    const votacoes = await this.votacaoRepository.find({
      relations: { candidatos: true },
      order: { startDate: 'DESC' },
    });
    return votacoes.map((votacao) => this.serializeElection(votacao));
  }

  async findOne(id: number) {
    const votacao = await this.findElectionEntity(id);
    return this.serializeElection(votacao);
  }

  private async findElectionEntity(id: number) {
    const votacao = await this.votacaoRepository.findOne({
      where: { id },
      relations: { candidatos: true },
    });
    if (!votacao) {
      throw new HttpException('Votação não encontrada', HttpStatus.NOT_FOUND);
    }
    return votacao;
  }

  async update(id: number, updateVotacaoDto: UpdateVotacaoDto) {
    const votacao = await this.findElectionEntity(id);
    const dates = this.parseDates(updateVotacaoDto, votacao);
    Object.assign(votacao, dates, {
      ...(updateVotacaoDto.title !== undefined && {
        title: updateVotacaoDto.title,
      }),
      ...(updateVotacaoDto.description !== undefined && {
        description: updateVotacaoDto.description,
      }),
    });
    if (updateVotacaoDto.candidatoIds !== undefined) {
      votacao.candidatos = await this.getCandidates(
        updateVotacaoDto.candidatoIds,
      );
    }
    const updated = await this.votacaoRepository.save(votacao);
    return this.serializeElection(updated);
  }

  async remove(id: number) {
    const votacao = await this.findElectionEntity(id);
    await this.votacaoRepository.remove(votacao);
    return { message: 'Votação removida com sucesso' };
  }

  async votar(votacaoId: number, userId: number, createVotoDto: CreateVotoDto) {
    const votacao = await this.votacaoRepository.findOne({
      where: { id: votacaoId },
      relations: { candidatos: true },
    });
    if (!votacao) {
      throw new HttpException('Votação não encontrada', HttpStatus.NOT_FOUND);
    }

    const now = new Date();
    if (now < votacao.startDate || now > votacao.endDate) {
      throw new BadRequestException('Votação fora do período permitido');
    }

    const candidato = votacao.candidatos.find(
      (item) => item.id === createVotoDto.candidatoId,
    );
    if (!candidato) {
      throw new BadRequestException('Candidato não participa desta votação');
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const existingVote = await this.votoRepository.findOne({
      where: { votacao: { id: votacaoId }, user: { id: userId } },
    });
    if (existingVote) {
      throw new ConflictException('Usuário já votou nesta votação');
    }

    try {
      const voto = await this.votoRepository.save({
        votacao,
        candidato,
        user,
        fingerprint: createVotoDto.fingerprint,
      });
      return { id: voto.id, message: 'Voto registrado com sucesso' };
    } catch (error: any) {
      if (error?.code === '23505' || error?.code === 'SQLITE_CONSTRAINT') {
        throw new ConflictException('Usuário já votou nesta votação');
      }
      throw error;
    }
  }

  findVotesById(id: string) {
    return this.findVotes({ votacao: { id } });
  }

  findVotesByDate(date: string) {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Data inválida');
    }
    const start = new Date(parsedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return this.findVotes({
      votacao: {
        startDate: MoreThanOrEqual(start),
        endDate: LessThanOrEqual(end),
      },
    });
  }

  private findVotes(where: any) {
    return this.votoRepository
      .find({
        where,
        relations: { user: true, candidato: true, votacao: true },
        order: { createdAt: 'ASC' },
      })
      .then((votos) =>
        votos.map(({ user, ...voto }) => ({
          ...voto,
          votacao: this.serializeElection(voto.votacao),
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
          },
        })),
      );
  }

  private serializeElection(votacao: Votacao) {
    return {
      ...votacao,
      startDate: this.formatDateForApi(votacao.startDate),
      endDate: this.formatDateForApi(votacao.endDate),
    };
  }

  private formatDateForApi(value: Date) {
    const timeZone = process.env.VOTING_TIMEZONE ?? 'America/Sao_Paulo';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'longOffset',
    }).formatToParts(value);
    const values = Object.fromEntries(
      parts.map(({ type, value: partValue }) => [type, partValue]),
    );
    const offset = values.timeZoneName.replace('GMT', '') || '+00:00';
    return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}${offset}`;
  }

  private async getCandidates(ids: string[] = []) {
    const candidatos = ids.length
      ? await this.candidatoRepository.findBy({ id: In(ids) })
      : [];
    if (candidatos.length !== new Set(ids).size) {
      throw new HttpException(
        'Um ou mais candidatos não foram encontrados',
        HttpStatus.NOT_FOUND,
      );
    }
    return candidatos;
  }

  private parseDates(
    dto: Partial<CreateVotacaoDto>,
    current?: Votacao,
  ): { startDate: Date; endDate: Date } {
    const startDate = new Date(dto.startDate ?? current?.startDate);
    const endDate = new Date(dto.endDate ?? current?.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Datas da votação inválidas');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('startDate deve ser anterior a endDate');
    }
    return { startDate, endDate };
  }
}
