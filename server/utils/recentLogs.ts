import type { RecentLogEntry } from '../types/financial'

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

  const sorted = entries
    .sort((left, right) => right.loggedAt.localeCompare(left.loggedAt))

  const limit = options?.limit
  if (limit !== undefined && limit > 0) {
    return sorted.slice(0, limit)
  }

  return sorted
}
