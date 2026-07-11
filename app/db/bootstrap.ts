import { META_KEYS } from '#shared/types/meta'
import { db } from './database'
import {
  DEMO_OPERATOR,
  DEMO_TERM_YEAR,
  getDemoData,
} from './demoData'
import { getMetaValue, setMetaValue, setMetaValues } from './repositories/meta'

const LEGACY_OPERATOR_STORAGE_KEY = 'finance:operatorName'

export interface ProfileSettings {
  installId: string
  operatorName: string
  termYear: string
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

export async function seedDemoData(): Promise<void> {
  const demo = getDemoData()

  await db.transaction(
    'rw',
    [
      db.schools,
      db.students,
      db.employees,
      db.studentTransactions,
      db.employeeTransactions,
      db.fixedCosts,
      db.founders,
    ],
    async () => {
      await Promise.all([
        db.schools.bulkPut(demo.schools),
        db.students.bulkPut(demo.students),
        db.employees.bulkPut(demo.employees),
        db.studentTransactions.bulkPut(demo.studentTransactions),
        db.employeeTransactions.bulkPut(demo.employeeTransactions),
        db.fixedCosts.bulkPut(demo.fixedCosts),
        db.founders.bulkPut(demo.founders),
      ])
    },
  )
}

async function clearBusinessData(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.schools,
      db.students,
      db.employees,
      db.studentTransactions,
      db.employeeTransactions,
      db.fixedCosts,
      db.founders,
    ],
    async () => {
      await Promise.all([
        db.schools.clear(),
        db.students.clear(),
        db.employees.clear(),
        db.studentTransactions.clear(),
        db.employeeTransactions.clear(),
        db.fixedCosts.clear(),
        db.founders.clear(),
      ])
    },
  )
}

async function createInstallProfile(): Promise<ProfileSettings> {
  const installId = crypto.randomUUID()

  await setMetaValues({
    [META_KEYS.installId]: installId,
    [META_KEYS.operatorName]: DEMO_OPERATOR,
    [META_KEYS.termYear]: DEMO_TERM_YEAR,
    [META_KEYS.initialized]: 'true',
  })

  return {
    installId,
    operatorName: DEMO_OPERATOR,
    termYear: DEMO_TERM_YEAR,
  }
}

export async function loadProfileSettings(): Promise<ProfileSettings> {
  await migrateLegacyOperatorName()

  const [installId, operatorName, termYear] = await Promise.all([
    getMetaValue(META_KEYS.installId),
    getMetaValue(META_KEYS.operatorName),
    getMetaValue(META_KEYS.termYear),
  ])

  if (!installId) {
    throw new Error('Install profile is missing. Run ensureInitialized() first.')
  }

  return {
    installId,
    operatorName: operatorName ?? DEMO_OPERATOR,
    termYear: termYear ?? DEMO_TERM_YEAR,
  }
}

export async function saveOperatorName(name: string): Promise<void> {
  await setMetaValue(META_KEYS.operatorName, name)
}

export async function saveTermYear(termYear: string): Promise<void> {
  await setMetaValue(META_KEYS.termYear, termYear)
}

export async function ensureInitialized(): Promise<ProfileSettings> {
  const initialized = await getMetaValue(META_KEYS.initialized)

  if (initialized === 'true') {
    return loadProfileSettings()
  }

  await seedDemoData()
  return createInstallProfile()
}

export async function resetToDemoData(): Promise<ProfileSettings> {
  await clearBusinessData()
  await seedDemoData()

  const existingInstallId = await getMetaValue(META_KEYS.installId)
  const installId = existingInstallId ?? crypto.randomUUID()

  await setMetaValues({
    [META_KEYS.installId]: installId,
    [META_KEYS.operatorName]: DEMO_OPERATOR,
    [META_KEYS.termYear]: DEMO_TERM_YEAR,
    [META_KEYS.initialized]: 'true',
  })

  return {
    installId,
    operatorName: DEMO_OPERATOR,
    termYear: DEMO_TERM_YEAR,
  }
}
