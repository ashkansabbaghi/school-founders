import Dexie from 'dexie'
import {
  LEGACY_DB_NAME,
  bindActiveDatabase,
  closeAccountDatabase,
  deleteAccountDatabase,
  openAccountDatabase,
} from '~/db/database'
import {
  REGISTRY_DB_NAME,
  registry,
  setActiveAccountId,
} from '~/db/registry'
import { resetAccountContextInitState } from '~/services/accountContext'

const TEST_ACCOUNT_ID = 'test-account'

export async function resetTestDatabase(): Promise<void> {
  resetAccountContextInitState()

  await closeAccountDatabase(TEST_ACCOUNT_ID)

  if (await Dexie.exists(getTestAccountDbName())) {
    await deleteAccountDatabase(TEST_ACCOUNT_ID)
  }

  if (await Dexie.exists(LEGACY_DB_NAME)) {
    await Dexie.delete(LEGACY_DB_NAME)
  }

  if (await Dexie.exists(REGISTRY_DB_NAME)) {
    registry.close()
    await Dexie.delete(REGISTRY_DB_NAME)
  }

  await registry.open()

  const now = new Date().toISOString()
  await registry.accounts.put({
    id: TEST_ACCOUNT_ID,
    name: 'Test Account',
    folderName: 'test-account',
    createdAt: now,
  })
  await setActiveAccountId(TEST_ACCOUNT_ID)

  const database = openAccountDatabase(TEST_ACCOUNT_ID)
  await database.open()
  bindActiveDatabase(database)
}

function getTestAccountDbName(): string {
  return `pardisan-account-${TEST_ACCOUNT_ID}`
}
