import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RemovePasswordInterceptor implements NestInterceptor {
  private removePasswordRecursive(data: any): any {
    if (!data) return data;

    // Se é uma Data, retorna sem modificação
    if (data instanceof Date) {
      return data;
    }

    // Se é um array, processa cada item
    if (Array.isArray(data)) {
      return data.map((item) => this.removePasswordRecursive(item));
    }

    // Se é um objeto
    if (typeof data === 'object') {
      const copy = { ...data };

      // Remove password do objeto
      if (copy.hasOwnProperty('password')) {
        delete copy.password;
      }

      // Processa todas as propriedades recursivamente
      for (const key in copy) {
        if (copy.hasOwnProperty(key)) {
          copy[key] = this.removePasswordRecursive(copy[key]);
        }
      }

      return copy;
    }

    return data;
  }

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        return this.removePasswordRecursive(data);
      }),
    );
  }
}
