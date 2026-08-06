import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ROLE } from 'src/shared/enum/user';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    const routePath = `${request.baseUrl ?? ''}${request.route?.path ?? ''}`;
    if (
      publicRoutes().some(
        (publicRoute) =>
          routePath === publicRoute.path &&
          request.method === publicRoute.method,
      )
    ) {
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('Acesso não autorizado');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      const requesterId = Number(payload?.id);
      if (!Number.isInteger(requesterId)) {
        throw new UnauthorizedException('Acesso não autorizado');
      }

      const requester = await this.userService.findOneForAuth(requesterId);
      if (!requester) {
        throw new UnauthorizedException('Acesso não autorizado');
      }

      if (!requester.isActive) {
        throw new ForbiddenException('Usuário inativo');
      }

      request['user'] = {
        ...payload,
        id: requester.id,
        username: requester.username,
        fullName: requester.fullName,
        email: requester.email,
        role: requester.role,
        isActive: requester.isActive,
      };
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Sessão expirada');
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException();
    }

    if (
      request.user.role !== ROLE.ADMIN &&
      !userRoutes().some(
        (userRoute) =>
          routePath === userRoute.path && request.method === userRoute.method,
      )
    ) {
      throw new ForbiddenException(
        'Acesso permitido apenas para administradores',
      );
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

function publicRoutes() {
  return [
    {
      path: '/auth/login',
      method: 'POST',
    },
    {
      path: '/user/register',
      method: 'POST',
    },
    {
      path: '/auth/verifyToken',
      method: 'POST',
    },
  ];
}

function userRoutes() {
  return [
    {
      path: '/votacao',
      method: 'GET',
    },
    {
      path: '/votacao/:id/votar',
      method: 'POST',
    },
  ];
}
