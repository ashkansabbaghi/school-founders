import type { Student } from '#shared/types/financial'
import { createAppError } from '#shared/errors/appError'
import {
  assertDiscountRate,
  assertNationalCode,
  assertNonEmptyString,
  assertPhone,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'
import { db } from '../database'
import {
  assertNoStudentDependents,
  assertSchoolExists,
} from '../validation'

export async function listStudents(schoolId?: string): Promise<Student[]> {
  if (!schoolId) {
    return db.students.toArray()
  }

  return db.students.where('schoolId').equals(schoolId).toArray()
}

export async function getStudent(id: string): Promise<Student | null> {
  return (await db.students.get(id)) ?? null
}

export async function saveStudent(input: {
  id?: string
  schoolId?: string
  fullName?: string
  nationalCode?: string
  studentId?: string
  grade?: string
  fullPrice?: number
  dynamicDiscountRate?: number
  parentName?: string
  parentPhone?: string
}): Promise<Student> {
  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  const student: Student = {
    id: input.id?.trim() || crypto.randomUUID(),
    schoolId,
    fullName: assertNonEmptyString(input.fullName, 'fullName'),
    nationalCode: assertNationalCode(input.nationalCode),
    studentId: assertNonEmptyString(input.studentId, 'studentId'),
    grade: assertNonEmptyString(input.grade, 'grade'),
    fullPrice: assertPositiveInteger(input.fullPrice, 'fullPrice'),
    dynamicDiscountRate: assertDiscountRate(input.dynamicDiscountRate),
    parentName: assertNonEmptyString(input.parentName, 'parentName'),
    parentPhone: assertPhone(input.parentPhone),
  }

  await db.students.put(student)
  return student
}

export async function removeStudent(id: string): Promise<void> {
  await assertNoStudentDependents(id)

  const removed = await db.transaction('rw', db.students, async () => {
    const existing = await db.students.get(id)

    if (!existing) {
      return false
    }

    await db.students.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.student' })
  }
}
