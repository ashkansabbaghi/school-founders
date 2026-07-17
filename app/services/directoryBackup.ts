import { AppError, createAppError } from '#shared/errors/appError'
import {
  DIRECTORY_BACKUP_ID,
  type DirectoryBackupPermission,
  type DirectoryBackupRecord,
  type DirectoryBackupStatus,
} from '#shared/types/directoryBackup'
import { META_KEYS } from '#shared/types/meta'
import {
  clearDirectoryBackupRecord,
  getDirectoryBackupRecord,
  saveDirectoryBackupRecord,
  updateDirectoryBackupRecord,
} from '~/db/repositories/directoryBackup'
import { setMetaValue } from '~/db/repositories/meta'
import { createBackupPayload } from '~/services/backup'

const BACKUP_FILE_PREFIX = 'pardisan-backup-'
const BACKUP_FILE_SUFFIX = '.json'

export function isDirectoryBackupSupported(): boolean {
  return typeof window !== 'undefined'
    && typeof window.showDirectoryPicker === 'function'
}

export function formatLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDailyBackupFilename(date = new Date()): string {
  return `${BACKUP_FILE_PREFIX}${formatLocalDateKey(date)}${BACKUP_FILE_SUFFIX}`
}

function toTechnicalErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return String(error)
}

function getErrorName(error: unknown): string | null {
  if (error instanceof DOMException || error instanceof Error) {
    return error.name
  }

  return null
}

function toDirectoryBackupError(
  error: unknown,
  fallback: 'pickerFailed' | 'writeFailed' = 'pickerFailed',
): AppError {
  if (error instanceof AppError) {
    return error
  }

  const name = getErrorName(error)

  if (name === 'AbortError') {
    return createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.cancelled',
    })
  }

  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return createAppError({
      statusCode: 403,
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })
  }

  return createAppError({
    statusCode: fallback === 'writeFailed' ? 500 : 400,
    statusMessage: `errors.directoryBackup.${fallback}`,
  })
}

async function recordLastError(detail: string): Promise<void> {
  const record = await getDirectoryBackupRecord()

  if (!record) {
    return
  }

  await updateDirectoryBackupRecord({ lastError: detail })
}

async function queryDirectoryPermission(
  handle: FileSystemDirectoryHandle,
): Promise<DirectoryBackupPermission> {
  return handle.queryPermission({ mode: 'readwrite' })
}

async function ensureDirectoryPermission(
  handle: FileSystemDirectoryHandle,
): Promise<{ granted: boolean, errorDetail?: string }> {
  try {
    let permission: DirectoryBackupPermission

    try {
      permission = await queryDirectoryPermission(handle)
    }
    catch {
      // queryPermission can throw; still attempt an explicit request.
      permission = 'prompt'
    }

    if (permission === 'granted') {
      return { granted: true }
    }

    const result = await handle.requestPermission({ mode: 'readwrite' })

    if (result === 'granted') {
      return { granted: true }
    }

    return {
      granted: false,
      errorDetail: `PermissionState: ${result}`,
    }
  }
  catch (error) {
    return {
      granted: false,
      errorDetail: toTechnicalErrorDetail(error),
    }
  }
}

async function writePayloadToDirectory(
  handle: FileSystemDirectoryHandle,
  payload: Awaited<ReturnType<typeof createBackupPayload>>,
  date = new Date(),
): Promise<{ filename: string, dateKey: string }> {
  const dateKey = formatLocalDateKey(date)
  const filename = formatDailyBackupFilename(date)
  const fileHandle = await handle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()

  try {
    await writable.write(JSON.stringify(payload, null, 2))
    await writable.close()
  }
  catch (error) {
    await writable.abort().catch(() => undefined)
    throw error
  }

  return { filename, dateKey }
}

