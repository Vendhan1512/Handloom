import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { logger } from '@handloom/logger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Internal server error';
    let details: Record<string, unknown> | unknown[] | undefined;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as Record<string, unknown>;
        message = (resObj['message'] as string) || exception.message;
        details = (resObj['message'] as unknown[]) || undefined;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      logger.error({ err: exception }, 'Unhandled application exception');
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message: Array.isArray(details) ? 'Validation failed' : message,
      error: {
        code: HttpStatus[status] || 'UNKNOWN_ERROR',
        message,
        details: Array.isArray(details) ? details : undefined,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
