import { createAppError } from '#shared/errors/appError'
import type {
  Employee,
  EmployeeTransaction,
  FixedCost,
  School,
  Student,
  StudentTransaction,
} from '#shared/types/financial'
import type { Founder } from '#shared/types/founder'
import { META_KEYS } from '#shared/types/meta'
import { DB_VERSION } from '~/db/database'
import { db } from '~/db/database'
import { getAccountById, getActiveAccountId } from '~/db/registry'
import { listMeta, setMetaValue } from '~/db/repositories/meta'

/** Current export schema. Imports also accept {@link LEGACY_BACKUP_SCHEMA_VERSION}. */
export const BACKUP_SCHEMA_VERSION = 2

/** Pre-multi-account backup files remain importable into the active account. */
export const LEGACY_BACKUP_SCHEMA_VERSION = 1

const SUPPORTED_BACKUP_SCHEMA_VERSIONS = new Set([
  LEGACY_BACKUP_SCHEMA_VERSION,
  BACKUP_SCHEMA_VERSION,
])

const BACKUP_COLLECTION_NAMES = [
  'schools',
  'students',
  'employees',
  'studentTransactions',
  'employeeTransactions',
  'fixedCosts',
  'founders',
] as const

type BackupCollectionName = (typeof BACKUP_COLLECTION_NAMES)[number]

export interface BackupCollections {
  schools: School[]
  students: Student[]
  employees: Employee[]
  studentTransactions: StudentTransaction[]
  employeeTransactions: EmployeeTransaction[]
  fixedCosts: FixedCost[]
  founders: Founder[]
  meta: Record<string, string>
}

export interface BackupAccountInfo {
  id: string
  name: string
  folderName: string
}

export interface BackupPayload {
  schemaVersion: number
  dbVersion: number
  exportedAt: string
  /** Present on schema v2 exports; ignored on import (data always replaces the active account). */
  account?: BackupAccountInfo
  collections: BackupCollections
}

export interface StoragePersistenceInfo {
  supported: boolean
  persisted: boolean | null
  usageBytes: number | null
  quotaBytes: number | null
}

const BUSINESS_TABLES = [
  'schools',
  'students',
  'employees',
  'studentTransactions',
  'employeeTransactions',
  'fixedCosts',
  'founders',
] as const

function businessTables() {
  return BUSINESS_TABLES.map(name => db.table(name))
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertArray(value: unknown, collection: string): unknown[] {
  if (!Array.isArray(value)) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidCollection',
      data: { filename: collection },
    })
  }

  return value
}

function assertRecordIds(
  records: unknown[],
  collection: string,
  idField = 'id',
): Set<string> {
  const ids = new Set<string>()

  for (const record of records) {
    if (!isPlainObject(record)) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.invalidCollection',
        data: { filename: collection },
      })
    }

    const id = record[idField]

    if (typeof id !== 'string' || !id.trim()) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.invalidCollection',
        data: { filename: collection },
      })
    }

    if (ids.has(id)) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.duplicateId',
        data: { id },
      })
    }

    ids.add(id)
  }

  return ids
}

function assertReference(
  id: unknown,
  validIds: Set<string>,
  statusMessage: string,
  data: { schoolId?: string, studentId?: string, employeeId?: string },
): void {
  if (typeof id !== 'string' || !validIds.has(id)) {
    throw createAppError({
      statusCode: 400,
      statusMessage,
      data,
    })
  }
}

