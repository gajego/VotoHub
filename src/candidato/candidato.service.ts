import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { File as MulterFile } from 'multer';
import { CreateCandidatoDto } from './dto/create-candidato.dto';
import { UpdateCandidatoDto } from './dto/update-candidato.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidato } from './entities/candidato.entity';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class CandidatoService {
  constructor(
    @InjectRepository(Candidato)
    private readonly candidatoRepository: Repository<Candidato>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createCandidatoDto: CreateCandidatoDto, image?: MulterFile) {
    await this.ensureEmailAvailable(createCandidatoDto.email);

    const candidato = await this.candidatoRepository.save({
      ...createCandidatoDto,
      ...(image && {
        image: image.buffer,
        imageContentType: image.mimetype,
      }),
    });

    return this.serializeCandidate(candidato);
  }

  findAll() {
    return this.candidatoRepository
      .find({ order: { id: 'ASC' } })
      .then((candidatos) =>
        candidatos.map((candidato) => this.serializeCandidate(candidato)),
      );
  }

  async findOne(id: number) {
    const candidato = await this.findCandidateEntity(id);
    return this.serializeCandidate(candidato);
  }

  async update(
    id: number,
    updateCandidatoDto: UpdateCandidatoDto,
    image?: MulterFile,
  ) {
    const candidato = await this.findCandidateEntity(id);

    if (
      updateCandidatoDto.email &&
      updateCandidatoDto.email !== candidato.email
    ) {
      await this.ensureEmailAvailable(updateCandidatoDto.email, id);
    }

    const updated = await this.candidatoRepository.save({
      ...candidato,
      ...updateCandidatoDto,
      ...(image && {
        image: image.buffer,
        imageContentType: image.mimetype,
      }),
    });
    return this.serializeCandidate(updated);
  }

  async remove(id: number) {
    const candidato = await this.findCandidateEntity(id);
    await this.candidatoRepository.remove(candidato);
    return { message: 'Candidato removido com sucesso' };
  }

  private async findCandidateEntity(id: number) {
    const candidato = await this.candidatoRepository.findOneBy({ id });
    if (!candidato) {
      throw new HttpException('Candidato não encontrado', HttpStatus.NOT_FOUND);
    }
    return candidato;
  }

  private async ensureEmailAvailable(email: string, candidatoId?: number) {
    const existingCandidate = await this.candidatoRepository.findOneBy({
      email,
    });
    if (existingCandidate && existingCandidate.id !== candidatoId) {
      throw new HttpException('Candidato já cadastrado', HttpStatus.CONFLICT);
    }

    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new HttpException('Email já está em uso', HttpStatus.CONFLICT);
    }
  }

  private serializeCandidate(candidato: Candidato) {
    const { image, ...rest } = candidato;
    return {
      ...rest,
      image: image ? Buffer.from(image).toString('base64') : null,
      imageContentType: candidato.imageContentType ?? null,
    };
  }
}
