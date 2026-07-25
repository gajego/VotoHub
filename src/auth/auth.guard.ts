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

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

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
      request['user'] = payload;
    } catch (error: any) {
      if (error?.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Sessão expirada');
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
