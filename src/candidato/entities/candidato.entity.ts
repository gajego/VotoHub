import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Votacao } from 'src/votacao/entities/votacao.entity';
import { Voto } from 'src/votacao/entities/voto.entity';

@Entity()
export class Candidato {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  nome: string;

  @Column({ unique: true })
  email: string;

  @ManyToMany(() => Votacao, (votacao) => votacao.candidatos)
  votacoes: Votacao[];

  @OneToMany(() => Voto, (voto) => voto.candidato)
  votos: Voto[];
}
