import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidato } from './entities/candidato.entity';

@Injectable()
export class CandidatoService {
  constructor(
    @InjectRepository(Candidato)
    private readonly candidatoRepository: Repository<Candidato>,
  ) {}

  async create(createCandidatoDto: CreateCandidatoDto) {
    const existing = await this.candidatoRepository.findOneBy({
      email: createCandidatoDto.email,
    });
    if (existing) {
      throw new HttpException('Candidato já cadastrado', HttpStatus.CONFLICT);
    }
    return this.candidatoRepository.save(createCandidatoDto);
  }

  findAll() {
    return this.candidatoRepository.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const candidato = await this.candidatoRepository.findOneBy({ id });
    if (!candidato) {
      throw new HttpException('Candidato não encontrado', HttpStatus.NOT_FOUND);
    }
    return candidato;
  }

  async update(id: number, updateCandidatoDto: UpdateCandidatoDto) {
    const candidato = await this.findOne(id);
    Object.assign(candidato, updateCandidatoDto);
    return this.candidatoRepository.save(candidato);
  }

  async remove(id: number) {
    const candidato = await this.findOne(id);
    await this.candidatoRepository.remove(candidato);
    return { message: 'Candidato removido com sucesso' };
  }
}
