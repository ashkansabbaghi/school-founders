export const DIRECTORY_BACKUP_ID = 'default' as const

export type DirectoryBackupPermission = 'granted' | 'denied' | 'prompt'

export interface DirectoryBackupRecord {
  id: typeof DIRECTORY_BACKUP_ID
  directoryHandle: FileSystemDirectoryHandle
  directoryName: string
  connectedAt: string
  lastWrittenAt: string | null
  lastWrittenDate: string | null
  lastError: string | null
}

export interface DirectoryBackupStatus {
  supported: boolean
  connected: boolean
  directoryName: string | null
  permission: DirectoryBackupPermission | null
  lastWrittenAt: string | null
  lastWrittenDate: string | null
  lastError: string | null
  connectedAt: string | null
}
