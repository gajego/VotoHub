import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { Candidato } from 'src/candidato/entities/candidato.entity';

@Module({
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, TypeOrmModule],
  imports: [
    TypeOrmModule.forFeature([User, Candidato]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
})
export class UserModule {}
