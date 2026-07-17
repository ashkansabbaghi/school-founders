import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DIRECTORY_BACKUP_ID,
  type DirectoryBackupRecord,
} from '#shared/types/directoryBackup'
import { META_KEYS } from '#shared/types/meta'
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
  writeDirectoryBackup,
} from '~/services/directoryBackup'
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
}

const memoryStore: { record: DirectoryBackupRecord | null } = {
  record: null,
}

vi.mock('~/db/repositories/directoryBackup', () => ({
  getDirectoryBackupRecord: vi.fn(async () => memoryStore.record ?? undefined),
  saveDirectoryBackupRecord: vi.fn(async (record: DirectoryBackupRecord) => {
    memoryStore.record = record
  }),
  updateDirectoryBackupRecord: vi.fn(async (patch: Partial<Omit<DirectoryBackupRecord, 'id'>>) => {
    if (!memoryStore.record) {
      return
    }

    memoryStore.record = {
      ...memoryStore.record,
      ...patch,
    }
  }),
  clearDirectoryBackupRecord: vi.fn(async () => {
    memoryStore.record = null
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
  permission?: 'granted' | 'denied' | 'prompt'
  requestResult?: 'granted' | 'denied'
  writeError?: Error
}): MockDirectoryHandle {
  const files = new Map<string, { content: string }>()
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

  return {
    name: 'Backups',
    queryPermission: vi.fn(async () => permission),
    requestPermission: vi.fn(async () => {
      permission = options?.requestResult ?? 'granted'
      return permission
    }),
    getFileHandle,
  }
}

function saveMockDirectoryHandle(handle: MockDirectoryHandle): void {
  memoryStore.record = {
    id: DIRECTORY_BACKUP_ID,
    directoryHandle: handle as unknown as FileSystemDirectoryHandle,
    directoryName: handle.name,
    connectedAt: new Date().toISOString(),
    lastWrittenAt: null,
    lastWrittenDate: null,
    lastError: null,
  }
}

describe('directoryBackup', () => {
  const originalShowDirectoryPicker = window.showDirectoryPicker

  beforeEach(async () => {
    await resetTestDatabase()
    memoryStore.record = null
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
  })

  it('persists a selected directory handle and writes an initial backup', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    window.showDirectoryPicker = vi.fn().mockResolvedValue(handle)

    const status = await selectBackupDirectory()

    expect(window.showDirectoryPicker).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(status.connected).toBe(true)
    expect(status.directoryName).toBe('Backups')
    expect(status.lastWrittenDate).toBe(formatLocalDateKey())
    expect(status.lastError).toBeNull()
    expect(memoryStore.record?.directoryName).toBe('Backups')
    expect(await getMetaValue(META_KEYS.lastBackupAt)).not.toBeNull()
  })

  it('overwrites the same-day backup file on subsequent writes', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockDirectoryHandle(handle)

    const firstDate = new Date(2026, 0, 10, 12, 0)
    const secondDate = new Date(2026, 0, 10, 18, 0)
    const filename = formatDailyBackupFilename(firstDate)

    expect(await writeDirectoryBackup({ date: firstDate })).toBe(true)
    const firstCallCount = handle.getFileHandle.mock.calls.filter(
      ([name]: [string]) => name === filename,
    ).length

    expect(await writeDirectoryBackup({ date: secondDate })).toBe(true)
    const secondCallCount = handle.getFileHandle.mock.calls.filter(
      ([name]: [string]) => name === filename,
    ).length

    expect(secondCallCount).toBe(firstCallCount + 1)
    expect(handle.getFileHandle).toHaveBeenCalledWith(filename, { create: true })
  })

  it('creates a separate file on the next local day', async () => {
    await seedTestData()
    const handle = createMockDirectoryHandle()
    saveMockDirectoryHandle(handle)

    const dayOne = new Date(2026, 0, 10, 12, 0)
    const dayTwo = new Date(2026, 0, 11, 9, 0)

    expect(await writeDirectoryBackup({ date: dayOne })).toBe(true)
    expect(await writeDirectoryBackup({ date: dayTwo })).toBe(true)

    expect(handle.getFileHandle).toHaveBeenCalledWith(
      'pardisan-backup-2026-01-10.json',
      { create: true },
    )
    expect(handle.getFileHandle).toHaveBeenCalledWith(
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
    saveMockDirectoryHandle(handle)

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
    saveMockDirectoryHandle(handle)

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
    saveMockDirectoryHandle(handle)

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
    saveMockDirectoryHandle(handle)

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
    saveMockDirectoryHandle(handle)

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
    saveMockDirectoryHandle(existing)

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
    saveMockDirectoryHandle(handle)

    expect(await writeDirectoryBackup({ silent: true })).toBe(false)

    const status = await getDirectoryBackupStatus()
    expect(status.lastError).toBe('Error: Disk full')
  })

  it('reconnects and refreshes permission state', async () => {
    const handle = createMockDirectoryHandle({
      permission: 'prompt',
      requestResult: 'granted',
    })
    saveMockDirectoryHandle(handle)

    const status = await reconnectBackupDirectory()

    expect(handle.requestPermission).toHaveBeenCalledWith({ mode: 'readwrite' })
    expect(status.permission).toBe('granted')
    expect(status.lastError).toBeNull()
  })

  it('clears stored handle on disconnect', async () => {
    const handle = createMockDirectoryHandle()
    saveMockDirectoryHandle(handle)

    await disconnectBackupDirectory()

    const status = await getDirectoryBackupStatus()
    expect(status.connected).toBe(false)
    expect(memoryStore.record).toBeNull()
  })
})
