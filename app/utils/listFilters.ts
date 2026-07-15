import type { EmployeeExpenseStatus, StudentPaymentStatus } from '#shared/types/financial'

export const PAYMENT_STATUSES: readonly StudentPaymentStatus[] = ['paid', 'partial', 'unpaid']
export const EXPENSE_STATUSES: readonly EmployeeExpenseStatus[] = ['paid', 'partial', 'unpaid']

export function collectUniqueGrades(students: Array<{ grade: string }>): string[] {
  const grades = new Set<string>()

  for (const student of students) {
    const grade = student.grade.trim()
    if (grade) {
      grades.add(grade)
    }
  }

  return [...grades].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

export function matchesSelectFilter(value: string, selected: string): boolean {
  return !selected || value === selected
}

export function indexTransactionsByPersonId<T extends { studentId?: string, employeeId?: string }>(
  transactions: T[],
  idField: 'studentId' | 'employeeId',
): Map<string, T[]> {
  const map = new Map<string, T[]>()

  for (const transaction of transactions) {
    const personId = transaction[idField]
    if (!personId) {
      continue
    }

    const existing = map.get(personId)
    if (existing) {
      existing.push(transaction)
    } else {
      map.set(personId, [transaction])
    }
  }

  return map
}
