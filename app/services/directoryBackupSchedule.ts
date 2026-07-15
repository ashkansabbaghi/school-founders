import Dexie from 'dexie'
import { DB_NAME } from '~/db/database'
import { writeDirectoryBackup } from '~/services/directoryBackup'

export const DIRECTORY_BACKUP_DEBOUNCE_MS = 300

const MUTATION_PART_PREFIX = `idb://${DB_NAME}/`

const BACKUP_BUSINESS_TABLES = new Set([
  'schools',
  'students',
  'employees',
  'studentTransactions',
  'employeeTransactions',
  'fixedCosts',
  'founders',
])

type StorageMutationParts = Record<string, unknown>

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let storageListener: ((parts: StorageMutationParts) => void) | null = null

export function parseTableNameFromMutationPart(part: string): string | null {
  if (!part.startsWith(MUTATION_PART_PREFIX)) {
    return null
  }

  const rest = part.slice(MUTATION_PART_PREFIX.length)
  const slashIndex = rest.indexOf('/')

  if (slashIndex === -1) {
    return null
  }

  return rest.slice(0, slashIndex)
}

export function shouldScheduleDirectoryBackup(parts: StorageMutationParts): boolean {
  for (const part of Object.keys(parts)) {
    const tableName = parseTableNameFromMutationPart(part)

    if (tableName && BACKUP_BUSINESS_TABLES.has(tableName)) {
      return true
    }
  }

  return false
}

export function cancelScheduledDirectoryBackup(): void {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

export function scheduleDirectoryBackup(options?: {
  debounceMs?: number
}): void {
  cancelScheduledDirectoryBackup()

  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void writeDirectoryBackup({ silent: true })
  }, options?.debounceMs ?? DIRECTORY_BACKUP_DEBOUNCE_MS)
}

export function startDirectoryBackupScheduler(): void {
  if (storageListener) {
    return
  }

  storageListener = (parts) => {
    if (shouldScheduleDirectoryBackup(parts)) {
      scheduleDirectoryBackup()
    }
  }

  Dexie.on('storagemutated', storageListener)
}

export function stopDirectoryBackupScheduler(): void {
  if (storageListener) {
    Dexie.on('storagemutated').unsubscribe(storageListener)
    storageListener = null
  }

  cancelScheduledDirectoryBackup()
}
