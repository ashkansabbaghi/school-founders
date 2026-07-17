import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DIRECTORY_BACKUP_ID,
  type DirectoryBackupRecord,
} from '#shared/types/directoryBackup'
import { META_KEYS } from '#shared/types/meta'
import type { BackupRootRecord } from '~/db/registry'
import { seedTestData } from '../helpers/fixtures'
import { getMetaValue } from '~/db/repositories/meta'
import {
  disconnectBackupDirectory,
  formatDailyBackupFilename,
  formatLocalDateKey,
  getDirectoryBackupStatus,
  isDirectoryBackupSupported,
  reconnectBackupDirectory,
  selectBackupDirectory,
  syncAccountJson,
  writeDirectoryBackup,
} from '~/services/directoryBackup'
import { registry, setActiveAccountId } from '~/db/registry'
import { renameAccount } from '~/db/repositories/accounts'
import { resetTestDatabase } from '../helpers/db'

interface MockWritable {
  write: ReturnType<typeof vi.fn>
  close: ReturnType<typeof vi.fn>
  abort: ReturnType<typeof vi.fn>
}

interface MockDirectoryHandle {
  name: string
  queryPermission: ReturnType<typeof vi.fn>
  requestPermission: ReturnType<typeof vi.fn>
  getFileHandle: ReturnType<typeof vi.fn>
  getDirectoryHandle: ReturnType<typeof vi.fn>
  files: Map<string, { content: string }>
  directories: Map<string, MockDirectoryHandle>
}

const memoryStore: {
  root: BackupRootRecord | null
  accountStatus: DirectoryBackupRecord | null
} = {
  root: null,
  accountStatus: null,
}

vi.mock('~/db/registry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/db/registry')>()

  return {
    ...actual,
    getBackupRootRecord: vi.fn(async () => memoryStore.root ?? undefined),
    saveBackupRootRecord: vi.fn(async (record: Omit<BackupRootRecord, 'id'> & { id?: string }) => {
      memoryStore.root = {
        id: 'default',
        directoryHandle: record.directoryHandle,
        directoryName: record.directoryName,
        connectedAt: record.connectedAt,
      }
    }),
    clearBackupRootRecord: vi.fn(async () => {
      memoryStore.root = null
    }),
  }
})

vi.mock('~/db/repositories/directoryBackup', () => ({
  getDirectoryBackupRecord: vi.fn(async () => memoryStore.accountStatus ?? undefined),
  getRawDirectoryBackupRecord: vi.fn(async () => memoryStore.accountStatus ?? undefined),
  saveDirectoryBackupRecord: vi.fn(async (record: DirectoryBackupRecord) => {
    memoryStore.accountStatus = {
      id: DIRECTORY_BACKUP_ID,
      lastWrittenAt: record.lastWrittenAt,
      lastWrittenDate: record.lastWrittenDate,
      lastError: record.lastError,
    }
  }),
  updateDirectoryBackupRecord: vi.fn(async (patch: Partial<Omit<DirectoryBackupRecord, 'id'>>) => {
    memoryStore.accountStatus = {
      id: DIRECTORY_BACKUP_ID,
      lastWrittenAt: patch.lastWrittenAt !== undefined
        ? patch.lastWrittenAt
        : memoryStore.accountStatus?.lastWrittenAt ?? null,
      lastWrittenDate: patch.lastWrittenDate !== undefined
        ? patch.lastWrittenDate
        : memoryStore.accountStatus?.lastWrittenDate ?? null,
      lastError: patch.lastError !== undefined
        ? patch.lastError
        : memoryStore.accountStatus?.lastError ?? null,
    }
  }),
  clearDirectoryBackupRecord: vi.fn(async () => {
    memoryStore.accountStatus = null
  }),
}))

function createMockWritable(): MockWritable {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    abort: vi.fn().mockResolvedValue(undefined),
  }
}

