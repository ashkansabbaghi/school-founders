export const DIRECTORY_BACKUP_ID = 'default' as const

export type DirectoryBackupPermission = 'granted' | 'denied' | 'prompt'

/**
 * Per-account backup write status stored in the account IndexedDB.
 * The shared backup-root folder handle lives in the registry (`backupRoot`).
 */
export interface DirectoryBackupRecord {
  id: typeof DIRECTORY_BACKUP_ID
  lastWrittenAt: string | null
  lastWrittenDate: string | null
  lastError: string | null
}

/**
 * Legacy shape from before the backup root moved to the registry.
 * Still readable so handles can be migrated once.
 */
export interface LegacyDirectoryBackupRecord extends DirectoryBackupRecord {
  directoryHandle: FileSystemDirectoryHandle
  directoryName: string
  connectedAt: string
}

export interface DirectoryBackupStatus {
  supported: boolean
  connected: boolean
  /** Name of the shared backup-root folder. */
  directoryName: string | null
  /** Stable subdirectory name for the active account under the backup root. */
  accountFolderName: string | null
  permission: DirectoryBackupPermission | null
  lastWrittenAt: string | null
  lastWrittenDate: string | null
  lastError: string | null
  connectedAt: string | null
}

export function isLegacyDirectoryBackupRecord(
  record: DirectoryBackupRecord | LegacyDirectoryBackupRecord | undefined,
): record is LegacyDirectoryBackupRecord {
  return Boolean(
    record
    && 'directoryHandle' in record
    && record.directoryHandle
    && typeof (record as LegacyDirectoryBackupRecord).directoryHandle === 'object',
  )
}
