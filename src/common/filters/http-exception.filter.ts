import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorCode = exception.name || 'HTTP_EXCEPTION';
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as any;
        message = Array.isArray(resObj.message)
          ? resObj.message.join(', ')
          : resObj.message || exception.message;
        errorCode = resObj.error || exception.name || 'HTTP_EXCEPTION';
      }
    } else if (isMongoCastError(exception)) {
      status = HttpStatus.BAD_REQUEST;
      message = 'That record id is not valid.';
      errorCode = 'INVALID_ID';
      this.logger.warn(`Rejected invalid id: ${exception.message}`);
    } else if (exception instanceof Error) {
      message = exception.message;
      errorCode = exception.name || 'UNKNOWN_ERROR';
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      success: false,
      message,
      errorCode: errorCode.toUpperCase().replace(/\s+/g, '_'),
    });
  }
}

function isMongoCastError(exception: unknown): exception is Error {
  return (
    exception instanceof Error &&
    exception.name === 'CastError' &&
    exception.message.includes('ObjectId')
  );
}
