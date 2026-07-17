import Dexie from 'dexie'
import type { Account } from '#shared/types/account'
import { DIRECTORY_BACKUP_ID } from '#shared/types/directoryBackup'
import { META_KEYS } from '#shared/types/meta'
import {
  LEGACY_DB_NAME,
  bindActiveDatabase,
  closeLegacyDatabase,
  deleteAccountDatabase,
  getAccountDatabaseName,
  getActiveDatabaseOrNull,
  isActiveDatabaseBound,
  openAccountDatabase,
  openLegacyDatabase,
  type PardisanDatabase,
} from '~/db/database'
import {
  REGISTRY_META_KEYS,
  getAccountById,
  getActiveAccountId,
  getRegistryInstallId,
  getRegistryMetaValue,
  listAccounts,
  registry,
  setActiveAccountId,
  setRegistryInstallId,
  setRegistryMetaValue,
} from '~/db/registry'
import {
  createAccount,
  deleteAccount,
  renameAccount,
} from '~/db/repositories/accounts'
import {
  syncAccountJson,
  tryEnsureAccountBackupFolder,
  writeDirectoryBackup,
} from '~/services/directoryBackup'

const ACCOUNT_DATA_TABLES = [
  'schools',
  'students',
  'employees',
  'studentTransactions',
  'employeeTransactions',
  'fixedCosts',
  'founders',
  'meta',
  'directoryBackup',
] as const

type AccountDataTable = (typeof ACCOUNT_DATA_TABLES)[number]

let initializePromise: Promise<Account | null> | null = null

export interface SwitchAccountOptions {
  /** Skip silent directory backup of the current account (e.g. first bind). */
  skipBackup?: boolean
  /** Skip finance/composable cache reset (e.g. during cold start). */
  skipCacheReset?: boolean
}

async function tableCount(
  database: PardisanDatabase,
  table: AccountDataTable,
): Promise<number> {
  return database.table(table).count()
}

async function legacyHasMeaningfulData(legacy: PardisanDatabase): Promise<boolean> {
  const initialized = await legacy.meta.get(META_KEYS.initialized)

  if (initialized?.value === 'true') {
    return true
  }

  for (const table of ACCOUNT_DATA_TABLES) {
    if (table === 'meta') {
      continue
    }

    if ((await tableCount(legacy, table)) > 0) {
      return true
    }
  }

  const metaCount = await tableCount(legacy, 'meta')
  return metaCount > 0
}

async function copyAndVerifyDatabase(
  source: PardisanDatabase,
  target: PardisanDatabase,
): Promise<void> {
  const snapshots: Partial<Record<AccountDataTable, unknown[]>> = {}

  for (const table of ACCOUNT_DATA_TABLES) {
    snapshots[table] = await source.table(table).toArray()
  }

  await target.transaction('rw', ACCOUNT_DATA_TABLES, async () => {
    for (const table of ACCOUNT_DATA_TABLES) {
      const rows = snapshots[table] ?? []
      await target.table(table).clear()

      if (rows.length > 0) {
        await target.table(table).bulkPut(rows)
      }
    }
  })

  for (const table of ACCOUNT_DATA_TABLES) {
    const actual = await tableCount(target, table)
    const expected = snapshots[table]?.length ?? 0

    if (actual !== expected) {
      throw new Error(
        `Legacy migration verification failed for table "${table}": expected ${expected}, got ${actual}.`,
      )
    }
  }
}

/**
 * Idempotent migration of the pre-multi-account `pardisan` IndexedDB into the first account.
 * The legacy database is never deleted here — only after a future explicit cleanup.
 */
