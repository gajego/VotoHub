import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class DomainMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const allowedDomain = process.env.CORS_MODE;
    if (allowedDomain === '*') next();
    else {
      const requestOrigin = req.headers.origin;
      if (requestOrigin === allowedDomain) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        next();
      } else {
        res.status(403).send('Acesso não autorizado');
        return;
      }
    }
  }
}
