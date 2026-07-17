import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ACCOUNT_DB_NAME_PREFIX,
  bindActiveDatabase,
  getActiveDatabaseOrNull,
  openAccountDatabase,
} from '~/db/database'
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

const ACTIVE_ACCOUNT_ID = 'active-account'
const OTHER_ACCOUNT_ID = 'other-account'
const ACTIVE_DB_NAME = `${ACCOUNT_DB_NAME_PREFIX}${ACTIVE_ACCOUNT_ID}`
const OTHER_DB_NAME = `${ACCOUNT_DB_NAME_PREFIX}${OTHER_ACCOUNT_ID}`

function mutationPart(dbName: string, tableName: string, indexName = ''): string {
  return `idb://${dbName}/${tableName}/${indexName}`
}

describe('directoryBackupSchedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    stopDirectoryBackupScheduler()

    const database = openAccountDatabase(ACTIVE_ACCOUNT_ID)
    bindActiveDatabase(database)
  })

  afterEach(() => {
    stopDirectoryBackupScheduler()
    vi.useRealTimers()
  })

  it('parses table names from account database mutation parts', () => {
    expect(
      parseTableNameFromMutationPart('idb://pardisan-account-abc/students/'),
    ).toBe('students')
    expect(
      parseTableNameFromMutationPart('idb://pardisan-account-abc/meta/'),
    ).toBe('meta')
  })

  it('schedules backups only for business table mutations on the active account', () => {
    expect(getActiveDatabaseOrNull()?.name).toBe(ACTIVE_DB_NAME)

    expect(shouldScheduleDirectoryBackup({
      [mutationPart(ACTIVE_DB_NAME, 'students')]: {},
    })).toBe(true)

    expect(shouldScheduleDirectoryBackup({
      [mutationPart(ACTIVE_DB_NAME, 'meta')]: {},
      [mutationPart(ACTIVE_DB_NAME, 'directoryBackup')]: {},
    })).toBe(false)

    expect(shouldScheduleDirectoryBackup({
      [mutationPart(OTHER_DB_NAME, 'students')]: {},
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
      [mutationPart(ACTIVE_DB_NAME, 'employees')]: {},
    })
    Dexie.on('storagemutated').fire({
      [mutationPart(ACTIVE_DB_NAME, 'employeeTransactions')]: {},
    })

    expect(writeDirectoryBackup).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).toHaveBeenCalledTimes(1)
    expect(writeDirectoryBackup).toHaveBeenCalledWith({ silent: true })
  })

  it('ignores mutations from inactive account databases', async () => {
    startDirectoryBackupScheduler()

    Dexie.on('storagemutated').fire({
      [mutationPart(OTHER_DB_NAME, 'students')]: {},
    })

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).not.toHaveBeenCalled()
  })

  it('ignores meta and directory backup mutations from the scheduler', async () => {
    startDirectoryBackupScheduler()

    Dexie.on('storagemutated').fire({
      [mutationPart(ACTIVE_DB_NAME, 'meta')]: {},
      [mutationPart(ACTIVE_DB_NAME, 'directoryBackup')]: {},
    })

    await vi.advanceTimersByTimeAsync(DIRECTORY_BACKUP_DEBOUNCE_MS)

    expect(writeDirectoryBackup).not.toHaveBeenCalled()
  })
})