export async function migrateLegacyDatabaseIfNeeded(): Promise<Account | null> {
  const completed = await getRegistryMetaValue(
    REGISTRY_META_KEYS.legacyMigrationCompleted,
  )

  if (completed === 'true') {
    return null
  }

  const existingAccounts = await listAccounts()

  if (existingAccounts.length > 0) {
    await setRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted, 'true')
    return null
  }

  const legacyExists = await Dexie.exists(LEGACY_DB_NAME)

  if (!legacyExists) {
    await setRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted, 'true')
    return null
  }

  const legacy = openLegacyDatabase()
  await legacy.open()

  try {
    if (!(await legacyHasMeaningfulData(legacy))) {
      await setRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted, 'true')
      return null
    }

    const operatorName
      = (await legacy.meta.get(META_KEYS.operatorName))?.value?.trim()
        || 'حساب کاربری'

    const account = await createAccount(operatorName)
    const target = openAccountDatabase(account.id)
    await target.open()

    try {
      await copyAndVerifyDatabase(legacy, target)
    }
    catch (error) {
      await registry.accounts.delete(account.id)
      await deleteAccountDatabase(account.id)
      throw error
    }

    const legacyInstallId = (await legacy.meta.get(META_KEYS.installId))?.value

    if (legacyInstallId) {
      await setRegistryInstallId(legacyInstallId)
    }

    await setActiveAccountId(account.id)
    await setRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted, 'true')

    // If a backup root was migrated with the account DB, create the account subfolder.
    await tryEnsureAccountBackupFolder(account)

    return account
  }
  finally {
    await closeLegacyDatabase()
  }
}

async function resolveActiveAccount(): Promise<Account | null> {
  const accounts = await listAccounts()

  if (accounts.length === 0) {
    return null
  }

  const activeId = await getActiveAccountId()

  if (activeId) {
    const active = await getAccountById(activeId)

    if (active) {
      return active
    }
  }

  const fallback = accounts[0]!
  await setActiveAccountId(fallback.id)
  return fallback
}

export async function bindAccountDatabase(accountId: string): Promise<PardisanDatabase> {
  const database = openAccountDatabase(accountId)
  await database.open()
  bindActiveDatabase(database)
  return database
}

/**
 * Clear Pinia + Nuxt useState caches that hold account-scoped data, then reload.
 * Safe to call outside a Nuxt/Pinia context (no-ops on failure).
 */
export async function resetAccountCaches(): Promise<void> {
  if (!import.meta.client) {
    return
  }

  try {
    const financeStore = useFinanceStore()
    await financeStore.resetForAccountSwitch()
  }
  catch {
    // Pinia may be unavailable in isolated unit tests.
  }

  try {
    const foundersState = useState('founders', () => [])
    const foundersStatus = useState('founders-status', () => 'idle')
    const foundersError = useState<string | null>('founders-error', () => null)
    foundersState.value = []
    foundersStatus.value = 'idle'
    foundersError.value = null

    const schoolsState = useState('schools', () => [])
    const schoolsStatus = useState('schools-status', () => 'idle')
    const schoolsError = useState<string | null>('schools-error', () => null)
    schoolsState.value = []
    schoolsStatus.value = 'idle'
    schoolsError.value = null

    const fixedCostsState = useState('fixed-costs', () => [])
    const fixedCostsStatus = useState('fixed-costs-status', () => 'idle')
    const fixedCostsError = useState<string | null>('fixed-costs-error', () => null)
    fixedCostsState.value = []
    fixedCostsStatus.value = 'idle'
    fixedCostsError.value = null
  }
  catch {
    // useState may be unavailable outside Nuxt.
  }

  try {
    const { refresh: refreshFounders } = useFounders()
    const { refresh: refreshSchools } = useSchools()
    const { refresh: refreshFixedCosts } = useFixedCosts()

    await Promise.all([
      refreshFounders(),
      refreshSchools(),
      refreshFixedCosts(),
    ])
  }
  catch {
    // Composables may be unavailable outside Nuxt pages.
  }
}

async function silentBackupCurrentAccount(): Promise<void> {
  if (!isActiveDatabaseBound()) {
    return
  }

  try {
    await writeDirectoryBackup({ silent: true })
  }
  catch {
    // Silent backups must never block account switching.
  }
}

/**
 * Switch the active account: optional silent backup, open destination DB, reset caches.
 */
