import Dexie from 'dexie'
import {
  ACCOUNT_DB_NAME_PREFIX,
  LEGACY_DB_NAME,
  getActiveDatabaseOrNull,
} from '~/db/database'
import { writeDirectoryBackup } from '~/services/directoryBackup'

export const DIRECTORY_BACKUP_DEBOUNCE_MS = 300

const LEGACY_MUTATION_PART_PREFIX = `idb://${LEGACY_DB_NAME}/`
const ACCOUNT_MUTATION_PART_PREFIX = `idb://${ACCOUNT_DB_NAME_PREFIX}`

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

export function parseDatabaseNameFromMutationPart(part: string): string | null {
  if (!part.startsWith('idb://')) {
    return null
  }

  const rest = part.slice('idb://'.length)
  const slashIndex = rest.indexOf('/')

  if (slashIndex === -1) {
    return null
  }

  return rest.slice(0, slashIndex)
}

export function parseTableNameFromMutationPart(part: string): string | null {
  let rest: string | null = null

  if (part.startsWith(LEGACY_MUTATION_PART_PREFIX)) {
    rest = part.slice(LEGACY_MUTATION_PART_PREFIX.length)
  }
  else if (part.startsWith(ACCOUNT_MUTATION_PART_PREFIX)) {
    const afterPrefix = part.slice('idb://'.length)
    const firstSlash = afterPrefix.indexOf('/')

    if (firstSlash === -1) {
      return null
    }

    rest = afterPrefix.slice(firstSlash + 1)
  }

  if (rest === null) {
    return null
  }

  const slashIndex = rest.indexOf('/')

  if (slashIndex === -1) {
    return null
  }

  return rest.slice(0, slashIndex)
}

/**
 * Schedule only for business-table mutations on the currently bound active account DB.
 */
export function shouldScheduleDirectoryBackup(parts: StorageMutationParts): boolean {
  const active = getActiveDatabaseOrNull()

  if (!active) {
    return false
  }

  for (const part of Object.keys(parts)) {
    const dbName = parseDatabaseNameFromMutationPart(part)

    if (dbName !== active.name) {
      continue
    }

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
