import Dexie from 'dexie'
import { beforeEach, describe, expect, it } from 'vitest'
import { META_KEYS } from '#shared/types/meta'
import {
  LEGACY_DB_NAME,
  getAccountDatabaseName,
  openLegacyDatabase,
} from '~/db/database'
import {
  REGISTRY_DB_NAME,
  REGISTRY_META_KEYS,
  getActiveAccountId,
  getRegistryInstallId,
  getRegistryMetaValue,
  listAccounts,
  registry,
} from '~/db/registry'
import {
  createAccount,
  deleteAccount,
  renameAccount,
} from '~/db/repositories/accounts'
import {
  initializeAccountContext,
  migrateLegacyDatabaseIfNeeded,
  resetAccountContextInitState,
  switchActiveAccount,
} from '~/services/accountContext'
import { resetTestDatabase } from '../helpers/db'

async function resetAllDatabases(): Promise<void> {
  resetAccountContextInitState()

  if (await Dexie.exists(REGISTRY_DB_NAME)) {
    registry.close()
    await Dexie.delete(REGISTRY_DB_NAME)
  }

  if (await Dexie.exists(LEGACY_DB_NAME)) {
    await Dexie.delete(LEGACY_DB_NAME)
  }

  const databases = await Dexie.getDatabaseNames()

  await Promise.all(
    databases
      .filter(name => name.startsWith('pardisan-account-'))
      .map(name => Dexie.delete(name)),
  )

  await registry.open()
}

describe('accounts repository', () => {
  beforeEach(async () => {
    await resetTestDatabase()
  })

  it('rejects duplicate account names', async () => {
    await expect(createAccount('Test Account')).rejects.toMatchObject({
      statusMessage: 'errors.account.duplicateName',
    })
  })

  it('renames display name without changing folderName', async () => {
    const [account] = await listAccounts()
    expect(account).toBeTruthy()

    const renamed = await renameAccount(account!.id, 'Renamed Operator')

    expect(renamed.name).toBe('Renamed Operator')
    expect(renamed.folderName).toBe(account!.folderName)
  })

  it('prevents deleting the last account', async () => {
    const [account] = await listAccounts()
    await expect(deleteAccount(account!.id)).rejects.toMatchObject({
      statusMessage: 'errors.account.cannotDeleteLast',
    })
  })
})

