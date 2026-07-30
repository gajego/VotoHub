import { ROLE } from 'src/shared/enum/user';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Voto } from 'src/votacao/entities/voto.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({
    unique: false,
  })
  fullName: string;

  @Index({ unique: true })
  @Column({
    unique: true,
  })
  username: string;

  @Index()
  @Column({
    unique: true,
    nullable: true,
  })
  email: string | null;

  @Column()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 50, default: ROLE.USER })
  role: ROLE;

  @OneToMany(() => Voto, (voto) => voto.user)
  votos: Voto[];
}
