import { beforeEach, describe, expect, it } from 'vitest'
import { addSchoolClass, saveSchool } from '~/db/repositories/schools'
import { saveStudent } from '~/db/repositories/students'
import { resetTestDatabase } from '../helpers/db'

const studentPayload = {
  fullName: 'Ali Rezaei',
  nationalCode: '1234567890',
  studentId: 'S-100',
  grade: '7',
  fullPrice: 50_000_000,
  dynamicDiscountRate: 0,
  parentName: 'Parent Name',
  parentPhone: '09123456789',
}

describe('students repository', () => {
  let schoolId: string
  let classId: string

  beforeEach(async () => {
    await resetTestDatabase()
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    schoolId = school.id
    const withClass = await addSchoolClass(schoolId, { grade: '7' })
    classId = withClass.classes[0]!.id
  })

  it('saves a student with a valid classId for the school', async () => {
    const student = await saveStudent({ ...studentPayload, schoolId, classId })

    expect(student.id).toBeTruthy()
    expect(student.schoolId).toBe(schoolId)
    expect(student.classId).toBe(classId)
    expect(student.grade).toBe('7')
  })

  it('allows updating a student while keeping the same national code', async () => {
    const student = await saveStudent({ ...studentPayload, schoolId, classId })
    const updated = await saveStudent({
      ...studentPayload,
      id: student.id,
      schoolId,
      classId,
      fullName: 'Ali Updated',
    })

    expect(updated.id).toBe(student.id)
    expect(updated.nationalCode).toBe('1234567890')
    expect(updated.fullName).toBe('Ali Updated')
    expect(updated.classId).toBe(classId)
  })

  it('rejects students without a classId', async () => {
    await expect(saveStudent({ ...studentPayload, schoolId })).rejects.toMatchObject({
      statusMessage: 'errors.validation.required',
      data: { field: 'fields.classId' },
    })

    await expect(saveStudent({ ...studentPayload, schoolId, classId: '   ' })).rejects.toMatchObject({
      statusMessage: 'errors.validation.required',
      data: { field: 'fields.classId' },
    })
  })

  it('rejects students with a classId that does not belong to the school', async () => {
    await expect(saveStudent({
      ...studentPayload,
      schoolId,
      classId: 'missing-class',
    })).rejects.toMatchObject({
      statusMessage: 'errors.relation.classNotInSchool',
      data: { schoolId, id: 'missing-class' },
    })

    const otherSchool = await saveSchool({ name: 'Other School', branch: 'East' })
    const otherWithClass = await addSchoolClass(otherSchool.id, { grade: '7' })
    const otherClassId = otherWithClass.classes[0]!.id

    await expect(saveStudent({
      ...studentPayload,
      schoolId,
      classId: otherClassId,
    })).rejects.toMatchObject({
      statusMessage: 'errors.relation.classNotInSchool',
      data: { schoolId, id: otherClassId },
    })
  })

  it('rejects duplicate national codes across students', async () => {
    await saveStudent({ ...studentPayload, schoolId, classId })

    await expect(saveStudent({
      ...studentPayload,
      schoolId,
      classId,
      fullName: 'Another Student',
      studentId: 'S-101',
    })).rejects.toMatchObject({
      statusMessage: 'errors.conflict.duplicateStudentNationalCode',
      data: { nationalCode: '1234567890' },
    })
  })
})
