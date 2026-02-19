import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const statusCode = response.statusCode;
          const duration = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${statusCode} - ${duration}ms`,
          );
        },
        error: (error) => {
          const statusCode = error?.status || response.statusCode || 500;
          const duration = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${statusCode} - ${duration}ms - ${error?.message || 'Internal server error'}`,
          );
        },
      }),
    );
  }
}
