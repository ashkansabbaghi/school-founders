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

export const DB_NAME = 'pardisan'
export const DB_VERSION = 2

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

  constructor() {
    super(DB_NAME)

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
      students: 'id, schoolId',
      employees: 'id, schoolId',
      studentTransactions: 'id, studentId, schoolId, termYear',
      employeeTransactions: 'id, employeeId, schoolId, termYear',
      fixedCosts: 'id, schoolId, termYear',
      founders: 'id',
      meta: 'key',
      directoryBackup: 'id',
    })
  }
}

export const db = new PardisanDatabase()
