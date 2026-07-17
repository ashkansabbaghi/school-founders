import Dexie, { type EntityTable } from 'dexie'
import type {
  Employee,
  EmployeeTransaction,
  FixedCost,
  School,
  Student,
  StudentTransaction,
} from '#shared/types/financial'
import type { Founder } from '#shared/types/founder'
import type { DirectoryBackupRecord } from '#shared/types/directoryBackup'
import type { MetaRecord } from '#shared/types/meta'

/** Pre-multi-account IndexedDB name; kept for migration only. */
export const LEGACY_DB_NAME = 'pardisan'

/** @deprecated Prefer {@link getAccountDatabaseName} / {@link LEGACY_DB_NAME}. */
export const DB_NAME = LEGACY_DB_NAME

export const ACCOUNT_DB_NAME_PREFIX = 'pardisan-account-'

export const DB_VERSION = 3

export function getAccountDatabaseName(accountId: string): string {
  if (!accountId) {
    throw new Error('accountId is required to resolve an account database name.')
  }

  return `${ACCOUNT_DB_NAME_PREFIX}${accountId}`
}

export function isAccountDatabaseName(dbName: string): boolean {
  return dbName.startsWith(ACCOUNT_DB_NAME_PREFIX)
}

export function parseAccountIdFromDatabaseName(dbName: string): string | null {
  if (!isAccountDatabaseName(dbName)) {
    return null
  }

  const accountId = dbName.slice(ACCOUNT_DB_NAME_PREFIX.length)
  return accountId || null
}

export class PardisanDatabase extends Dexie {
  schools!: EntityTable<School, 'id'>
  students!: EntityTable<Student, 'id'>
  employees!: EntityTable<Employee, 'id'>
  studentTransactions!: EntityTable<StudentTransaction, 'id'>
  employeeTransactions!: EntityTable<EmployeeTransaction, 'id'>
  fixedCosts!: EntityTable<FixedCost, 'id'>
  founders!: EntityTable<Founder, 'id'>
  meta!: EntityTable<MetaRecord, 'key'>
  directoryBackup!: EntityTable<DirectoryBackupRecord, 'id'>

  constructor(dbName: string) {
    super(dbName)

    this.version(1).stores({
      schools: 'id',
      students: 'id, schoolId',
      employees: 'id, schoolId',
      studentTransactions: 'id, studentId, schoolId, termYear',
      employeeTransactions: 'id, employeeId, schoolId, termYear',
      fixedCosts: 'id, schoolId, termYear',
      founders: 'id',
      meta: 'key',
    })

    this.version(DB_VERSION).stores({
      schools: 'id',
      students: 'id, schoolId, nationalCode',
      employees: 'id, schoolId, nationalCode',
      studentTransactions: 'id, studentId, schoolId, termYear',
      employeeTransactions: 'id, employeeId, schoolId, termYear',
      fixedCosts: 'id, schoolId, termYear',
      founders: 'id',
      meta: 'key',
      directoryBackup: 'id',
    })
  }
}

const accountDatabases = new Map<string, PardisanDatabase>()

/**
 * Open (or reuse) the IndexedDB for a given account.
 * Database name: `pardisan-account-{accountId}`.
 */
export function openAccountDatabase(accountId: string): PardisanDatabase {
  const dbName = getAccountDatabaseName(accountId)
  const existing = accountDatabases.get(dbName)

  if (existing) {
    return existing
  }

  const database = new PardisanDatabase(dbName)
  accountDatabases.set(dbName, database)
  return database
}

/** Alias for {@link openAccountDatabase}. */
export function createAccountDatabase(accountId: string): PardisanDatabase {
  return openAccountDatabase(accountId)
}

export async function closeAccountDatabase(accountId: string): Promise<void> {
  const dbName = getAccountDatabaseName(accountId)
  const existing = accountDatabases.get(dbName)

  if (!existing) {
    return
  }

  existing.close()
  accountDatabases.delete(dbName)
}

export async function deleteAccountDatabase(accountId: string): Promise<void> {
  const dbName = getAccountDatabaseName(accountId)
  const existing = accountDatabases.get(dbName)

  if (existing) {
    existing.close()
    accountDatabases.delete(dbName)
  }

  await Dexie.delete(dbName)
}

/** Open the pre-multi-account database used only during migration. */
export function openLegacyDatabase(): PardisanDatabase {
  const existing = accountDatabases.get(LEGACY_DB_NAME)

  if (existing) {
    return existing
  }

  const database = new PardisanDatabase(LEGACY_DB_NAME)
  accountDatabases.set(LEGACY_DB_NAME, database)
  return database
}

let activeDatabase: PardisanDatabase | null = null

export function isActiveDatabaseBound(): boolean {
  return activeDatabase !== null
}

export function getActiveDatabaseOrNull(): PardisanDatabase | null {
  return activeDatabase
}

/**
 * Resolve the currently bound account database.
 * Repositories and services should prefer this or the live-bound {@link db} export.
 */
export function getActiveDatabase(): PardisanDatabase {
  if (!activeDatabase) {
    throw new Error(
      'Active account database is not initialized. Call initializeAccountContext() first.',
    )
  }

  return activeDatabase
}

/** Point repository traffic at a specific account (or legacy) database instance. */
export function bindActiveDatabase(database: PardisanDatabase): void {
  activeDatabase = database
  db = database
}

export async function closeLegacyDatabase(): Promise<void> {
  const existing = accountDatabases.get(LEGACY_DB_NAME)

  if (!existing) {
    return
  }

  existing.close()
  accountDatabases.delete(LEGACY_DB_NAME)

  if (activeDatabase === existing) {
    activeDatabase = null
    db = null as unknown as PardisanDatabase
  }
}

/**
 * Live-bound active account database used by repositories.
 * Always reassigned via {@link bindActiveDatabase} — never open the legacy DB by default.
 */
export let db = null as unknown as PardisanDatabase
