import Dexie, { type EntityTable } from 'dexie'
import type { Account } from '#shared/types/account'
import type { MetaRecord } from '#shared/types/meta'

export const REGISTRY_DB_NAME = 'pardisan-registry'
export const REGISTRY_DB_VERSION = 1

export const REGISTRY_META_KEYS = {
  installId: 'installId',
  activeAccountId: 'activeAccountId',
  /** Set to `'true'` after legacy `pardisan` migration succeeds or is skipped. */
  legacyMigrationCompleted: 'legacyMigrationCompleted',
} as const

export type RegistryMetaKey = (typeof REGISTRY_META_KEYS)[keyof typeof REGISTRY_META_KEYS]

export const BACKUP_ROOT_ID = 'default' as const

export interface BackupRootRecord {
  id: typeof BACKUP_ROOT_ID
  directoryHandle: FileSystemDirectoryHandle
  directoryName: string
  connectedAt: string
}

export class PardisanRegistryDatabase extends Dexie {
  accounts!: EntityTable<Account, 'id'>
  meta!: EntityTable<MetaRecord, 'key'>
  backupRoot!: EntityTable<BackupRootRecord, 'id'>

  constructor() {
    super(REGISTRY_DB_NAME)

    this.version(REGISTRY_DB_VERSION).stores({
      accounts: 'id, &name, &folderName, createdAt',
      meta: 'key',
      backupRoot: 'id',
    })
  }
}

export const registry = new PardisanRegistryDatabase()

export async function getRegistryMetaValue(
  key: RegistryMetaKey | string,
): Promise<string | null> {
  const record = await registry.meta.get(key)
  return record?.value ?? null
}

export async function setRegistryMetaValue(
  key: RegistryMetaKey | string,
  value: string,
): Promise<void> {
  await registry.meta.put({ key, value })
}

export async function removeRegistryMetaValue(
  key: RegistryMetaKey | string,
): Promise<void> {
  await registry.meta.delete(key)
}

export async function getActiveAccountId(): Promise<string | null> {
  return getRegistryMetaValue(REGISTRY_META_KEYS.activeAccountId)
}

export async function setActiveAccountId(accountId: string): Promise<void> {
  await setRegistryMetaValue(REGISTRY_META_KEYS.activeAccountId, accountId)
}

export async function getRegistryInstallId(): Promise<string | null> {
  return getRegistryMetaValue(REGISTRY_META_KEYS.installId)
}

export async function setRegistryInstallId(installId: string): Promise<void> {
  await setRegistryMetaValue(REGISTRY_META_KEYS.installId, installId)
}

export async function listAccounts(): Promise<Account[]> {
  return registry.accounts.orderBy('createdAt').toArray()
}

export async function getAccountById(id: string): Promise<Account | undefined> {
  return registry.accounts.get(id)
}

export async function getAccountByName(name: string): Promise<Account | undefined> {
  return registry.accounts.where('name').equals(name).first()
}

export async function getBackupRootRecord(): Promise<BackupRootRecord | undefined> {
  return registry.backupRoot.get(BACKUP_ROOT_ID)
}

export async function saveBackupRootRecord(
  record: Omit<BackupRootRecord, 'id'> & { id?: typeof BACKUP_ROOT_ID },
): Promise<void> {
  await registry.backupRoot.put({
    id: BACKUP_ROOT_ID,
    directoryHandle: record.directoryHandle,
    directoryName: record.directoryName,
    connectedAt: record.connectedAt,
  })
}

export async function clearBackupRootRecord(): Promise<void> {
  await registry.backupRoot.delete(BACKUP_ROOT_ID)
}
