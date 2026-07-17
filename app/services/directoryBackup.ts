import { AppError, createAppError } from '#shared/errors/appError'
import {
  ACCOUNT_JSON_SCHEMA_VERSION,
  type Account,
  type AccountJsonMeta,
} from '#shared/types/account'
import {
  isLegacyDirectoryBackupRecord,
  type DirectoryBackupPermission,
  type DirectoryBackupRecord,
  type DirectoryBackupStatus,
  type LegacyDirectoryBackupRecord,
} from '#shared/types/directoryBackup'
import { META_KEYS } from '#shared/types/meta'
import {
  clearBackupRootRecord,
  getAccountById,
  getActiveAccountId,
  getBackupRootRecord,
  saveBackupRootRecord,
  type BackupRootRecord,
} from '~/db/registry'
import { isActiveDatabaseBound } from '~/db/database'
import {
  clearDirectoryBackupRecord,
  getDirectoryBackupRecord,
  getRawDirectoryBackupRecord,
  updateDirectoryBackupRecord,
} from '~/db/repositories/directoryBackup'
import { setMetaValue } from '~/db/repositories/meta'
import { createBackupPayload } from '~/services/backup'

const BACKUP_FILE_PREFIX = 'pardisan-backup-'
const BACKUP_FILE_SUFFIX = '.json'
const ACCOUNT_JSON_FILENAME = 'account.json'

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

async function resolveActiveAccount(): Promise<Account | null> {
  const activeId = await getActiveAccountId()

  if (!activeId) {
    return null
  }

  return (await getAccountById(activeId)) ?? null
}

/**
 * One-time migration: move a legacy per-account directory handle into the registry.
 */
async function migrateLegacyBackupRootIfNeeded(): Promise<BackupRootRecord | undefined> {
  const existing = await getBackupRootRecord()

  if (existing) {
    return existing
  }

  // A legacy record can only live inside a bound account database.
  if (!isActiveDatabaseBound()) {
    return undefined
  }

  const raw = await getRawDirectoryBackupRecord()

  if (!raw || !isLegacyDirectoryBackupRecord(raw as DirectoryBackupRecord)) {
    return undefined
  }

  const legacy = raw as unknown as LegacyDirectoryBackupRecord

  await saveBackupRootRecord({
    directoryHandle: legacy.directoryHandle,
    directoryName: legacy.directoryName || legacy.directoryHandle.name,
    connectedAt: legacy.connectedAt || new Date().toISOString(),
  })

  await updateDirectoryBackupRecord({
    lastWrittenAt: legacy.lastWrittenAt ?? null,
    lastWrittenDate: legacy.lastWrittenDate ?? null,
    lastError: legacy.lastError ?? null,
  })

  return getBackupRootRecord()
}

async function resolveBackupRoot(): Promise<BackupRootRecord | undefined> {
  return (await getBackupRootRecord()) ?? migrateLegacyBackupRootIfNeeded()
}

async function writeJsonFile(
  folderHandle: FileSystemDirectoryHandle,
  filename: string,
  data: unknown,
): Promise<void> {
  const fileHandle = await folderHandle.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()

  try {
    await writable.write(JSON.stringify(data, null, 2))
    await writable.close()
  }
  catch (error) {
    await writable.abort().catch(() => undefined)
    throw error
  }
}

export async function writeAccountJson(
  folderHandle: FileSystemDirectoryHandle,
  account: Account,
): Promise<void> {
  const meta: AccountJsonMeta = {
    id: account.id,
    name: account.name,
    schemaVersion: ACCOUNT_JSON_SCHEMA_VERSION,
  }

  await writeJsonFile(folderHandle, ACCOUNT_JSON_FILENAME, meta)
}

/**
 * Ensure `BackupRoot/{folderName}/` exists and `account.json` is up to date.
 * Returns null when the backup root is missing or permission is unavailable.
 */
export async function ensureAccountBackupFolder(options?: {
  account?: Account
  silent?: boolean
}): Promise<FileSystemDirectoryHandle | null> {
  const root = await resolveBackupRoot()

  if (!root) {
    return null
  }

  if (!isDirectoryBackupSupported()) {
    return null
  }

  const permission = await ensureDirectoryPermission(root.directoryHandle)

  if (!permission.granted) {
    if (!options?.silent) {
      await recordLastError(permission.errorDetail ?? 'Permission denied')
    }

    return null
  }

  const account = options?.account ?? await resolveActiveAccount()

  if (!account) {
    return null
  }

  try {
    const folderHandle = await root.directoryHandle.getDirectoryHandle(
      account.folderName,
      { create: true },
    )
    await writeAccountJson(folderHandle, account)
    return folderHandle
  }
  catch (error) {
    if (!options?.silent) {
      await recordLastError(toTechnicalErrorDetail(error))
    }

    return null
  }
}

