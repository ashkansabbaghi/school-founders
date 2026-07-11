import type {
  Employee,
  EmployeeLogPayload,
  EmployeeTransaction,
  FinanceSummary,
  RecentLogEntry,
  School,
  SchoolProfitBreakdown,
  Student,
  StudentLogPayload,
  StudentTransaction,
} from '#shared/types/financial'
import {
  listEmployeeTransactions,
  listEmployees,
  listFixedCosts,
  listSchools,
  listStudentTransactions,
  listStudents,
  removeEmployee,
  removeEmployeeTransaction,
  removeStudent,
  removeStudentTransaction,
  saveEmployee,
  saveEmployeeTransaction,
  saveStudent,
  saveStudentTransaction,
} from '~/db'

export {
  listEmployeeTransactions,
  listEmployees,
  listSchools,
  listStudentTransactions,
  listStudents,
  removeEmployee,
  removeEmployeeTransaction,
  removeStudent,
  removeStudentTransaction,
  saveEmployee,
  saveEmployeeTransaction,
  saveStudent,
  saveStudentTransaction,
}

export const TAX_RATE = 0.05
export const RESERVE_RATE = 0.10

function employeeExpenseAmount(transaction: EmployeeTransaction): number {
  return transaction.transactionType === 'deduction'
    ? -transaction.amountPaid
    : transaction.amountPaid
}

function createEmptyBreakdown(
  schoolId: string,
  schoolName: string,
  branch: string,
): SchoolProfitBreakdown {
  return {
    schoolId,
    schoolName,
    branch,
    revenue: 0,
    employeeExpenses: 0,
    fixedCosts: 0,
    operationalExpenses: 0,
    grossProfit: 0,
    tax: 0,
    reserveFund: 0,
    netProfit: 0,
  }
}

function finalizeBreakdown(breakdown: SchoolProfitBreakdown): SchoolProfitBreakdown {
  breakdown.operationalExpenses = breakdown.employeeExpenses + breakdown.fixedCosts
  breakdown.grossProfit = breakdown.revenue - breakdown.operationalExpenses

  if (breakdown.grossProfit > 0) {
    breakdown.tax = Math.round(breakdown.grossProfit * TAX_RATE)
    breakdown.reserveFund = Math.round(breakdown.grossProfit * RESERVE_RATE)
  }
  else {
    breakdown.tax = 0
    breakdown.reserveFund = 0
  }

  breakdown.netProfit = breakdown.grossProfit - breakdown.tax - breakdown.reserveFund
  return breakdown
}

