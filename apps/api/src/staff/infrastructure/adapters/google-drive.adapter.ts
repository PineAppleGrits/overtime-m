import { Injectable, Logger } from '@nestjs/common';
import {
  CreateMatchFolderInput,
  CreateMatchFolderOutput,
  IGoogleDrivePort,
} from '../../application/ports/drive.port';

/**
 * RN-051 — Adapter de Google Drive (STUB).
 *
 * Por ahora NO llama a la Drive API: loguea y devuelve un folderId simulado.
 * La integración real requiere:
 *  - Service account credentials.
 *  - Decisión de carpeta padre por torneo (DP-015 + roadmap).
 *  - Manejo de permisos a nivel Drive (RN-051 dice que se gestionan fuera).
 *
 * Cuando se implemente, basta con cambiar este adapter sin tocar el use-case.
 *
 * TODO: implementar Google Drive API integration. Requiere service account credentials.
 */
@Injectable()
export class GoogleDriveAdapter implements IGoogleDrivePort {
  private readonly logger = new Logger(GoogleDriveAdapter.name);

  async createMatchFolder(
    input: CreateMatchFolderInput,
  ): Promise<CreateMatchFolderOutput> {
    this.logger.log(
      `[GoogleDrive STUB] Would create folder for match ${input.matchId} with name "${input.name}"` +
        (input.parentFolderId ? ` parent=${input.parentFolderId}` : ''),
    );
    const folderId = `stub-${input.matchId}`;
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    return { folderId, folderUrl };
  }
}
