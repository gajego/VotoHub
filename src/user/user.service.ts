import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { encript } from 'src/shared/crypt';
import { ROLE } from 'src/shared/enum/user';
import { Candidato } from 'src/candidato/entities/candidato.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { Brackets } from 'typeorm';

type UserListSortField =
  | 'createdAt'
  | 'updatedAt'
  | 'fullName'
  | 'username'
  | 'email'
  | 'role'
  | 'isActive';

type UserListSortOrder = 'ASC' | 'DESC';

interface FindAllUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  fullName?: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
  requesterId?: number;
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Candidato)
    private candidatoRepository: Repository<Candidato>,
    private jwtService: JwtService,
  ) {}

  async ensureInitialAdmin() {
    const usersCount = await this.usersRepository.count();
    if (usersCount > 0) {
      return false;
    }

    const defaultAdmin = {
      fullName: process.env.DEFAULT_ADMIN_FULL_NAME,
      username: process.env.DEFAULT_ADMIN_USERNAME,
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
      role: (process.env.DEFAULT_ADMIN_ROLE as ROLE) ?? ROLE.ADMIN,
    };

    if (
      !defaultAdmin.fullName ||
      !defaultAdmin.username ||
      !defaultAdmin.password
    ) {
      throw new Error('Configuração do administrador inicial incompleta.');
    }

    try {
      await this.ensureUsernameAvailable(defaultAdmin.username);
      if (defaultAdmin.email) {
        if (defaultAdmin.email) {
          await this.ensureEmailAvailable(defaultAdmin.email);
        }
      }

      const adminCreated = await this.usersRepository.save({
        ...defaultAdmin,
        email: defaultAdmin.email ?? null,
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
    await this.ensureUsernameAvailable(createUserDto.username);
    if (createUserDto.email) {
      await this.ensureEmailAvailable(createUserDto.email);
    }

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      email: createUserDto.email ?? null,
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
        username: userCreated.username,
        email: userCreated.email,
        fullName: userCreated.fullName,
        role: userCreated.role,
        isActive: userCreated.isActive,
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

    await this.ensureUsernameAvailable(createUserDto.username);
    if (createUserDto.email) {
      await this.ensureEmailAvailable(createUserDto.email);
    }

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      email: createUserDto.email ?? null,
      password: await encript(createUserDto.password),
    });

    if (!userCreated?.id)
      throw new HttpException(
        'Erro ao cadastrar, por favor, tente novamento mais tarde',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );

    return userCreated;
  }

  async findOneByUsername(username: string) {
    const user = await this.usersRepository.findOneBy({ username });
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
        username: true,
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
    await this.ensureUsernameAvailable(createUserDto.username);
    if (createUserDto.email) {
      const emailAvailable = await this.isEmailAvailable(createUserDto.email);
      if (!emailAvailable) return false;
    }

    const userCreated = await this.usersRepository.save({
      ...createUserDto,
      email: createUserDto.email ?? null,
      password: await encript(createUserDto.password),
    });

    const token = await this.jwtService.signAsync(
      {
        id: userCreated.id,
        username: userCreated.username,
        email: userCreated.email,
        fullName: userCreated.fullName,
        role: userCreated.role,
        isActive: userCreated.isActive,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '1d',
      },
    );
    return { access_token: token };
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
    fullName,
    username,
    email,
    role,
    status,
    sortBy,
    sortOrder,
    requesterId,
  }: FindAllUsersParams = {}) {
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

    const sortFieldMap: Record<UserListSortField, string> = {
      createdAt: 'user.createdAt',
      updatedAt: 'user.updatedAt',
      fullName: 'user.fullName',
      username: 'user.username',
      email: 'user.email',
      role: 'user.role',
      isActive: 'user.isActive',
    };

    const allowedSortFields: UserListSortField[] = [
      'createdAt',
      'updatedAt',
      'fullName',
      'username',
      'email',
      'role',
      'isActive',
    ];

    const normalizedSortBy = allowedSortFields.includes(
      sortBy as UserListSortField,
    )
      ? (sortBy as UserListSortField)
      : 'createdAt';
    const normalizedSortOrder: UserListSortOrder =
      sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const normalizedSearch = search?.trim().toLowerCase();
    const normalizedFullName = fullName?.trim().toLowerCase();
    const normalizedUsername = username?.trim().toLowerCase();
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedRole = role?.trim().toUpperCase();
    const normalizedStatus = status?.trim().toLowerCase();

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.fullName',
        'user.username',
        'user.email',
        'user.role',
        'user.isActive',
        'user.createdAt',
        'user.updatedAt',
      ])
      .where('1 = 1')
      .orderBy(sortFieldMap[normalizedSortBy], normalizedSortOrder)
      .addOrderBy('user.id', 'DESC');

    if (normalizedSearch) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('LOWER(user.fullName) LIKE :search', {
            search: `%${normalizedSearch}%`,
          })
            .orWhere('LOWER(user.username) LIKE :search', {
              search: `%${normalizedSearch}%`,
            })
            .orWhere("COALESCE(LOWER(user.email), '') LIKE :search", {
              search: `%${normalizedSearch}%`,
            });
        }),
      );
    }

    if (normalizedFullName) {
      queryBuilder.andWhere('LOWER(user.fullName) LIKE :fullName', {
        fullName: `%${normalizedFullName}%`,
      });
    }

    if (normalizedUsername) {
      queryBuilder.andWhere('LOWER(user.username) LIKE :username', {
        username: `%${normalizedUsername}%`,
      });
    }

    if (normalizedEmail) {
      queryBuilder.andWhere("COALESCE(LOWER(user.email), '') LIKE :email", {
        email: `%${normalizedEmail}%`,
      });
    }

    if (normalizedRole && normalizedRole !== 'ALL') {
      queryBuilder.andWhere('user.role = :role', {
        role: normalizedRole,
      });
    }

    if (normalizedStatus && normalizedStatus !== 'ALL') {
      queryBuilder.andWhere('user.isActive = :isActive', {
        isActive: normalizedStatus === 'active',
      });
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

    if (targetUserId === requesterUserId) {
      throw new HttpException(
        'Você não pode excluir a si mesmo',
        HttpStatus.FORBIDDEN,
      );
    }

    const userToDelete = await this.usersRepository.findOneBy({
      id: targetUserId,
    });

    if (!userToDelete) {
      throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND);
    }

    await this.usersRepository.delete(targetUserId);

    return { message: 'Usuário deletado com sucesso' };
  }

  async update(
    targetUserId: number,
    updateUserDto: UpdateUserDto,
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

    if (
      updateUserDto.email !== undefined &&
      userToUpdate.email !== updateUserDto.email
    ) {
      await this.ensureEmailAvailable(updateUserDto.email, targetUserId);
    }

    if (
      updateUserDto.username &&
      userToUpdate.username !== updateUserDto.username
    ) {
      await this.ensureUsernameAvailable(updateUserDto.username, targetUserId);
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

  private async ensureEmailAvailable(email: string, userId?: number) {
    const isAvailable = await this.isEmailAvailable(email, userId);

    if (!isAvailable) {
      throw new HttpException(
        'E-mail já está em uso',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
  }

  private async ensureUsernameAvailable(username: string, userId?: number) {
    const isAvailable = await this.isUsernameAvailable(username, userId);

    if (!isAvailable) {
      throw new HttpException(
        'Nome de usuário já está em uso',
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
  }

  private async isEmailAvailable(email: string, userId?: number) {
    const userConflict = await this.usersRepository.findOneBy({ email });
    if (userConflict && userConflict.id !== userId) {
      return false;
    }

    const candidatoConflict = await this.candidatoRepository.findOneBy({
      email,
    });
    if (candidatoConflict) {
      return false;
    }

    return true;
  }

  private async isUsernameAvailable(username: string, userId?: number) {
    const userConflict = await this.usersRepository.findOneBy({ username });
    if (userConflict && userConflict.id !== userId) {
      return false;
    }

    return true;
  }
}
