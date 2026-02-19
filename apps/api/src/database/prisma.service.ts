import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    // Prisma 7: Crear adapter de PostgreSQL
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  /**
   * Soft delete helper - sets deletedAt to current timestamp
   */
  async softDelete(model: string, id: string): Promise<any> {
    return this[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Find many with soft delete filter
   */
  async findManyNotDeleted(model: string, args: any = {}): Promise<any[]> {
    return this[model].findMany({
      ...args,
      where: {
        ...args.where,
        deletedAt: null,
      },
    });
  }

  /**
   * Find unique with soft delete filter
   */
  async findUniqueNotDeleted(model: string, args: any): Promise<any> {
    return this[model].findUnique({
      ...args,
      where: {
        ...args.where,
        deletedAt: null,
      },
    });
  }
}
