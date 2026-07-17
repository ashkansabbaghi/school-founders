import { createAppError } from '#shared/errors/appError'
import {
  allocateUniqueFolderName,
  type Account,
} from '#shared/types/account'
import {
  deleteAccountDatabase,
  openAccountDatabase,
} from '../database'
import {
  getAccountById,
  getAccountByName,
  getActiveAccountId,
  listAccounts,
  registry,
  setActiveAccountId,
} from '../registry'

function assertNonEmptyAccountName(name: string): string {
  const trimmed = name.trim()

  if (!trimmed) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.account.nameRequired',
    })
  }

  return trimmed
}

export async function createAccount(name: string): Promise<Account> {
  const displayName = assertNonEmptyAccountName(name)
  const existing = await getAccountByName(displayName)

  if (existing) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.account.duplicateName',
      data: { values: displayName },
    })
  }

  const accounts = await listAccounts()
  const folderName = allocateUniqueFolderName(
    displayName,
    accounts.map(account => account.folderName),
  )

  const account: Account = {
    id: crypto.randomUUID(),
    name: displayName,
    folderName,
    createdAt: new Date().toISOString(),
  }

  await registry.accounts.put(account)
  openAccountDatabase(account.id)

  return account
}

export async function renameAccount(id: string, name: string): Promise<Account> {
  const displayName = assertNonEmptyAccountName(name)
  const account = await getAccountById(id)

  if (!account) {
    throw createAppError({
      statusCode: 404,
      statusMessage: 'errors.account.notFound',
    })
  }

  const conflict = await getAccountByName(displayName)

  if (conflict && conflict.id !== id) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.account.duplicateName',
      data: { values: displayName },
    })
  }

  const updated: Account = {
    ...account,
    name: displayName,
  }

  await registry.accounts.put(updated)
  return updated
}

export async function deleteAccount(id: string): Promise<void> {
  const account = await getAccountById(id)

  if (!account) {
    throw createAppError({
      statusCode: 404,
      statusMessage: 'errors.account.notFound',
    })
  }

  const accounts = await listAccounts()

  if (accounts.length <= 1) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.account.cannotDeleteLast',
    })
  }

  const activeId = await getActiveAccountId()

  await registry.accounts.delete(id)
  await deleteAccountDatabase(id)

  if (activeId === id) {
    const remaining = accounts.find(entry => entry.id !== id)

    if (remaining) {
      await setActiveAccountId(remaining.id)
    }
  }
}

export async function ensureAccountDatabase(accountId: string) {
  const account = await getAccountById(accountId)

  if (!account) {
    throw createAppError({
      statusCode: 404,
      statusMessage: 'errors.account.notFound',
    })
  }

  return openAccountDatabase(accountId)
}

