import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { Voto } from './voto.entity';

@Entity()
export class Votacao {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ default: 'Votação sem título' })
  title: string;

  @Column({ type: 'text', default: '' })
  description: string;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ManyToMany(() => Candidato, (candidato) => candidato.votacoes)
  @JoinTable({ name: 'votacao_candidatos' })
  candidatos: Candidato[];

  @OneToMany(() => Voto, (voto) => voto.votacao)
  votos: Voto[];
}
