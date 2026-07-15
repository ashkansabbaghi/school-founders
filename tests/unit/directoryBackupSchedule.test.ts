import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DB_NAME } from '~/db/database'
import {
  DIRECTORY_BACKUP_DEBOUNCE_MS,
  cancelScheduledDirectoryBackup,
  parseTableNameFromMutationPart,
  scheduleDirectoryBackup,
  shouldScheduleDirectoryBackup,
  startDirectoryBackupScheduler,
  stopDirectoryBackupScheduler,
} from '~/services/directoryBackupSchedule'

vi.mock('~/services/directoryBackup', () => ({
  writeDirectoryBackup: vi.fn(async () => true),
}))

const { writeDirectoryBackup } = await import('~/services/directoryBackup')

function mutationPart(tableName: string, indexName = ''): string {
  return `idb://${DB_NAME}/${tableName}/${indexName}`
}

describe('directoryBackupSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    stopDirectoryBackupScheduler()
  })

  afterEach(() => {
    stopDirectoryBackupScheduler()
    vi.useRealTimers()
  })

  it('parses table names from Dexie mutation parts', () => {
    expect(parseTableNameFromMutationPart(mutationPart('students'))).toBe('students')
    expect(parseTableNameFromMutationPart(mutationPart('meta'))).toBe('meta')
    expect(parseTableNameFromMutationPart('idb://other-db/students/')).toBeNull()
  })

  it('schedules backups only for business table mutations', () => {
    expect(shouldScheduleDirectoryBackup({
      [mutationPart('students')]: {},
    })).toBe(true)

    expect(shouldScheduleDirectoryBackup({
      [mutationPart('meta')]: {},
      [mutationPart('directoryBackup')]: {},
    })).toBe(false)
  })

  it('debounces backup writes', async () => {
    scheduleDirectoryBackup()
    scheduleDirectoryBackup()
    scheduleDirectoryBackup()

    expect(writeDirectoryBackup).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS - 1)
    expect(writeDirectoryBackup).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(writeDirectoryBackup).toHaveBeenCalledTimes(1)
    expect(writeDirectoryBackup).toHaveBeenCalledWith({ silent: true })
  })

  it('cancels pending debounced writes', async () => {
    scheduleDirectoryBackup()
    cancelScheduledDirectoryBackup()

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).not.toHaveBeenCalled()
  })

  it('listens for committed Dexie mutations and debounces backup writes', async () => {
    startDirectoryBackupScheduler()

    Dexie.on('storagemutated').fire({
      [mutationPart('employees')]: {},
    })
    Dexie.on('storagemutated').fire({
      [mutationPart('employeeTransactions')]: {},
    })

    expect(writeDirectoryBackup).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).toHaveBeenCalledTimes(1)
    expect(writeDirectoryBackup).toHaveBeenCalledWith({ silent: true })
  })

  it('ignores meta and directory backup mutations from the scheduler', async () => {
    startDirectoryBackupScheduler()

    Dexie.on('storagemutated').fire({
      [mutationPart('meta')]: {},
      [mutationPart('directoryBackup')]: {},
    })

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).not.toHaveBeenCalled()
  })
})