function createMockDirectoryHandle(options?: {
  name?: string
  permission?: 'granted' | 'denied' | 'prompt'
  requestResult?: 'granted' | 'denied'
  writeError?: Error
}): MockDirectoryHandle {
  const files = new Map<string, { content: string }>()
  const directories = new Map<string, MockDirectoryHandle>()
  let permission = options?.permission ?? 'granted'

  const getFileHandle = vi.fn(async (filename: string, opts?: { create?: boolean }) => {
    if (!files.has(filename) && !opts?.create) {
      throw new Error('File not found')
    }

    if (!files.has(filename)) {
      files.set(filename, { content: '' })
    }

    const writable = createMockWritable()

    if (options?.writeError) {
      writable.write.mockRejectedValue(options.writeError)
    }
    else {
      writable.write.mockImplementation(async (content: string) => {
        files.get(filename)!.content = content
      })
    }

    return {
      createWritable: vi.fn(async () => writable),
      get content() {
        return files.get(filename)?.content ?? ''
      },
    }
  })

  const handle: MockDirectoryHandle = {
    name: options?.name ?? 'Backups',
    queryPermission: vi.fn(async () => permission),
    requestPermission: vi.fn(async () => {
      permission = options?.requestResult ?? 'granted'
      return permission
    }),
    getFileHandle,
    getDirectoryHandle: vi.fn(async (folderName: string, opts?: { create?: boolean }) => {
      if (!directories.has(folderName) && !opts?.create) {
        throw new Error('Directory not found')
      }

      if (!directories.has(folderName)) {
        directories.set(
          folderName,
          createMockDirectoryHandle({
            name: folderName,
            permission: 'granted',
            writeError: options?.writeError,
          }),
        )
      }

      return directories.get(folderName)!
    }),
    files,
    directories,
  }

  return handle
}

function saveMockBackupRoot(handle: MockDirectoryHandle): void {
  memoryStore.root = {
    id: 'default',
    directoryHandle: handle as unknown as FileSystemDirectoryHandle,
    directoryName: handle.name,
    connectedAt: new Date().toISOString(),
  }
}

