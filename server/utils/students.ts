import type { Student } from '../types/financial'

const FILE = 'students.json'

export async function listStudents(schoolId?: string): Promise<Student[]> {
  const students = await readCollection<Student>(FILE)

  if (!schoolId) {
    return students
  }

  return students.filter(student => student.schoolId === schoolId)
}

export async function getStudent(id: string): Promise<Student | null> {
  return getById<Student>(FILE, id)
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

  const id = input.id?.trim() || crypto.randomUUID()
  const nationalCode = assertNationalCode(input.nationalCode)
  await assertUniqueStudentNationalCode(nationalCode, id)

  const student: Student = {
    id,
    schoolId,
    fullName: assertNonEmptyString(input.fullName, 'fullName'),
    nationalCode,
    studentId: assertNonEmptyString(input.studentId, 'studentId'),
    grade: assertNonEmptyString(input.grade, 'grade'),
    fullPrice: assertPositiveInteger(input.fullPrice, 'fullPrice'),
    dynamicDiscountRate: assertDiscountRate(input.dynamicDiscountRate),
    parentName: assertNonEmptyString(input.parentName, 'parentName'),
    parentPhone: assertPhone(input.parentPhone),
  }

  return upsertById(FILE, student)
}

export async function removeStudent(id: string): Promise<void> {
  await assertNoStudentDependents(id)

  const removed = await removeById<Student>(FILE, id)

  if (!removed) {
    throw createError({ statusCode: 404, statusMessage: 'errors.notFound.student' })
  }
}
