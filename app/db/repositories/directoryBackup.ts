import {
  DIRECTORY_BACKUP_ID,
  type DirectoryBackupRecord,
} from '#shared/types/directoryBackup'
import { db } from '../database'

export async function getDirectoryBackupRecord(): Promise<DirectoryBackupRecord | undefined> {
  return db.directoryBackup.get(DIRECTORY_BACKUP_ID)
}

export async function saveDirectoryBackupRecord(
  record: DirectoryBackupRecord,
): Promise<void> {
  await db.directoryBackup.put(record)
}

export async function updateDirectoryBackupRecord(
  patch: Partial<Omit<DirectoryBackupRecord, 'id'>>,
): Promise<void> {
  const existing = await getDirectoryBackupRecord()

  if (!existing) {
    return
  }

  await db.directoryBackup.put({
    ...existing,
    ...patch,
  })
}

export async function clearDirectoryBackupRecord(): Promise<void> {
  await db.directoryBackup.delete(DIRECTORY_BACKUP_ID)
}
