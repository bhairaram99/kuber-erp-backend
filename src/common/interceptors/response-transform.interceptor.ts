import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((res) => {
        // If the response is already in the standard format (or null/undefined)
        if (res && typeof res === 'object') {
          if ('success' in res && ('data' in res || 'pagination' in res)) {
            return res;
          }

          // If it's a paginated result with items & pagination
          if ('items' in res && 'pagination' in res) {
            return {
              success: true,
              data: res.items,
              pagination: res.pagination,
            };
          }

          // If message is explicitly provided
          if ('message' in res && 'data' in res) {
            return {
              success: true,
              message: res.message,
              data: res.data,
            };
          }
        }

        return {
          success: true,
          data: res ?? null,
        };
      }),
    );
  }
}
