import {
  DIRECTORY_BACKUP_ID,
  type DirectoryBackupRecord,
} from '#shared/types/directoryBackup'
import { db } from '../database'

function toStatusRecord(
  record: DirectoryBackupRecord & Record<string, unknown>,
): DirectoryBackupRecord {
  return {
    id: DIRECTORY_BACKUP_ID,
    lastWrittenAt: typeof record.lastWrittenAt === 'string' || record.lastWrittenAt === null
      ? record.lastWrittenAt
      : null,
    lastWrittenDate: typeof record.lastWrittenDate === 'string' || record.lastWrittenDate === null
      ? record.lastWrittenDate
      : null,
    lastError: typeof record.lastError === 'string' || record.lastError === null
      ? record.lastError
      : null,
  }
}

export async function getDirectoryBackupRecord(): Promise<DirectoryBackupRecord | undefined> {
  const record = await db.directoryBackup.get(DIRECTORY_BACKUP_ID)

  if (!record) {
    return undefined
  }

  return toStatusRecord(record as DirectoryBackupRecord & Record<string, unknown>)
}

/** Raw row including any legacy handle fields (for one-time root migration). */
export async function getRawDirectoryBackupRecord(): Promise<
  (DirectoryBackupRecord & Record<string, unknown>) | undefined
> {
  return db.directoryBackup.get(DIRECTORY_BACKUP_ID) as Promise<
    (DirectoryBackupRecord & Record<string, unknown>) | undefined
  >
}

export async function saveDirectoryBackupRecord(
  record: DirectoryBackupRecord,
): Promise<void> {
  await db.directoryBackup.put({
    id: DIRECTORY_BACKUP_ID,
    lastWrittenAt: record.lastWrittenAt,
    lastWrittenDate: record.lastWrittenDate,
    lastError: record.lastError,
  })
}

export async function updateDirectoryBackupRecord(
  patch: Partial<Omit<DirectoryBackupRecord, 'id'>>,
): Promise<void> {
  const existing = await getDirectoryBackupRecord()

  await saveDirectoryBackupRecord({
    id: DIRECTORY_BACKUP_ID,
    lastWrittenAt: patch.lastWrittenAt !== undefined
      ? patch.lastWrittenAt
      : existing?.lastWrittenAt ?? null,
    lastWrittenDate: patch.lastWrittenDate !== undefined
      ? patch.lastWrittenDate
      : existing?.lastWrittenDate ?? null,
    lastError: patch.lastError !== undefined
      ? patch.lastError
      : existing?.lastError ?? null,
  })
}

export async function clearDirectoryBackupRecord(): Promise<void> {
  await db.directoryBackup.delete(DIRECTORY_BACKUP_ID)
}
