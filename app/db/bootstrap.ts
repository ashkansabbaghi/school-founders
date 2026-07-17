import { META_KEYS } from '#shared/types/meta'
import { getDirectoryBackupStatus } from '~/services/directoryBackup'
import { db } from './database'
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
  const value = await getMetaValue(META_KEYS.showFirstPaymentCta)
  return value === 'true'
}

export async function dismissGettingStartedChecklist(): Promise<void> {
  await setMetaValue(META_KEYS.showFirstPaymentCta, 'false')
}

export async function getGettingStartedProgress(): Promise<GettingStartedProgress> {
  const [schoolCount, studentCount, paymentCount, lastBackupAt, directoryStatus]
    = await Promise.all([
      db.schools.count(),
      db.students.count(),
      db.studentTransactions.count(),
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
  const existing = await getMetaValue(META_KEYS.installId)

  if (existing) {
    return existing
  }

  const installId = crypto.randomUUID()
  await setMetaValue(META_KEYS.installId, installId)
  return installId
}

export async function loadProfileSettings(): Promise<ProfileSettings> {
  await migrateLegacyOperatorName()

  const [installId, storedUserName, termYear] = await Promise.all([
    getMetaValue(META_KEYS.installId),
    getMetaValue(META_KEYS.operatorName),
    getMetaValue(META_KEYS.termYear),
  ])

  if (!installId) {
    throw new Error('Install profile is missing. Run ensureInitialized() first.')
  }

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

  if (await isOnboardingComplete()) {
    return loadProfileSettings()
  }

  return loadProfileSettings()
}

export async function completeOnboarding(
  options: CompleteOnboardingOptions,
): Promise<ProfileSettings> {
  const installId = await ensureInstallId()
  const userName = resolveUserName(options)
  const termYear = options.termYear.trim() || DEFAULT_TERM_YEAR

  if (!userName) {
    throw new Error('User name is required to complete onboarding.')
  }

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
