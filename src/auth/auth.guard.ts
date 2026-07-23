import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (publicRoutes().some((route) => request.route.path === route.path)) {
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
    // {
    //   path: '/projects/shared',
    //   method: 'GET',
    // },
  ];
}
