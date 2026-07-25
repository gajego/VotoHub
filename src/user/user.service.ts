import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { encript } from 'src/shared/crypt';
import { ROLE } from 'src/shared/enum/user';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async ensureInitialAdmin() {
    const usersCount = await this.usersRepository.count();
    if (usersCount > 0) {
      return false;
    }

    const defaultAdmin = {
      fullName: process.env.DEFAULT_ADMIN_FULL_NAME,
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
      role: (process.env.DEFAULT_ADMIN_ROLE as ROLE) ?? ROLE.ADMIN,
    };

    try {
      const adminCreated = await this.usersRepository.save({
        ...defaultAdmin,
        password: await encript(defaultAdmin.password),
      });

      this.logger.log(`Usuário ADMIN inicial criado: ${adminCreated.email}`);
      return true;
    } catch (error: any) {
      if (error?.code === '23505' || error?.code === 'SQLITE_CONSTRAINT') {
        return false;
      }

      throw error;
    }
  }

  async create(createUserDto: CreateUserDto) {
    const hasUser = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (hasUser?.id)
      throw new HttpException(
        'Nome de usuário já está em uso',
        HttpStatus.NOT_ACCEPTABLE,
      );

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      password: await encript(createUserDto.password),
    });

    if (!userCreated?.id)
      throw new HttpException(
        'Erro ao cadastrar, por favor, tente novamento mais tarde',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    const token = await this.jwtService.signAsync(
      {
        id: userCreated.id,
        email: userCreated.email,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      },
    );
    return { access_token: token };
  }

  async createByAdmin(createUserDto: CreateUserDto, adminId: number) {
    const admin = await this.usersRepository.findOneBy({ id: adminId });

    if (!admin) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    if (admin.role !== 'ADMIN') {
      throw new HttpException(
        'Apenas admin pode criar usuários',
        HttpStatus.FORBIDDEN,
      );
    }

    const hasUser = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (hasUser?.id)
      throw new HttpException(
        'Nome de usuário já está em uso',
        HttpStatus.NOT_ACCEPTABLE,
      );

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      password: await encript(createUserDto.password),
    });

    if (!userCreated?.id)
      throw new HttpException(
        'Erro ao cadastrar, por favor, tente novamento mais tarde',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return userCreated;
  }

  async findOneByUsername(email: string) {
    const user = await this.usersRepository.findOneBy({ email });
    if (user) return user;
    throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
  }

  async findOneById(targetId: number, requesterId: number) {
    const requester = await this.usersRepository.findOneBy({
      id: requesterId,
    });
    if (!requester || requester.role !== 'ADMIN') {
      throw new HttpException(
        'Apenas admin pode visualizar usuários',
        HttpStatus.FORBIDDEN,
      );
    }

    const user = await this.usersRepository.findOne({
      where: { id: targetId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async createDefault(createUserDto: CreateUserDto) {
    const hasUser = await this.usersRepository.findOneBy({
      email: createUserDto.email,
    });
    if (hasUser?.id) return false;

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      password: await encript(createUserDto.password),
    });

    const token = await this.jwtService.signAsync(
      {
        id: userCreated.id,
        email: userCreated.email,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      },
    );
    return { access_token: token };
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    requesterId?: number,
  ) {
    if (requesterId) {
      const requester = await this.usersRepository.findOneBy({
        id: requesterId,
      });
      if (!requester || requester.role !== 'ADMIN') {
        throw new HttpException(
          'Apenas admin pode listar usuários',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safePage = Math.max(page, 1);
    const skip = (safePage - 1) * safeLimit;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.where(
        '(LOWER(user.fullName) LIKE :search OR LOWER(user.email) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(safeLimit)
      .getManyAndCount();

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async delete(targetUserId: number, requesterUserId: number) {
    const requester = await this.usersRepository.findOneBy({
      id: requesterUserId,
    });

    if (!requester) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    if (requester.role !== 'ADMIN') {
      throw new HttpException(
        'Apenas admin pode deletar usuários',
        HttpStatus.FORBIDDEN,
      );
    }

    const userToDelete = await this.usersRepository.findOneBy({
      id: targetUserId,
    });

    if (!userToDelete) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    userToDelete.isActive = false;
    await this.usersRepository.save(userToDelete);

    return { message: 'Usuário deletado com sucesso' };
  }

  async update(
    targetUserId: number,
    updateUserDto: any,
    requesterUserId: number,
  ) {
    const requestor = await this.usersRepository.findOneBy({
      id: requesterUserId,
    });

    if (!requestor) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    const userToUpdate = await this.usersRepository.findOneBy({
      id: targetUserId,
    });

    if (!userToUpdate) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    if (updateUserDto.email && userToUpdate.email !== updateUserDto.email) {
      const userByUserName = await this.usersRepository.findOneBy({
        email: updateUserDto.email,
      });
      if (userByUserName) {
        throw new HttpException(
          'Nome de usuário já está em uso',
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
    }

    const isOwner = targetUserId === requesterUserId;
    const isAdmin = requestor.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      throw new HttpException(
        'Você não tem permissão para editar este usuário',
        HttpStatus.FORBIDDEN,
      );
    }

    if (updateUserDto.password) {
      updateUserDto.password = await encript(updateUserDto.password);
    }

    const updatedUser = await this.usersRepository.save({
      ...userToUpdate,
      ...updateUserDto,
    });

    return updatedUser;
  }
}
