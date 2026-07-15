import { beforeEach, describe, expect, it } from 'vitest'
import { saveSchool } from '~/db/repositories/schools'
import { saveStudent } from '~/db/repositories/students'
import { resetTestDatabase } from '../helpers/db'

const studentPayload = {
  fullName: 'Ali Rezaei',
  nationalCode: '1234567890',
  studentId: 'S-100',
  grade: '5',
  fullPrice: 50_000_000,
  dynamicDiscountRate: 0,
  parentName: 'Parent Name',
  parentPhone: '09123456789',
}

describe('students repository', () => {
  let schoolId: string

  beforeEach(async () => {
    await resetTestDatabase()
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    schoolId = school.id
  })

  it('allows updating a student while keeping the same national code', async () => {
    const student = await saveStudent({ ...studentPayload, schoolId })
    const updated = await saveStudent({
      ...studentPayload,
      id: student.id,
      schoolId,
      fullName: 'Ali Updated',
    })

    expect(updated.id).toBe(student.id)
    expect(updated.nationalCode).toBe('1234567890')
    expect(updated.fullName).toBe('Ali Updated')
  })

  it('rejects duplicate national codes across students', async () => {
    await saveStudent({ ...studentPayload, schoolId })

    await expect(saveStudent({
      ...studentPayload,
      schoolId,
      fullName: 'Another Student',
      studentId: 'S-101',
    })).rejects.toMatchObject({
      statusMessage: 'errors.conflict.duplicateStudentNationalCode',
      data: { nationalCode: '1234567890' },
    })
  })
})
