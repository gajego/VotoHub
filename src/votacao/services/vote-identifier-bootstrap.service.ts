import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { IsNull, Repository } from 'typeorm';
import { Voto } from '../entities/voto.entity';

@Injectable()
export class VoteIdentifierBootstrapService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Voto)
    private readonly votoRepository: Repository<Voto>,
  ) {}

  async onApplicationBootstrap() {
    const votosSemIdentifier = await this.votoRepository.find({
      where: { identifier: IsNull() },
    });

    if (votosSemIdentifier.length === 0) {
      return;
    }

    await this.votoRepository.save(
      votosSemIdentifier.map((voto) => ({
        ...voto,
        identifier: randomUUID(),
      })),
    );
  }
}
