import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { BusinessError } from '../errors/business-error';
import { ErrorCode } from '../errors/error-codes';

/**
 * Catch-all exception filter that handles all uncaught exceptions.
 * Prevents stack traces from leaking in production.
 *
 * Para `BusinessError` (PR0), serializa `{ code, message, details? }` además
 * de los campos comunes. El FE puede matchear por `code` para reaccionar.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let code: ErrorCode = ErrorCode.INTERNAL_ERROR;
    let details: Record<string, unknown> | undefined;

    // BusinessError — exception de dominio con código estable
    if (exception instanceof BusinessError) {
      status = exception.getStatus();
      message = (exception.getResponse() as { message: string }).message;
      code = exception.code;
      details = exception.details;
      error = httpStatusToErrorLabel(status);
    }
    // Handle HTTP exceptions (NestJS built-in)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        error = responseObj.error || error;
      }
      code = httpStatusToErrorCode(status);
    }
    // Handle Prisma errors
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception);
      status = prismaError.status;
      message = prismaError.message;
      error = prismaError.error;
      code = prismaError.code;
    }
    // Handle Prisma validation errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid data provided';
      error = 'Validation Error';
      code = ErrorCode.VALIDATION_FAILED;
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      // Don't expose internal error messages in production
      if (process.env.NODE_ENV === 'production') {
        message = 'An unexpected error occurred';
      } else {
        message = exception.message;
      }
    }

    // Log the full error for debugging
    this.logger.error(
      `[${request.method}] ${request.url} - ${status}: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      code,
      message,
      error,
      ...(details ? { details } : {}),
      // Only include stack trace in development
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && {
          stack: exception.stack,
        }),
    };

    response.status(status).json(errorResponse);
  }

  /**
   * Handle Prisma-specific errors with user-friendly messages
   */
  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
    error: string;
    code: ErrorCode;
  } {
    switch (error.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (error.meta?.target as string[]) || [];
        return {
          status: HttpStatus.CONFLICT,
          message: `A record with this ${target.join(', ')} already exists`,
          error: 'Conflict',
          code: ErrorCode.CONFLICT,
        };
      }

      case 'P2003':
        // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
          error: 'Bad Request',
          code: ErrorCode.VALIDATION_FAILED,
        };

      case 'P2025':
        // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found',
          code: ErrorCode.NOT_FOUND,
        };

      case 'P2014':
        // Required relation violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Required relation is missing',
          error: 'Bad Request',
          code: ErrorCode.VALIDATION_FAILED,
        };

      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message:
            process.env.NODE_ENV === 'production'
              ? 'Database error occurred'
              : error.message,
          error: 'Internal Server Error',
          code: ErrorCode.INTERNAL_ERROR,
        };
    }
  }
}

function httpStatusToErrorCode(status: number): ErrorCode {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return ErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ErrorCode.CONFLICT;
    case HttpStatus.BAD_REQUEST:
      return ErrorCode.VALIDATION_FAILED;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

function httpStatusToErrorLabel(status: number): string {
  switch (status) {
    case HttpStatus.UNAUTHORIZED:
      return 'Unauthorized';
    case HttpStatus.FORBIDDEN:
      return 'Forbidden';
    case HttpStatus.NOT_FOUND:
      return 'Not Found';
    case HttpStatus.CONFLICT:
      return 'Conflict';
    case HttpStatus.BAD_REQUEST:
      return 'Bad Request';
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return 'Unprocessable Entity';
    default:
      return 'Internal Server Error';
  }
}