export async function switchActiveAccount(
  accountId: string,
  options: SwitchAccountOptions = {},
): Promise<Account> {
  const account = await getAccountById(accountId)

  if (!account) {
    throw new Error(`Account "${accountId}" was not found.`)
  }

  const current = getActiveDatabaseOrNull()
  const alreadyActive = current?.name === getAccountDatabaseName(accountId)

  if (!options.skipBackup && !alreadyActive) {
    await silentBackupCurrentAccount()
  }

  await setActiveAccountId(account.id)
  await bindAccountDatabase(account.id)

  if (!options.skipCacheReset) {
    await resetAccountCaches()
  }

  return account
}

/**
 * Open registry, migrate legacy data if needed, and bind the active account database.
 * Returns the active account, or `null` when the install has no accounts yet (pre-onboarding).
 */
export async function initializeAccountContext(): Promise<Account | null> {
  if (isActiveDatabaseBound()) {
    const activeId = await getActiveAccountId()

    if (activeId) {
      const account = await getAccountById(activeId)

      if (account) {
        return account
      }
    }
  }

  if (!initializePromise) {
    initializePromise = (async () => {
      await migrateLegacyDatabaseIfNeeded()

      const account = await resolveActiveAccount()

      if (!account) {
        return null
      }

      await bindAccountDatabase(account.id)
      return account
    })()
  }

  try {
    const account = await initializePromise

    // Allow a later retry once onboarding creates the first account.
    if (!account) {
      initializePromise = null
    }

    return account
  }
  catch (error) {
    initializePromise = null
    throw error
  }
}

/** Create a new account and optionally activate it (default: activate). */
export async function createAndActivateAccount(
  name: string,
  options: { activate?: boolean } = {},
): Promise<Account> {
  const shouldActivate = options.activate !== false
  const account = await createAccount(name)

  // Create BackupRoot/{folderName}/account.json immediately when permission exists.
  await tryEnsureAccountBackupFolder(account)

  if (shouldActivate) {
    await switchActiveAccount(account.id, {
      skipBackup: !isActiveDatabaseBound(),
      skipCacheReset: !isActiveDatabaseBound(),
    })
  }

  return account
}

/**
 * Create an account from settings: seed its meta (name, term year, initialized)
 * so switching to it later never re-triggers the onboarding wizard.
 * Does not activate the new account.
 */
export async function createInitializedAccount(name: string): Promise<Account> {
  const account = await createAccount(name)

  await tryEnsureAccountBackupFolder(account)

  const activeDatabase = getActiveDatabaseOrNull()
  const termYear
    = (await activeDatabase?.meta.get(META_KEYS.termYear))?.value ?? '1404-1405'
  const installId = await getRegistryInstallId()

  const database = openAccountDatabase(account.id)
  await database.open()

  const entries = [
    { key: META_KEYS.operatorName, value: account.name },
    { key: META_KEYS.termYear, value: termYear },
    { key: META_KEYS.initialized, value: 'true' },
    { key: META_KEYS.showFirstPaymentCta, value: 'true' },
  ]

  if (installId) {
    entries.push({ key: META_KEYS.installId, value: installId })
  }

  await database.meta.bulkPut(entries)

  return account
}

/** Rename any account's display name and refresh its `account.json`. */
export async function renameAccountDisplayName(
  accountId: string,
  name: string,
): Promise<Account> {
  const updated = await renameAccount(accountId, name)
  await syncAccountJson(updated)
  return updated
}

/** Last directory-backup timestamp recorded inside a specific account's database. */
export async function getAccountLastBackupAt(accountId: string): Promise<string | null> {
  const database = openAccountDatabase(accountId)
  const record = await database.directoryBackup.get(DIRECTORY_BACKUP_ID)
  return record?.lastWrittenAt ?? null
}

export async function renameActiveAccountDisplayName(name: string): Promise<Account> {
  const activeId = await getActiveAccountId()

  if (!activeId) {
    throw new Error('No active account to rename.')
  }

  const updated = await renameAccount(activeId, name)
  await syncAccountJson(updated)
  return updated
}

export {
  createAccount,
  deleteAccount,
  listAccounts,
  renameAccount,
  getAccountById,
  getActiveAccountId,
  getRegistryInstallId,
}

/** @internal test helper — clears the init memo so the next call re-runs migration. */
export function resetAccountContextInitState(): void {
  initializePromise = null
}
