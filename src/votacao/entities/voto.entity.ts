import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { Votacao } from './votacao.entity';

@Entity()
@Index(['votacao', 'user'], { unique: true })
export class Voto {
  @PrimaryGeneratedColumn('increment')
  id: string;

  @ManyToOne(() => Votacao, (votacao) => votacao.votos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  votacao: Votacao;

  @ManyToOne(() => Candidato, (candidato) => candidato.votos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  candidato: Candidato | null;

  @ManyToOne(() => User, (user) => user.votos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ unique: true, nullable: false })
  identifier: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt: Date;
}