describe('directoryBackup', () => {
  const originalShowDirectoryPicker = window.showDirectoryPicker

  beforeEach(async () => {
    await resetTestDatabase()
    memoryStore.root = null
    memoryStore.accountStatus = null
    window.showDirectoryPicker = vi.fn() as typeof window.showDirectoryPicker
  })

  afterEach(() => {
    window.showDirectoryPicker = originalShowDirectoryPicker
    vi.clearAllMocks()
  })

  it('detects unsupported browsers', () => {
    window.showDirectoryPicker = undefined as unknown as typeof window.showDirectoryPicker
    expect(isDirectoryBackupSupported()).toBe(false)
  })

  it('formats daily backup filenames using the local calendar date', () => {
    const date = new Date(2026, 6, 15, 23, 30)
    expect(formatLocalDateKey(date)).toBe('2026-07-15')
    expect(formatDailyBackupFilename(date)).toBe('pardisan-backup-2026-07-15.json')
  })

  it('returns disconnected status when no folder is stored', async () => {
    const status = await getDirectoryBackupStatus()
    expect(status.connected).toBe(false)
    expect(status.directoryName).toBeNull()
    expect(status.accountFolderName).toBe('test-account')
  })

  it('persists a selected directory handle and writes an initial backup into the account subfolder', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    window.showDirectoryPicker = vi.fn().mockResolvedValue(handle)

    const status = await selectBackupDirectory()

    expect(window.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(status.connected).toBe(true)
    expect(status.directoryName).toBe('Backups')
    expect(status.accountFolderName).toBe('test-account')
    expect(status.lastWrittenDate).toBe(formatLocalDateKey())
    expect(status.lastError).toBeNull()
    expect(memoryStore.root?.directoryName).toBe('Backups')
    expect(handle.getDirectoryHandle).toHaveBeenCalledWith('test-account', { create: true })

    const accountFolder = handle.directories.get('test-account')
    expect(accountFolder).toBeDefined()
    expect(accountFolder!.getFileHandle).toHaveBeenCalledWith('account.json', { create: true })
    expect(accountFolder!.getFileHandle).toHaveBeenCalledWith(
      formatDailyBackupFilename(),
      { create: true },
    )

    const accountJson = JSON.parse(accountFolder!.files.get('account.json')!.content)
    expect(accountJson).toMatchObject({
      id: 'test-account',
      name: 'Test Account',
      schemaVersion: 1,
    })

    expect(await getMetaValue(META_KEYS.lastBackupAt)).not.toBeNull()
  })

  it('writes a schema v2 payload with account metadata into the daily file', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)

    const date = new Date(2026, 0, 10, 12, 0)
    expect(await writeDirectoryBackup({ date })).toBe(true)

    const accountFolder = handle.directories.get('test-account')!
    const backupFile = accountFolder.files.get(formatDailyBackupFilename(date))
    expect(backupFile).toBeDefined()

    const payload = JSON.parse(backupFile!.content)
    expect(payload.schemaVersion).toBe(2)
    expect(payload.account).toEqual({
      id: 'test-account',
      name: 'Test Account',
      folderName: 'test-account',
    })
    expect(payload.collections.founders).toHaveLength(2)
  })

  it('writes each account backup into its own subfolder', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup()).toBe(true)

    await registry.accounts.put({
      id: 'second-account',
      name: 'حساب دوم',
      folderName: 'حساب-دوم',
      createdAt: new Date().toISOString(),
    })
    await setActiveAccountId('second-account')

    expect(await writeDirectoryBackup()).toBe(true)

    expect([...handle.directories.keys()].sort()).toEqual(
      ['test-account', 'حساب-دوم'].sort(),
    )

    const secondFolder = handle.directories.get('حساب-دوم')!
    const secondAccountJson = JSON.parse(secondFolder.files.get('account.json')!.content)
    expect(secondAccountJson).toMatchObject({
      id: 'second-account',
      name: 'حساب دوم',
      schemaVersion: 1,
    })
    expect(secondFolder.files.has(formatDailyBackupFilename())).toBe(true)

    const firstAccountJson = JSON.parse(
      handle.directories.get('test-account')!.files.get('account.json')!.content,
    )
    expect(firstAccountJson.id).toBe('test-account')
  })

  it('refreshes account.json after a rename while keeping the same folder', async () => {
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup()).toBe(true)

    const renamed = await renameAccount('test-account', 'Renamed Account')
    await syncAccountJson(renamed)

    expect(handle.directories.size).toBe(1)
    const accountFolder = handle.directories.get('test-account')!
    const accountJson = JSON.parse(accountFolder.files.get('account.json')!.content)
    expect(accountJson).toMatchObject({
      id: 'test-account',
      name: 'Renamed Account',
      schemaVersion: 1,
    })
  })

  it('overwrites the same-day backup file on subsequent writes', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)

    const firstDate = new Date(2026, 0, 10, 12, 0)
    const secondDate = new Date(2026, 0, 10, 18, 0)
    const filename = formatDailyBackupFilename(firstDate)

    expect(await writeDirectoryBackup({ date: firstDate })).toBe(true)
    const accountFolder = handle.directories.get('test-account')!
    const firstCallCount = accountFolder.getFileHandle.mock.calls.filter(
      ([name]: [string]) => name === filename,
    ).length

    expect(await writeDirectoryBackup({ date: secondDate })).toBe(true)
    const secondCallCount = accountFolder.getFileHandle.mock.calls.filter(
      ([name]: [string]) => name === filename,
    ).length

    expect(secondCallCount).toBe(firstCallCount + 1)
    expect(accountFolder.getFileHandle).toHaveBeenCalledWith(filename, { create: true })
  })

  it('creates a separate file on the next local day', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)

    const dayOne = new Date(2026, 0, 10, 12, 0)
    const dayTwo = new Date(2026, 0, 11, 9, 0)

    expect(await writeDirectoryBackup({ date: dayOne })).toBe(true)
    expect(await writeDirectoryBackup({ date: dayTwo })).toBe(true)

    const accountFolder = handle.directories.get('test-account')!
    expect(accountFolder.getFileHandle).toHaveBeenCalledWith(
      'pardisan-backup-2026-01-10.json',
      { create: true },
    )
    expect(accountFolder.getFileHandle).toHaveBeenCalledWith(
      'pardisan-backup-2026-01-11.json',
      { create: true },
    )
  })

  it('records permission errors without throwing in silent mode', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      permission: 'prompt',
      requestResult: 'denied',
    })
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(false)
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })

    const status = await getDirectoryBackupStatus()
    expect(status.lastError).toBe('PermissionState: denied')
  })

  it('requests permission when current state is denied', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      permission: 'denied',
      requestResult: 'granted',
    })
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(true)
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
  })

  it('still requests permission when queryPermission throws', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      requestResult: 'granted',
    })
    handle.queryPermission.mockRejectedValue(
      new DOMException('Permission check failed', 'NotAllowedError'),
    )
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(true)
    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
  })

  it('records permission throw details in lastError', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      permission: 'prompt',
    })
    handle.requestPermission.mockRejectedValue(
      new DOMException('User denied permission', 'NotAllowedError'),
    )
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(false)

    const status = await getDirectoryBackupStatus()
    expect(status.lastError).toBe('NotAllowedError: User denied permission')
  })

  it('throws when permission is denied outside silent mode', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      permission: 'prompt',
      requestResult: 'denied',
    })
    saveMockBackupRoot(handle)

    await expect(writeDirectoryBackup()).rejects.toMatchObject({
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })
  })

  it('maps picker AbortError to a cancelled AppError', async () => {
    window.showDirectoryPicker = vi.fn().mockRejectedValue(
      new DOMException('The user aborted a request.', 'AbortError'),
    )

    await expect(selectBackupDirectory()).rejects.toMatchObject({
      statusMessage: 'errors.directoryBackup.cancelled',
    })
  })

  it('maps picker NotAllowedError to permissionDenied and stores lastError when connected', async () => {
    const existing = createMockDirectoryHandle()
    saveMockBackupRoot(existing)

    window.showDirectoryPicker = vi.fn().mockRejectedValue(
      new DOMException('Permission denied', 'NotAllowedError'),
    )

    await expect(selectBackupDirectory()).rejects.toMatchObject({
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })

    const status = await getDirectoryBackupStatus()
    expect(status.lastError).toBe('NotAllowedError: Permission denied')
  })

  it('records write failures without throwing in silent mode', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle({
      writeError: new Error('Disk full'),
    })
    saveMockBackupRoot(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(false)

    const status = await getDirectoryBackupStatus()
    expect(status.lastError).toBe('Error: Disk full')
  })

  it('reconnects and refreshes permission state', async () => {
    const handle = createMockDirectoryHandle({
      permission: 'prompt',
      requestResult: 'granted',
    })
    saveMockBackupRoot(handle)

    const status = await reconnectBackupDirectory()

    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(status.permission).toBe('granted')
    expect(status.lastError).toBeNull()
  })

  it('clears stored root handle on disconnect', async () => {
    const handle = createMockDirectoryHandle()
    saveMockBackupRoot(handle)
    memoryStore.accountStatus = {
      id: DIRECTORY_BACKUP_ID,
      lastWrittenAt: new Date().toISOString(),
      lastWrittenDate: '2026-01-10',
      lastError: null,
    }

    await disconnectBackupDirectory()

    const status = await getDirectoryBackupStatus()
    expect(status.connected).toBe(false)
    expect(memoryStore.root).toBeNull()
    expect(memoryStore.accountStatus).toBeNull()
  })
})
