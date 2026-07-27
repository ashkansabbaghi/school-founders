import { createAppError } from '#shared/errors/appError'
import type { Employee, School, SchoolClass, Student } from '#shared/types/financial'
import { findSchoolClass, normalizeSchoolClasses } from '#shared/utils/schoolClass'
import { db } from './database'

export async function assertSchoolExists(schoolId: string): Promise<School> {
  const school = await db.schools.get(schoolId)

  if (!school) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.notFound.schoolId',
      data: { schoolId },
    })
  }

  return {
    ...school,
    classes: normalizeSchoolClasses(school.classes),
  }
}

export async function assertSchoolClassExists(
  schoolId: string,
  classId: string,
): Promise<SchoolClass> {
  const school = await assertSchoolExists(schoolId)
  const schoolClass = findSchoolClass(school.classes, classId)

  if (!schoolClass) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.relation.classNotInSchool',
      data: { schoolId, id: classId },
    })
  }

  return schoolClass
}

export async function assertStudentExists(studentId: string): Promise<Student> {
  const student = await db.students.get(studentId)

  if (!student) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.notFound.studentId',
      data: { studentId },
    })
  }

  return student
}

export async function assertEmployeeExists(employeeId: string): Promise<Employee> {
  const employee = await db.employees.get(employeeId)

  if (!employee) {
    throw createAppError({
      statusCode: 400,
      statusMessage: 'errors.notFound.employeeId',
      data: { employeeId },
    })
  }

  return employee
}

export async function assertNoSchoolDependents(schoolId: string): Promise<void> {
  const [studentCount, employeeCount, studentTransactionCount, employeeTransactionCount] =
    await Promise.all([
      db.students.where('schoolId').equals(schoolId).count(),
      db.employees.where('schoolId').equals(schoolId).count(),
      db.studentTransactions.where('schoolId').equals(schoolId).count(),
      db.employeeTransactions.where('schoolId').equals(schoolId).count(),
    ])

  if (studentCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasStudents',
    })
  }

  if (employeeCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasEmployees',
    })
  }

  if (studentTransactionCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasStudentTransactions',
    })
  }

  if (employeeTransactionCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.schoolHasEmployeeTransactions',
    })
  }
}

export async function assertNoStudentDependents(studentId: string): Promise<void> {
  const transactionCount = await db.studentTransactions
    .where('studentId')
    .equals(studentId)
    .count()

  if (transactionCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.studentHasTransactions',
    })
  }
}

export async function assertNoEmployeeDependents(employeeId: string): Promise<void> {
  const transactionCount = await db.employeeTransactions
    .where('employeeId')
    .equals(employeeId)
    .count()

  if (transactionCount > 0) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.employeeHasTransactions',
    })
  }
}

export async function assertUniqueStudentNationalCode(
  nationalCode: string,
  excludeId?: string,
): Promise<void> {
  const duplicate = await db.students.where('nationalCode').equals(nationalCode).first()

  if (duplicate && duplicate.id !== excludeId?.trim()) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.duplicateStudentNationalCode',
      data: { nationalCode },
    })
  }
}

export async function assertUniqueEmployeeNationalCode(
  nationalCode: string,
  excludeId?: string,
): Promise<void> {
  const duplicate = await db.employees.where('nationalCode').equals(nationalCode).first()

  if (duplicate && duplicate.id !== excludeId?.trim()) {
    throw createAppError({
      statusCode: 409,
      statusMessage: 'errors.conflict.duplicateEmployeeNationalCode',
      data: { nationalCode },
    })
  }
}
