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
import type { MetaRecord } from '#shared/types/meta'

export const DB_NAME = 'school-fanders'
export const DB_VERSION = 1

export class SchoolFandersDatabase extends Dexie {
  schools!: EntityTable<School, 'id'>
  students!: EntityTable<Student, 'id'>
  employees!: EntityTable<Employee, 'id'>
  studentTransactions!: EntityTable<StudentTransaction, 'id'>
  employeeTransactions!: EntityTable<EmployeeTransaction, 'id'>
  fixedCosts!: EntityTable<FixedCost, 'id'>
  founders!: EntityTable<Founder, 'id'>
  meta!: EntityTable<MetaRecord, 'key'>

  constructor() {
    super(DB_NAME)

    this.version(DB_VERSION).stores({
      schools: 'id',
      students: 'id, schoolId',
      employees: 'id, schoolId',
      studentTransactions: 'id, studentId, schoolId, termYear',
      employeeTransactions: 'id, employeeId, schoolId, termYear',
      fixedCosts: 'id, schoolId, termYear',
      founders: 'id',
      meta: 'key',
    })
  }
}

export const db = new SchoolFandersDatabase()
