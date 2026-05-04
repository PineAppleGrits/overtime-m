import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_SIGNED_URL_TTL_SECONDS } from './storage.constants';

export interface UploadFileInput {
  bucket: string;
  storageKey: string;
  body: Buffer | Uint8Array | Blob | ArrayBuffer;
  contentType: string;
  upsert?: boolean;
}

/**
 * Adapter de bajo nivel sobre Supabase Storage. No conoce MediaAsset.
 *
 * Para flujos de dominio usar `MediaAssetService`, que combina este adapter
 * con la persistencia del registro `MediaAsset`.
 */
@Injectable()
export class SupabaseStorageService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private client!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const url = this.config.get<string>('supabase.url');
    const serviceRoleKey = this.config.get<string>('supabase.serviceRoleKey');

    if (!url || !serviceRoleKey) {
      this.logger.warn(
        'Supabase URL o service role key no configurados — storage no funcionará en runtime.',
      );
      return;
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
  }

  async upload(input: UploadFileInput): Promise<void> {
    this.assertReady();
    const { error } = await this.client.storage
      .from(input.bucket)
      .upload(input.storageKey, input.body as Buffer, {
        contentType: input.contentType,
        upsert: input.upsert ?? false,
      });
    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }
  }

  /**
   * Genera una signed URL para un archivo en bucket privado.
   * Para buckets públicos, usar `getPublicUrl`.
   */
  async getSignedUrl(
    bucket: string,
    storageKey: string,
    ttlSeconds: number = DEFAULT_SIGNED_URL_TTL_SECONDS,
  ): Promise<string> {
    this.assertReady();
    const { data, error } = await this.client.storage
      .from(bucket)
      .createSignedUrl(storageKey, ttlSeconds);
    if (error || !data) {
      throw new Error(
        `Supabase signed URL failed: ${error?.message ?? 'no data returned'}`,
      );
    }
    return data.signedUrl;
  }

  getPublicUrl(bucket: string, storageKey: string): string {
    this.assertReady();
    const { data } = this.client.storage.from(bucket).getPublicUrl(storageKey);
    return data.publicUrl;
  }

  async delete(bucket: string, storageKey: string): Promise<void> {
    this.assertReady();
    const { error } = await this.client.storage
      .from(bucket)
      .remove([storageKey]);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  async deleteMany(bucket: string, storageKeys: string[]): Promise<void> {
    if (storageKeys.length === 0) return;
    this.assertReady();
    const { error } = await this.client.storage.from(bucket).remove(storageKeys);
    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  private assertReady(): void {
    if (!this.client) {
      throw new Error(
        'SupabaseStorageService no inicializado — verificar SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
  }
}
