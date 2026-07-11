import type {
  Employee,
  EmployeeTransaction,
  FixedCost,
  School,
  Student,
  StudentTransaction,
} from '#shared/types/financial'
import type { Founder } from '#shared/types/founder'

export const DEMO_TERM_YEAR = '1404-1405'

export const DEMO_IDS = {
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

export const DEMO_OPERATOR = 'اپراتور'

export const demoSchools: School[] = [
  {
    id: DEMO_IDS.school,
    name: 'مدرسه نمونه',
    branch: 'شعبه مرکزی',
  },
]

export const demoStudents: Student[] = [
  {
    id: DEMO_IDS.student,
    schoolId: DEMO_IDS.school,
    fullName: 'امیر نوری',
    nationalCode: '0000000001',
    studentId: 'ST-DEMO-001',
    grade: '7',
    fullPrice: 45_000_000,
    dynamicDiscountRate: 0.10,
    parentName: 'حسین نوری',
    parentPhone: '09120000001',
  },
]

export const demoEmployees: Employee[] = [
  {
    id: DEMO_IDS.employee,
    schoolId: DEMO_IDS.school,
    fullName: 'فاطمه حسینی',
    nationalCode: '0000000002',
    employeeId: 'EM-DEMO-001',
    role: 'teacher',
    baseSalary: 28_000_000,
    insuranceCost: 4_200_000,
  },
]

export const demoStudentTransactions: StudentTransaction[] = [
  {
    id: DEMO_IDS.studentTransaction,
    studentId: DEMO_IDS.student,
    schoolId: DEMO_IDS.school,
    amountPaid: 20_250_000,
    paymentMethod: 'bankTransfer',
    date: '2026-05-23',
    termYear: DEMO_TERM_YEAR,
    operator: DEMO_OPERATOR,
  },
]

export const demoEmployeeTransactions: EmployeeTransaction[] = [
  {
    id: DEMO_IDS.employeeSalaryTransaction,
    employeeId: DEMO_IDS.employee,
    schoolId: DEMO_IDS.school,
    amountPaid: 28_000_000,
    transactionType: 'salary',
    date: '2026-05-23',
    termYear: DEMO_TERM_YEAR,
    operator: DEMO_OPERATOR,
  },
  {
    id: DEMO_IDS.employeeDeductionTransaction,
    employeeId: DEMO_IDS.employee,
    schoolId: DEMO_IDS.school,
    amountPaid: 500_000,
    transactionType: 'deduction',
    date: '2026-05-23',
    termYear: DEMO_TERM_YEAR,
    operator: DEMO_OPERATOR,
  },
]

export const demoFixedCosts: FixedCost[] = [
  {
    id: DEMO_IDS.fixedCostRent,
    schoolId: DEMO_IDS.school,
    label: 'اجاره',
    amount: 15_000_000,
    termYear: DEMO_TERM_YEAR,
  },
  {
    id: DEMO_IDS.fixedCostUtilities,
    schoolId: DEMO_IDS.school,
    label: 'آب و برق',
    amount: 2_500_000,
    termYear: DEMO_TERM_YEAR,
  },
]

export const demoFounders: Founder[] = [
  {
    id: DEMO_IDS.founderA,
    name: 'مؤسس اول',
    school: 'مدرسه نمونه',
  },
  {
    id: DEMO_IDS.founderB,
    name: 'مؤسس دوم',
    school: 'مدرسه نمونه',
  },
]

export interface DemoDataBundle {
  schools: School[]
  students: Student[]
  employees: Employee[]
  studentTransactions: StudentTransaction[]
  employeeTransactions: EmployeeTransaction[]
  fixedCosts: FixedCost[]
  founders: Founder[]
}

export function getDemoData(): DemoDataBundle {
  return {
    schools: demoSchools,
    students: demoStudents,
    employees: demoEmployees,
    studentTransactions: demoStudentTransactions,
    employeeTransactions: demoEmployeeTransactions,
    fixedCosts: demoFixedCosts,
    founders: demoFounders,
  }
}