/**
 * Best-effort: create the account subdirectory after account creation when
 * the backup root is already connected with permission.
 */
export async function tryEnsureAccountBackupFolder(account: Account): Promise<void> {
  await ensureAccountBackupFolder({ account, silent: true })
}

/**
 * Refresh `account.json` after a display-name rename (folderName stays fixed).
 */
export async function syncAccountJson(account: Account): Promise<void> {
  await ensureAccountBackupFolder({ account, silent: true })
}

async function writePayloadToAccountFolder(
  folderHandle: FileSystemDirectoryHandle,
  payload: Awaited<ReturnType<typeof createBackupPayload>>,
  date = new Date(),
): Promise<{ filename: string, dateKey: string }> {
  const dateKey = formatLocalDateKey(date)
  const filename = formatDailyBackupFilename(date)
  await writeJsonFile(folderHandle, filename, payload)
  return { filename, dateKey }
}

async function buildStatus(
  root: BackupRootRecord | undefined,
  accountStatus: DirectoryBackupRecord | undefined,
  account: Account | null,
): Promise<DirectoryBackupStatus> {
  const supported = isDirectoryBackupSupported()

  if (!root) {
    return {
      supported,
      connected: false,
      directoryName: null,
      accountFolderName: account?.folderName ?? null,
      permission: null,
      lastWrittenAt: accountStatus?.lastWrittenAt ?? null,
      lastWrittenDate: accountStatus?.lastWrittenDate ?? null,
      lastError: accountStatus?.lastError ?? null,
      connectedAt: null,
    }
  }

  let permission: DirectoryBackupPermission | null = null

  if (supported) {
    try {
      permission = await queryDirectoryPermission(root.directoryHandle)
    }
    catch {
      permission = 'denied'
    }
  }

  return {
    supported,
    connected: true,
    directoryName: root.directoryName,
    accountFolderName: account?.folderName ?? null,
    permission,
    lastWrittenAt: accountStatus?.lastWrittenAt ?? null,
    lastWrittenDate: accountStatus?.lastWrittenDate ?? null,
    lastError: accountStatus?.lastError ?? null,
    connectedAt: root.connectedAt,
  }
}

export async function getDirectoryBackupStatus(): Promise<DirectoryBackupStatus> {
  const [root, accountStatus, account] = await Promise.all([
    resolveBackupRoot(),
    getDirectoryBackupRecord(),
    resolveActiveAccount(),
  ])

  return buildStatus(root, accountStatus, account)
}

async function persistBackupRoot(handle: FileSystemDirectoryHandle): Promise<void> {
  const now = new Date().toISOString()
  const existing = await getBackupRootRecord()

  await saveBackupRootRecord({
    directoryHandle: handle,
    directoryName: handle.name,
    connectedAt: existing?.connectedAt ?? now,
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
    await persistBackupRoot(handle)

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
  const root = await resolveBackupRoot()

  if (!root) {
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

  const permission = await ensureDirectoryPermission(root.directoryHandle)

  if (!permission.granted) {
    await updateDirectoryBackupRecord({
      lastError: permission.errorDetail ?? 'Permission denied',
    })

    throw createAppError({
      statusCode: 403,
      statusMessage: 'errors.directoryBackup.permissionDenied',
    })
  }

  const account = await resolveActiveAccount()

  if (account) {
    await ensureAccountBackupFolder({ account, silent: true })
  }

  await updateDirectoryBackupRecord({ lastError: null })
  return getDirectoryBackupStatus()
}

export async function writeDirectoryBackup(options?: {
  silent?: boolean
  date?: Date
}): Promise<boolean> {
  const root = await resolveBackupRoot()

  if (!root) {
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

  const permission = await ensureDirectoryPermission(root.directoryHandle)

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

  const account = await resolveActiveAccount()

  if (!account) {
    if (options?.silent) {
      return false
    }

    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.directoryBackup.notConnected',
    })
  }

  try {
    const folderHandle = await root.directoryHandle.getDirectoryHandle(
      account.folderName,
      { create: true },
    )
    await writeAccountJson(folderHandle, account)

    const payload = await createBackupPayload()
    const { dateKey } = await writePayloadToAccountFolder(
      folderHandle,
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
  await clearBackupRootRecord()
  await clearDirectoryBackupRecord()
}

export type { DirectoryBackupStatus }
