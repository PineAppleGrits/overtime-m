/**
 * Contrato del integrador con Google Drive (RN-051).
 *
 * Decisión W3.2: dejamos sólo el contrato + adapter STUB. La integración real
 * con Google Drive API se implementa después (requiere service account
 * credentials y reglas de carpeta padre por torneo).
 */
export interface CreateMatchFolderInput {
  matchId: string;
  /** Nombre completo de la carpeta — formato definido por DP-015. */
  name: string;
  /** Carpeta padre opcional (si se quiere organizar por torneo/categoría). */
  parentFolderId?: string;
}

export interface CreateMatchFolderOutput {
  folderId: string;
  folderUrl: string;
}

export interface IGoogleDrivePort {
  createMatchFolder(
    input: CreateMatchFolderInput,
  ): Promise<CreateMatchFolderOutput>;
}

export const GOOGLE_DRIVE_PORT = Symbol('GOOGLE_DRIVE_PORT');