export async function calculateFinanceSummary(filters?: {
  termYear?: string
}): Promise<FinanceSummary> {
  const termYear = filters?.termYear?.trim()

  const [schools, studentTransactions, employeeTransactions, fixedCosts] = await Promise.all([
    listSchools(),
    listStudentTransactions(termYear ? { termYear } : undefined),
    listEmployeeTransactions(termYear ? { termYear } : undefined),
    listFixedCosts(termYear ? { termYear } : undefined),
  ])

  const breakdownBySchool = new Map<string, SchoolProfitBreakdown>()

  for (const school of schools) {
    breakdownBySchool.set(
      school.id,
      createEmptyBreakdown(school.id, school.name, school.branch),
    )
  }

  for (const transaction of studentTransactions) {
    const breakdown = breakdownBySchool.get(transaction.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.revenue += transaction.amountPaid
  }

  for (const transaction of employeeTransactions) {
    const breakdown = breakdownBySchool.get(transaction.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.employeeExpenses += employeeExpenseAmount(transaction)
  }

  for (const cost of fixedCosts) {
    const breakdown = breakdownBySchool.get(cost.schoolId)

    if (!breakdown) {
      continue
    }

    breakdown.fixedCosts += cost.amount
  }

  const schoolBreakdowns = [...breakdownBySchool.values()].map(finalizeBreakdown)

  return {
    totalRevenue: schoolBreakdowns.reduce((sum, school) => sum + school.revenue, 0),
    totalOperationalExpenses: schoolBreakdowns.reduce(
      (sum, school) => sum + school.operationalExpenses,
      0,
    ),
    totalGrossProfit: schoolBreakdowns.reduce((sum, school) => sum + school.grossProfit, 0),
    totalTax: schoolBreakdowns.reduce((sum, school) => sum + school.tax, 0),
    totalReserveFund: schoolBreakdowns.reduce((sum, school) => sum + school.reserveFund, 0),
    totalNetProfit: schoolBreakdowns.reduce((sum, school) => sum + school.netProfit, 0),
    schools: schoolBreakdowns,
  }
}

function resolveLoggedAt(loggedAt: string | undefined, date: string, index: number): string {
  if (loggedAt) {
    return loggedAt
  }

  return `${date}T${String(index).padStart(6, '0')}Z`
}

export async function listRecentLogs(options?: {
  limit?: number
  termYear?: string
}): Promise<RecentLogEntry[]> {
  const limit = options?.limit ?? 10
  const termYear = options?.termYear?.trim()

  const [studentTransactions, employeeTransactions, schools, students, employees] = await Promise.all([
    listStudentTransactions(termYear ? { termYear } : undefined),
    listEmployeeTransactions(termYear ? { termYear } : undefined),
    listSchools(),
    listStudents(),
    listEmployees(),
  ])

  const schoolById = new Map(schools.map(school => [school.id, school]))
  const studentById = new Map(students.map(student => [student.id, student]))
  const employeeById = new Map(employees.map(employee => [employee.id, employee]))

  const entries: RecentLogEntry[] = []

  studentTransactions.forEach((transaction, index) => {
    const school = schoolById.get(transaction.schoolId)
    const student = studentById.get(transaction.studentId)

    entries.push({
      id: transaction.id,
      kind: 'student',
      date: transaction.date,
      termYear: transaction.termYear,
      operator: transaction.operator,
      amountPaid: transaction.amountPaid,
      schoolId: transaction.schoolId,
      schoolName: school?.name ?? transaction.schoolId,
      schoolBranch: school?.branch ?? '',
      personName: student?.fullName ?? transaction.studentId,
      detail: transaction.paymentMethod,
      loggedAt: resolveLoggedAt(transaction.loggedAt, transaction.date, index),
    })
  })

  employeeTransactions.forEach((transaction, index) => {
    const school = schoolById.get(transaction.schoolId)
    const employee = employeeById.get(transaction.employeeId)

    entries.push({
      id: transaction.id,
      kind: 'employee',
      date: transaction.date,
      termYear: transaction.termYear,
      operator: transaction.operator,
      amountPaid: transaction.amountPaid,
      schoolId: transaction.schoolId,
      schoolName: school?.name ?? transaction.schoolId,
      schoolBranch: school?.branch ?? '',
      personName: employee?.fullName ?? transaction.employeeId,
      detail: transaction.transactionType,
      loggedAt: resolveLoggedAt(transaction.loggedAt, transaction.date, index),
    })
  })

  return entries
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))
    .slice(0, limit)
}

export async function deleteStudentTransaction(id: string): Promise<void> {
  return removeStudentTransaction(id)
}

export async function deleteEmployeeTransaction(id: string): Promise<void> {
  return removeEmployeeTransaction(id)
}

export async function fetchMasterData(): Promise<{
  schools: School[]
  students: Student[]
  employees: Employee[]
}> {
  const [schools, students, employees] = await Promise.all([
    listSchools(),
    listStudents(),
    listEmployees(),
  ])

  return { schools, students, employees }
}

export async function logStudentPayment(payload: StudentLogPayload): Promise<StudentTransaction> {
  return saveStudentTransaction(payload)
}

export async function logEmployeeExpense(payload: EmployeeLogPayload): Promise<EmployeeTransaction> {
  return saveEmployeeTransaction(payload)
}

export async function updateStudentTransaction(
  id: string,
  payload: StudentLogPayload,
): Promise<StudentTransaction> {
  return saveStudentTransaction({ ...payload, id })
}

export async function updateEmployeeTransaction(
  id: string,
  payload: EmployeeLogPayload,
): Promise<EmployeeTransaction> {
  return saveEmployeeTransaction({ ...payload, id })
}