export function validateBackupPayload(raw: unknown): BackupPayload {
  if (!isPlainObject(raw)) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidFormat',
    })
  }

  const schemaVersion = raw.schemaVersion

  if (
    typeof schemaVersion !== 'number'
    || !SUPPORTED_BACKUP_SCHEMA_VERSIONS.has(schemaVersion)
  ) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.unsupportedSchemaVersion',
      data: { values: String(schemaVersion ?? 'unknown') },
    })
  }

  if (typeof raw.exportedAt !== 'string' || !raw.exportedAt.trim()) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidFormat',
    })
  }

  let account: BackupAccountInfo | undefined

  if (schemaVersion >= BACKUP_SCHEMA_VERSION && raw.account !== undefined) {
    if (!isPlainObject(raw.account)) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.invalidFormat',
      })
    }

    const { id, name, folderName } = raw.account

    if (
      typeof id !== 'string' || !id.trim()
      || typeof name !== 'string' || !name.trim()
      || typeof folderName !== 'string' || !folderName.trim()
    ) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.invalidFormat',
      })
    }

    account = { id, name, folderName }
  }

  if (!isPlainObject(raw.collections)) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidFormat',
    })
  }

  for (const name of BACKUP_COLLECTION_NAMES) {
    if (!(name in raw.collections)) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.missingCollection',
        data: { filename: name },
      })
    }
  }

  if (!isPlainObject(raw.collections.meta)) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidCollection',
      data: { filename: 'meta' },
    })
  }

  const collections = raw.collections as Record<string, unknown>

  const schools = assertArray(collections.schools, 'schools') as School[]
  const students = assertArray(collections.students, 'students') as Student[]
  const employees = assertArray(collections.employees, 'employees') as Employee[]
  const studentTransactions = assertArray(
    collections.studentTransactions,
    'studentTransactions',
  ) as StudentTransaction[]
  const employeeTransactions = assertArray(
    collections.employeeTransactions,
    'employeeTransactions',
  ) as EmployeeTransaction[]
  const fixedCosts = assertArray(collections.fixedCosts, 'fixedCosts') as FixedCost[]
  const founders = assertArray(collections.founders, 'founders') as Founder[]

  const schoolIds = assertRecordIds(schools, 'schools')
  const studentIds = assertRecordIds(students, 'students')
  const employeeIds = assertRecordIds(employees, 'employees')
  assertRecordIds(studentTransactions, 'studentTransactions')
  assertRecordIds(employeeTransactions, 'employeeTransactions')
  assertRecordIds(fixedCosts, 'fixedCosts')
  assertRecordIds(founders, 'founders')

  for (const student of students) {
    assertReference(student.schoolId, schoolIds, 'errors.notFound.schoolId', {
      schoolId: student.schoolId,
    })
  }

  for (const employee of employees) {
    assertReference(employee.schoolId, schoolIds, 'errors.notFound.schoolId', {
      schoolId: employee.schoolId,
    })
  }

  for (const transaction of studentTransactions) {
    assertReference(transaction.schoolId, schoolIds, 'errors.notFound.schoolId', {
      schoolId: transaction.schoolId,
    })
    assertReference(transaction.studentId, studentIds, 'errors.notFound.studentId', {
      studentId: transaction.studentId,
    })

    const student = students.find(item => item.id === transaction.studentId)

    if (student && student.schoolId !== transaction.schoolId) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.relation.studentNotInSchool',
      })
    }
  }

  for (const transaction of employeeTransactions) {
    assertReference(transaction.schoolId, schoolIds, 'errors.notFound.schoolId', {
      schoolId: transaction.schoolId,
    })
    assertReference(transaction.employeeId, employeeIds, 'errors.notFound.employeeId', {
      employeeId: transaction.employeeId,
    })

    const employee = employees.find(item => item.id === transaction.employeeId)

    if (employee && employee.schoolId !== transaction.schoolId) {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.relation.employeeNotInSchool',
      })
    }
  }

  for (const cost of fixedCosts) {
    assertReference(cost.schoolId, schoolIds, 'errors.notFound.schoolId', {
      schoolId: cost.schoolId,
    })
  }

  const metaEntries = Object.entries(raw.collections.meta as Record<string, unknown>)

  for (const [key, value] of metaEntries) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      throw createAppError({
        statusCode: 400,
        statusMessage: 'errors.backup.invalidCollection',
        data: { filename: 'meta' },
      })
    }
  }

  return {
    schemaVersion,
    dbVersion: typeof raw.dbVersion === 'number' ? raw.dbVersion : DB_VERSION,
    exportedAt: raw.exportedAt,
    ...(account ? { account } : {}),
    collections: {
      schools,
      students,
      employees,
      studentTransactions,
      employeeTransactions,
      fixedCosts,
      founders,
      meta: raw.collections.meta as Record<string, string>,
    },
  }
}

