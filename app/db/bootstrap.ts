import { META_KEYS } from '#shared/types/meta'
import { getDirectoryBackupStatus } from '~/services/directoryBackup'
import {
  getActiveDatabaseOrNull,
  isActiveDatabaseBound,
} from './database'
import {
  getRegistryInstallId,
  listAccounts,
  setRegistryInstallId,
} from './registry'
import { getMetaValue, setMetaValue, setMetaValues } from './repositories/meta'

const LEGACY_OPERATOR_STORAGE_KEY = 'finance:operatorName'
const DEFAULT_TERM_YEAR = '1404-1405'

export interface ProfileSettings {
  installId: string
  userName: string
  termYear: string
}

export interface CompleteOnboardingOptions {
  userName?: string
  /** @deprecated Use `userName` instead. Kept for backward compatibility. */
  operatorName?: string
  termYear: string
}

function resolveUserName(options: CompleteOnboardingOptions): string {
  return (options.userName ?? options.operatorName ?? '').trim()
}

async function migrateLegacyOperatorName(): Promise<string | null> {
  if (!import.meta.client) {
    return null
  }

  if (!isActiveDatabaseBound()) {
    return null
  }

  const legacyOperator = sessionStorage.getItem(LEGACY_OPERATOR_STORAGE_KEY)

  if (!legacyOperator) {
    return null
  }

  const existing = await getMetaValue(META_KEYS.operatorName)

  if (!existing) {
    await setMetaValue(META_KEYS.operatorName, legacyOperator)
  }

  sessionStorage.removeItem(LEGACY_OPERATOR_STORAGE_KEY)
  return legacyOperator
}

export async function isOnboardingComplete(): Promise<boolean> {
  if (!isActiveDatabaseBound()) {
    return false
  }

  const initialized = await getMetaValue(META_KEYS.initialized)
  return initialized === 'true'
}

export interface GettingStartedProgress {
  school: boolean
  student: boolean
  payment: boolean
  backup: boolean
  completedCount: number
  totalCount: 4
  allComplete: boolean
}

export async function shouldShowGettingStartedChecklist(): Promise<boolean> {
  if (!isActiveDatabaseBound()) {
    return false
  }

  const value = await getMetaValue(META_KEYS.showFirstPaymentCta)
  return value === 'true'
}

export async function dismissGettingStartedChecklist(): Promise<void> {
  await setMetaValue(META_KEYS.showFirstPaymentCta, 'false')
}

export async function getGettingStartedProgress(): Promise<GettingStartedProgress> {
  const database = getActiveDatabaseOrNull()

  if (!database) {
    return {
      school: false,
      student: false,
      payment: false,
      backup: false,
      completedCount: 0,
      totalCount: 4,
      allComplete: false,
    }
  }

  const [schoolCount, studentCount, paymentCount, lastBackupAt, directoryStatus]
    = await Promise.all([
      database.schools.count(),
      database.students.count(),
      database.studentTransactions.count(),
      getMetaValue(META_KEYS.lastBackupAt),
      getDirectoryBackupStatus(),
    ])

  const school = schoolCount >= 1
  const student = studentCount >= 1
  const payment = paymentCount >= 1
  const backup = Boolean(lastBackupAt)
    || (directoryStatus.connected && directoryStatus.permission === 'granted')

  const completedCount = [school, student, payment, backup].filter(Boolean).length

  return {
    school,
    student,
    payment,
    backup,
    completedCount,
    totalCount: 4,
    allComplete: completedCount === 4,
  }
}

async function ensureInstallId(): Promise<string> {
  const fromRegistry = await getRegistryInstallId()

  if (fromRegistry) {
    if (isActiveDatabaseBound()) {
      const inAccount = await getMetaValue(META_KEYS.installId)

      if (!inAccount) {
        await setMetaValue(META_KEYS.installId, fromRegistry)
      }
    }

    return fromRegistry
  }

  if (isActiveDatabaseBound()) {
    const fromAccount = await getMetaValue(META_KEYS.installId)

    if (fromAccount) {
      await setRegistryInstallId(fromAccount)
      return fromAccount
    }
  }

  const installId = crypto.randomUUID()
  await setRegistryInstallId(installId)

  if (isActiveDatabaseBound()) {
    await setMetaValue(META_KEYS.installId, installId)
  }

  return installId
}

export async function loadProfileSettings(): Promise<ProfileSettings> {
  await migrateLegacyOperatorName()

  const installId = await ensureInstallId()

  if (!isActiveDatabaseBound()) {
    return {
      installId,
      userName: '',
      termYear: DEFAULT_TERM_YEAR,
    }
  }

  const [storedUserName, termYear] = await Promise.all([
    getMetaValue(META_KEYS.operatorName),
    getMetaValue(META_KEYS.termYear),
  ])

  return {
    installId,
    userName: storedUserName ?? '',
    termYear: termYear ?? DEFAULT_TERM_YEAR,
  }
}

export async function saveUserName(name: string): Promise<void> {
  await setMetaValue(META_KEYS.operatorName, name)
}

/** @deprecated Use `saveUserName` instead. */
export const saveOperatorName = saveUserName

export async function saveTermYear(termYear: string): Promise<void> {
  await setMetaValue(META_KEYS.termYear, termYear)
}

export async function ensureInitialized(): Promise<ProfileSettings> {
  await ensureInstallId()
  return loadProfileSettings()
}

export async function completeOnboarding(
  options: CompleteOnboardingOptions,
): Promise<ProfileSettings> {
  const userName = resolveUserName(options)
  const termYear = options.termYear.trim() || DEFAULT_TERM_YEAR

  if (!userName) {
    throw new Error('User name is required to complete onboarding.')
  }

  const accounts = await listAccounts()

  if (accounts.length === 0) {
    const { createAndActivateAccount } = await import('~/services/accountContext')
    await createAndActivateAccount(userName, { activate: true })
  }
  else if (!isActiveDatabaseBound()) {
    const { switchActiveAccount } = await import('~/services/accountContext')
    const active = accounts[0]!
    await switchActiveAccount(active.id, { skipBackup: true, skipCacheReset: true })
  }

  const installId = await ensureInstallId()

  await setMetaValues({
    [META_KEYS.installId]: installId,
    [META_KEYS.operatorName]: userName,
    [META_KEYS.termYear]: termYear,
    [META_KEYS.initialized]: 'true',
    [META_KEYS.showFirstPaymentCta]: 'true',
  })

  return {
    installId,
    userName,
    termYear,
  }
}
