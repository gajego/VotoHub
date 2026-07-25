import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { AuthDto } from './dto/auth.dto';
import { UserService } from 'src/user/user.service';
import { isMatchPass } from 'src/shared/crypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}
  async login(loginDto: AuthDto) {
    const userId = await this.verifyCredentials(loginDto);
    if (userId !== undefined) {
      const user = await this.usersService.findOneByUsername(loginDto.username);
      if (!user.isActive)
        throw new HttpException('Usuário não encontrado', HttpStatus.FORBIDDEN);
      const token = await this.jwtService.signAsync(
        {
          username: loginDto.username,
          id: userId,
          role: user?.role,
          fullName: user?.fullName,
          isActive: user?.isActive,
          createdAt: user?.createdAt,
          updatedAt: user?.updatedAt,
        },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '1d',
        },
      );
      return { access_token: token };
    }
    throw new HttpException('Crendenciais inválidas', HttpStatus.UNAUTHORIZED);
  }

  async verifyCredentials(loginDto: AuthDto): Promise<number | undefined> {
    const user = await this.usersService.findOneByUsername(loginDto.username);
    if (user && (await isMatchPass(loginDto.password, user.password))) {
      return user.id;
    }
  }
}
