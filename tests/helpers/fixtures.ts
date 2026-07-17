import type {
  Employee,
  EmployeeTransaction,
  FixedCost,
  School,
  Student,
  StudentTransaction,
} from '#shared/types/financial'
import type { Founder } from '#shared/types/founder'
import { db } from '~/db/database'

/** Sample term year used by unit/e2e fixtures only — not shipped in the app. */
export const FIXTURE_TERM_YEAR = '1404-1405'

export const FIXTURE_IDS = {
  school: '11111111-1111-4111-8111-111111111111',
  student: '22222222-2222-4222-8222-222222222222',
  employee: '33333333-3333-4333-8333-333333333333',
  studentTransaction: '44444444-4444-4444-8444-444444444444',
  employeeSalaryTransaction: '55555555-5555-4555-8555-555555555555',
  employeeDeductionTransaction: '66666666-6666-4666-8666-666666666666',
  fixedCostRent: '77777777-7777-4777-8777-777777777777',
  fixedCostUtilities: '88888888-8888-4888-8888-888888888888',
  founderA: '99999999-9999-4999-8999-999999999991',
  founderB: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
} as const

export const FIXTURE_OPERATOR = 'اپراتور'

const fixtureSchools: School[] = [
  {
    id: FIXTURE_IDS.school,
    name: 'مدرسه نمونه',
    branch: 'شعبه مرکزی',
  },
]

const fixtureStudents: Student[] = [
  {
    id: FIXTURE_IDS.student,
    schoolId: FIXTURE_IDS.school,
    fullName: 'امیر نوری',
    nationalCode: '0000000001',
    studentId: 'ST-TEST-001',
    grade: '7',
    fullPrice: 45_000_000,
    dynamicDiscountRate: 0.10,
    parentName: 'حسین نوری',
    parentPhone: '09120000001',
  },
]

const fixtureEmployees: Employee[] = [
  {
    id: FIXTURE_IDS.employee,
    schoolId: FIXTURE_IDS.school,
    fullName: 'فاطمه حسینی',
    nationalCode: '0000000002',
    employeeId: 'EM-TEST-001',
    role: 'teacher',
    baseSalary: 28_000_000,
    insuranceCost: 4_200_000,
  },
]

const fixtureStudentTransactions: StudentTransaction[] = [
  {
    id: FIXTURE_IDS.studentTransaction,
    studentId: FIXTURE_IDS.student,
    schoolId: FIXTURE_IDS.school,
    amountPaid: 20_250_000,
    paymentMethod: 'bankTransfer',
    date: '2026-05-23',
    termYear: FIXTURE_TERM_YEAR,
    operator: FIXTURE_OPERATOR,
  },
]

const fixtureEmployeeTransactions: EmployeeTransaction[] = [
  {
    id: FIXTURE_IDS.employeeSalaryTransaction,
    employeeId: FIXTURE_IDS.employee,
    schoolId: FIXTURE_IDS.school,
    amountPaid: 28_000_000,
    transactionType: 'salary',
    date: '2026-05-23',
    termYear: FIXTURE_TERM_YEAR,
    operator: FIXTURE_OPERATOR,
  },
  {
    id: FIXTURE_IDS.employeeDeductionTransaction,
    employeeId: FIXTURE_IDS.employee,
    schoolId: FIXTURE_IDS.school,
    amountPaid: 500_000,
    transactionType: 'deduction',
    date: '2026-05-23',
    termYear: FIXTURE_TERM_YEAR,
    operator: FIXTURE_OPERATOR,
  },
]

const fixtureFixedCosts: FixedCost[] = [
  {
    id: FIXTURE_IDS.fixedCostRent,
    schoolId: FIXTURE_IDS.school,
    label: 'اجاره',
    amount: 15_000_000,
    termYear: FIXTURE_TERM_YEAR,
  },
  {
    id: FIXTURE_IDS.fixedCostUtilities,
    schoolId: FIXTURE_IDS.school,
    label: 'آب و برق',
    amount: 2_500_000,
    termYear: FIXTURE_TERM_YEAR,
  },
]

const fixtureFounders: Founder[] = [
  {
    id: FIXTURE_IDS.founderA,
    name: 'مؤسس اول',
    school: 'مدرسه نمونه',
  },
  {
    id: FIXTURE_IDS.founderB,
    name: 'مؤسس دوم',
    school: 'مدرسه نمونه',
  },
]

export interface TestDataBundle {
  schools: School[]
  students: Student[]
  employees: Employee[]
  studentTransactions: StudentTransaction[]
  employeeTransactions: EmployeeTransaction[]
  fixedCosts: FixedCost[]
  founders: Founder[]
}

export function getTestData(): TestDataBundle {
  return {
    schools: fixtureSchools,
    students: fixtureStudents,
    employees: fixtureEmployees,
    studentTransactions: fixtureStudentTransactions,
    employeeTransactions: fixtureEmployeeTransactions,
    fixedCosts: fixtureFixedCosts,
    founders: fixtureFounders,
  }
}

/** Seeds IndexedDB with fixture entities for unit tests. */
export async function seedTestData(): Promise<void> {
  const data = getTestData()

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
        db.schools.bulkPut(data.schools),
        db.students.bulkPut(data.students),
        db.employees.bulkPut(data.employees),
        db.studentTransactions.bulkPut(data.studentTransactions),
        db.employeeTransactions.bulkPut(data.employeeTransactions),
        db.fixedCosts.bulkPut(data.fixedCosts),
        db.founders.bulkPut(data.founders),
      ])
    },
  )
}