export async function createBackupPayload(): Promise<BackupPayload> {
  const [
    schools,
    students,
    employees,
    studentTransactions,
    employeeTransactions,
    fixedCosts,
    founders,
    meta,
    activeAccountId,
  ] = await Promise.all([
    db.schools.toArray(),
    db.students.toArray(),
    db.employees.toArray(),
    db.studentTransactions.toArray(),
    db.employeeTransactions.toArray(),
    db.fixedCosts.toArray(),
    db.founders.toArray(),
    listMeta(),
    getActiveAccountId(),
  ])

  const activeAccount = activeAccountId
    ? await getAccountById(activeAccountId)
    : undefined

  return {
    schemaVersion: BACKUP_SCHEMA_VERSION,
    dbVersion: DB_VERSION,
    exportedAt: new Date().toISOString(),
    ...(activeAccount
      ? {
          account: {
            id: activeAccount.id,
            name: activeAccount.name,
            folderName: activeAccount.folderName,
          },
        }
      : {}),
    collections: {
      schools,
      students,
      employees,
      studentTransactions,
      employeeTransactions,
      fixedCosts,
      founders,
      meta,
    },
  }
}

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function exportBackup(): Promise<BackupPayload> {
  const payload = await createBackupPayload()
  const datePart = payload.exportedAt.slice(0, 10)
  downloadJson(payload, `pardisan-backup-${datePart}.json`)
  await setMetaValue(META_KEYS.lastBackupAt, payload.exportedAt)
  return payload
}

export async function importBackup(
  raw: unknown,
  options: { preserveInstallId: string },
): Promise<void> {
  const payload = validateBackupPayload(raw)
  const meta = {
    ...payload.collections.meta,
    [META_KEYS.installId]: options.preserveInstallId,
    [META_KEYS.initialized]: 'true',
  }

  await db.transaction(
    'rw',
    [...businessTables(), db.meta],
    async () => {
      await Promise.all([
        db.schools.clear(),
        db.students.clear(),
        db.employees.clear(),
        db.studentTransactions.clear(),
        db.employeeTransactions.clear(),
        db.fixedCosts.clear(),
        db.founders.clear(),
        db.meta.clear(),
      ])

      await Promise.all([
        db.schools.bulkPut(payload.collections.schools),
        db.students.bulkPut(payload.collections.students),
        db.employees.bulkPut(payload.collections.employees),
        db.studentTransactions.bulkPut(payload.collections.studentTransactions),
        db.employeeTransactions.bulkPut(payload.collections.employeeTransactions),
        db.fixedCosts.bulkPut(payload.collections.fixedCosts),
        db.founders.bulkPut(payload.collections.founders),
        db.meta.bulkPut(
          Object.entries(meta).map(([key, value]) => ({ key, value })),
        ),
      ])
    },
  )
}

export function parseBackupFile(content: string): unknown {
  try {
    return JSON.parse(content) as unknown
  }
  catch {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.backup.invalidJson',
    })
  }
}

export async function getStoragePersistenceInfo(): Promise<StoragePersistenceInfo> {
  if (!import.meta.client || !navigator.storage) {
    return {
      supported: false,
      persisted: null,
      usageBytes: null,
      quotaBytes: null,
    }
  }

  const [persisted, estimate] = await Promise.all([
    navigator.storage.persisted?.() ?? Promise.resolve(false),
    navigator.storage.estimate?.() ?? Promise.resolve({ usage: 0, quota: 0 }),
  ])

  return {
    supported: true,
    persisted,
    usageBytes: estimate.usage ?? null,
    quotaBytes: estimate.quota ?? null,
  }
}

export async function requestStoragePersistence(): Promise<boolean> {
  if (!import.meta.client || !navigator.storage?.persist) {
    return false
  }

  return navigator.storage.persist()
}

export type { BackupCollectionName }
