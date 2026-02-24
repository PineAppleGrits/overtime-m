import { Module } from '@nestjs/common';
import { EmailService } from './services/email.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class NotificationsModule {}