async function buildStatusFromRecord(
  record: DirectoryBackupRecord | undefined,
): Promise<DirectoryBackupStatus> {
  const supported = isDirectoryBackupSupported()

  if (!record) {
    return {
      supported,
      connected: false,
      directoryName: null,
      permission: null,
      lastWrittenAt: null,
      lastWrittenDate: null,
      lastError: null,
      connectedAt: null,
    }
  }

  let permission: DirectoryBackupPermission | null = null

  if (supported) {
    try {
      permission = await queryDirectoryPermission(record.directoryHandle)
    }
    catch {
      permission = 'denied'
    }
  }

  return {
    supported,
    connected: true,
    directoryName: record.directoryName,
    permission,
    lastWrittenAt: record.lastWrittenAt,
    lastWrittenDate: record.lastWrittenDate,
    lastError: record.lastError,
    connectedAt: record.connectedAt,
  }
}

export async function getDirectoryBackupStatus(): Promise<DirectoryBackupStatus> {
  const record = await getDirectoryBackupRecord()
  return buildStatusFromRecord(record)
}

async function persistDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const now = new Date().toISOString()
  const existing = await getDirectoryBackupRecord()

  await saveDirectoryBackupRecord({
    id: DIRECTORY_BACKUP_ID,
    directoryHandle: handle,
    directoryName: handle.name,
    connectedAt: existing?.connectedAt ?? now,
    lastWrittenAt: existing?.lastWrittenAt ?? null,
    lastWrittenDate: existing?.lastWrittenDate ?? null,
    lastError: null,
  })
}

export async function selectBackupDirectory(): Promise<DirectoryBackupStatus> {
  if (!isDirectoryBackupSupported()) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.unsupported',
    })
  }

  try {
    const handle = await window.showDirectoryPicker({ mode: 'readwrite' })
    await persistDirectoryHandle(handle)

    const wrote = await writeDirectoryBackup()

    if (!wrote) {
      throw createAppError({
        statusCode: 500,
        statusMessage: 'errors.directoryBackup.writeFailed',
      })
    }

    return getDirectoryBackupStatus()
  }
  catch (error) {
    if (!(error instanceof AppError)) {
      await recordLastError(toTechnicalErrorDetail(error))
    }

    throw toDirectoryBackupError(error, 'pickerFailed')
  }
}

export async function reconnectBackupDirectory(): Promise<DirectoryBackupStatus> {
  const record = await getDirectoryBackupRecord()

  if (!record) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.notConnected',
    })
  }

  if (!isDirectoryBackupSupported()) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.unsupported',
    })
  }

  const permission = await ensureDirectoryPermission(record.directoryHandle)

  if (!permission.granted) {
    await updateDirectoryBackupRecord({
      lastError: permission.errorDetail ?? 'Permission denied',
    })

    throw createAppError({
      statusCode: 403,
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })
  }

  await updateDirectoryBackupRecord({ lastError: null })
  return getDirectoryBackupStatus()
}

export async function writeDirectoryBackup(options?: {
  silent?: boolean
  date?: Date
}): Promise<boolean> {
  const record = await getDirectoryBackupRecord()

  if (!record) {
    if (options?.silent) {
      return false
    }

    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.notConnected',
    })
  }

  if (!isDirectoryBackupSupported()) {
    if (options?.silent) {
      return false
    }

    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.unsupported',
    })
  }

  const permission = await ensureDirectoryPermission(record.directoryHandle)

  if (!permission.granted) {
    await updateDirectoryBackupRecord({
      lastError: permission.errorDetail ?? 'Permission denied',
    })

    if (options?.silent) {
      return false
    }

    throw createAppError({
      statusCode: 403,
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })
  }

  try {
    const payload = await createBackupPayload()
    const { dateKey } = await writePayloadToDirectory(
      record.directoryHandle,
      payload,
      options?.date,
    )

    await updateDirectoryBackupRecord({
      lastWrittenAt: payload.exportedAt,
      lastWrittenDate: dateKey,
      lastError: null,
    })
    await setMetaValue(META_KEYS.lastBackupAt, payload.exportedAt)

    return true
  }
  catch (error) {
    await updateDirectoryBackupRecord({
      lastError: toTechnicalErrorDetail(error),
    })

    if (options?.silent) {
      return false
    }

    throw toDirectoryBackupError(error, 'writeFailed')
  }
}

export async function disconnectBackupDirectory(): Promise<void> {
  await clearDirectoryBackupRecord()
}

export type { DirectoryBackupStatus }
