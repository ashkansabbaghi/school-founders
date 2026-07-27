import type { EmployeeExpenseStatus, School, Student, StudentPaymentStatus } from '#shared/types/financial'
import { findSchoolClass, formatClassLabel } from '#shared/utils/schoolClass'

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

export function collectUniqueStudentClasses(
  students: Array<Pick<Student, 'schoolId' | 'classId' | 'grade'>>,
  schools: School[],
  selectedGrade = '',
): Array<{ id: string, label: string }> {
  const schoolById = new Map(schools.map(school => [school.id, school]))
  const options = new Map<string, string>()

  for (const student of students) {
    if (selectedGrade && student.grade.trim() !== selectedGrade) {
      continue
    }

    const classId = student.classId?.trim()
    if (!classId || options.has(classId)) {
      continue
    }

    const schoolClass = findSchoolClass(schoolById.get(student.schoolId)?.classes, classId)
    if (!schoolClass) {
      continue
    }

    options.set(classId, formatClassLabel(schoolClass.grade, schoolClass.classNumber))
  }

  return [...options.entries()]
    .map(([id, label]) => ({ id, label }))
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))
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
