import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { SupabaseStorageService } from './supabase-storage.service';
import { MediaAssetService } from './media-asset.service';

/**
 * Storage es global: cualquier feature puede inyectar `MediaAssetService` o
 * `SupabaseStorageService` sin importar este módulo explícitamente.
 */
@Global()
@Module({
  imports: [DatabaseModule],
  providers: [SupabaseStorageService, MediaAssetService],
  exports: [SupabaseStorageService, MediaAssetService],
})
export class StorageModule {}