describe('legacy account migration', () => {
  beforeEach(async () => {
    await resetAllDatabases()
  })

  it('migrates legacy pardisan data into the first account idempotently', async () => {
    const legacy = openLegacyDatabase()
    await legacy.open()
    await legacy.meta.bulkPut([
      { key: META_KEYS.installId, value: 'legacy-install' },
      { key: META_KEYS.operatorName, value: 'علی رضایی' },
      { key: META_KEYS.initialized, value: 'true' },
      { key: META_KEYS.termYear, value: '1404-1405' },
    ])
    await legacy.schools.put({
      id: 'school-1',
      name: 'مدرسه نمونه',
      branch: 'مرکزی',
    })
    legacy.close()

    const migrated = await migrateLegacyDatabaseIfNeeded()

    expect(migrated).toBeTruthy()
    expect(migrated?.name).toBe('علی رضایی')
    expect(await getActiveAccountId()).toBe(migrated!.id)
    expect(await getRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted))
      .toBe('true')
    expect(await Dexie.exists(LEGACY_DB_NAME)).toBe(true)
    expect(await Dexie.exists(getAccountDatabaseName(migrated!.id))).toBe(true)

    const { openAccountDatabase } = await import('~/db/database')
    const accountDb = openAccountDatabase(migrated!.id)
    await accountDb.open()
    expect(await accountDb.schools.toArray()).toEqual([
      { id: 'school-1', name: 'مدرسه نمونه', branch: 'مرکزی' },
    ])

    const secondPass = await migrateLegacyDatabaseIfNeeded()
    expect(secondPass).toBeNull()
    expect(await listAccounts()).toHaveLength(1)
  })

  it('marks migration complete without creating an account when no legacy database exists', async () => {
    expect(await Dexie.exists(LEGACY_DB_NAME)).toBe(false)

    const migrated = await migrateLegacyDatabaseIfNeeded()

    expect(migrated).toBeNull()
    expect(await listAccounts()).toHaveLength(0)
    expect(await getRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted))
      .toBe('true')
  })

  it('skips migration for an empty legacy database', async () => {
    const legacy = openLegacyDatabase()
    await legacy.open()
    legacy.close()

    const migrated = await migrateLegacyDatabaseIfNeeded()

    expect(migrated).toBeNull()
    expect(await listAccounts()).toHaveLength(0)
    expect(await getRegistryMetaValue(REGISTRY_META_KEYS.legacyMigrationCompleted))
      .toBe('true')
  })

  it('copies every business table and moves the install id into the registry', async () => {
    const legacy = openLegacyDatabase()
    await legacy.open()
    await legacy.meta.bulkPut([
      { key: META_KEYS.installId, value: 'legacy-install-42' },
      { key: META_KEYS.operatorName, value: 'Operator' },
      { key: META_KEYS.initialized, value: 'true' },
    ])
    await legacy.schools.put({ id: 'school-1', name: 'School', branch: 'Main' })
    await legacy.students.put({
      id: 'student-1',
      schoolId: 'school-1',
      fullName: 'Student',
      nationalCode: '001',
      studentId: 'ST-1',
      grade: '7',
      fullPrice: 1_000,
      dynamicDiscountRate: 0,
      parentName: 'Parent',
      parentPhone: '0912',
    })
    await legacy.studentTransactions.put({
      id: 'tx-1',
      studentId: 'student-1',
      schoolId: 'school-1',
      amountPaid: 500,
      paymentMethod: 'cash',
      date: '2026-01-01',
      termYear: '1404-1405',
      operator: 'Operator',
    })
    await legacy.founders.put({ id: 'founder-1', name: 'Founder', school: 'School' })
    legacy.close()

    const migrated = await migrateLegacyDatabaseIfNeeded()
    expect(migrated).toBeTruthy()

    const { openAccountDatabase } = await import('~/db/database')
    const accountDb = openAccountDatabase(migrated!.id)
    await accountDb.open()

    expect(await accountDb.schools.count()).toBe(1)
    expect(await accountDb.students.count()).toBe(1)
    expect(await accountDb.studentTransactions.count()).toBe(1)
    expect(await accountDb.founders.count()).toBe(1)
    expect((await accountDb.meta.get(META_KEYS.operatorName))?.value).toBe('Operator')

    expect(await getRegistryInstallId()).toBe('legacy-install-42')
  })

  it('initializes context and binds the migrated account database', async () => {
    const legacy = openLegacyDatabase()
    await legacy.open()
    await legacy.meta.bulkPut([
      { key: META_KEYS.operatorName, value: 'Operator' },
      { key: META_KEYS.initialized, value: 'true' },
    ])
    await legacy.founders.put({
      id: 'founder-1',
      name: 'Founder',
      school: 'School',
    })
    legacy.close()

    const account = await initializeAccountContext()

    expect(account?.name).toBe('Operator')

    const { getActiveDatabase } = await import('~/db/database')
    const founders = await getActiveDatabase().founders.toArray()
    expect(founders).toHaveLength(1)
    expect(founders[0]?.name).toBe('Founder')
  })
})

