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

  @Column({ type: 'varchar', length: 14 })
  cpf: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'bytea', nullable: true })
  image: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  imageContentType: string | null;

  @ManyToMany(() => Votacao, (votacao) => votacao.candidatos)
  votacoes: Votacao[];

  @OneToMany(() => Voto, (voto) => voto.candidato)
  votos: Voto[];
}
