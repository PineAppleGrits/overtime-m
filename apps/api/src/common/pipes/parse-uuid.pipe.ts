import {
  PipeTransform,
  Injectable,
  BadRequestException,
  ArgumentMetadata,
} from '@nestjs/common';

/**
 * Validates that a string is a valid UUID v4.
 * Provides better error messages than the built-in ParseUUIDPipe.
 */
@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  private readonly uuidV4Regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  // Also accept generic UUID format (v1-v5)
  private readonly uuidGenericRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException(
        `${metadata.data || 'ID'} is required`,
      );
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${metadata.data || 'ID'} must be a string`,
      );
    }

    // Trim whitespace
    const trimmedValue = value.trim();

    // Check if it's a valid UUID
    if (!this.uuidGenericRegex.test(trimmedValue)) {
      throw new BadRequestException(
        `${metadata.data || 'ID'} must be a valid UUID`,
      );
    }

    return trimmedValue;
  }
}

/**
 * Optional UUID pipe - allows undefined/null values
 */
@Injectable()
export class ParseOptionalUUIDPipe implements PipeTransform<string | undefined> {
  private readonly uuidGenericRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): string | undefined {
    if (!value || value === 'undefined' || value === 'null') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(
        `${metadata.data || 'ID'} must be a string`,
      );
    }

    const trimmedValue = value.trim();

    if (!this.uuidGenericRegex.test(trimmedValue)) {
      throw new BadRequestException(
        `${metadata.data || 'ID'} must be a valid UUID`,
      );
    }

    return trimmedValue;
  }
}