describe('switchActiveAccount isolation', () => {
  beforeEach(async () => {
    await resetAllDatabases()
  })

  it('switches between accounts without sharing business data', async () => {
    const first = await createAccount('Account A')
    const second = await createAccount('Account B')
    const { getActiveDatabase } = await import('~/db/database')

    await switchActiveAccount(first.id, { skipBackup: true, skipCacheReset: true })
    await getActiveDatabase().schools.put({ id: 'a-school', name: 'School A', branch: 'A' })

    await switchActiveAccount(second.id, { skipBackup: true, skipCacheReset: true })
    expect(await getActiveDatabase().schools.toArray()).toHaveLength(0)
    await getActiveDatabase().schools.put({ id: 'b-school', name: 'School B', branch: 'B' })

    await switchActiveAccount(first.id, { skipBackup: true, skipCacheReset: true })
    const schools = await getActiveDatabase().schools.toArray()
    expect(schools).toHaveLength(1)
    expect(schools[0]?.name).toBe('School A')
  })

  it('keeps founders, transactions and meta isolated per account across repeated switches', async () => {
    const first = await createAccount('Account A')
    const second = await createAccount('Account B')
    const { getActiveDatabase } = await import('~/db/database')

    await switchActiveAccount(first.id, { skipBackup: true, skipCacheReset: true })
    await getActiveDatabase().founders.put({ id: 'f-a', name: 'Founder A', school: 'A' })
    await getActiveDatabase().meta.put({ key: META_KEYS.operatorName, value: 'Operator A' })

    await switchActiveAccount(second.id, { skipBackup: true, skipCacheReset: true })
    expect(await getActiveDatabase().founders.count()).toBe(0)
    expect(await getActiveDatabase().meta.get(META_KEYS.operatorName)).toBeUndefined()
    await getActiveDatabase().founders.put({ id: 'f-b', name: 'Founder B', school: 'B' })
    await getActiveDatabase().schools.put({ id: 's-b', name: 'School B', branch: 'B' })
    await getActiveDatabase().studentTransactions.put({
      id: 'tx-b',
      studentId: 'student-b',
      schoolId: 's-b',
      amountPaid: 100,
      paymentMethod: 'cash',
      date: '2026-01-01',
      termYear: '1404-1405',
      operator: 'Operator B',
    })

    // Switch back and forth a few times to ensure the binding stays correct.
    await switchActiveAccount(first.id, { skipBackup: true, skipCacheReset: true })
    await switchActiveAccount(second.id, { skipBackup: true, skipCacheReset: true })
    await switchActiveAccount(first.id, { skipBackup: true, skipCacheReset: true })

    const founders = await getActiveDatabase().founders.toArray()
    expect(founders).toHaveLength(1)
    expect(founders[0]?.id).toBe('f-a')
    expect(await getActiveDatabase().studentTransactions.count()).toBe(0)
    expect((await getActiveDatabase().meta.get(META_KEYS.operatorName))?.value)
      .toBe('Operator A')

    await switchActiveAccount(second.id, { skipBackup: true, skipCacheReset: true })
    expect(await getActiveDatabase().founders.toArray()).toEqual([
      { id: 'f-b', name: 'Founder B', school: 'B' },
    ])
    expect(await getActiveDatabase().studentTransactions.count()).toBe(1)
  })

  it('deleting an account leaves the other account data untouched', async () => {
    const keep = await createAccount('Keeper')
    const drop = await createAccount('Dropped')
    const { getActiveDatabase, getAccountDatabaseName: dbName } = await import('~/db/database')

    await switchActiveAccount(keep.id, { skipBackup: true, skipCacheReset: true })
    await getActiveDatabase().schools.put({ id: 'keep-school', name: 'Keep', branch: 'K' })

    await switchActiveAccount(drop.id, { skipBackup: true, skipCacheReset: true })
    await getActiveDatabase().schools.put({ id: 'drop-school', name: 'Drop', branch: 'D' })

    await switchActiveAccount(keep.id, { skipBackup: true, skipCacheReset: true })
    await deleteAccount(drop.id)

    expect(await Dexie.exists(dbName(drop.id))).toBe(false)
    const schools = await getActiveDatabase().schools.toArray()
    expect(schools).toHaveLength(1)
    expect(schools[0]?.id).toBe('keep-school')
  })
})
