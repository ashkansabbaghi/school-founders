import { beforeEach, describe, expect, it } from 'vitest'
import { saveSchool } from '~/db/repositories/schools'
import { saveEmployee } from '~/db/repositories/employees'
import { resetTestDatabase } from '../helpers/db'

const employeePayload = {
  fullName: 'Sara Ahmadi',
  nationalCode: '9876543210',
  employeeId: 'E-100',
  role: 'Teacher',
  baseSalary: 20_000_000,
  insuranceCost: 1_000_000,
}

describe('employees repository', () => {
  let schoolId: string

  beforeEach(async () => {
    await resetTestDatabase()
    const school = await saveSchool({ name: 'Test School', branch: 'Main' })
    schoolId = school.id
  })

  it('allows updating an employee while keeping the same national code', async () => {
    const employee = await saveEmployee({ ...employeePayload, schoolId })
    const updated = await saveEmployee({
      ...employeePayload,
      id: employee.id,
      schoolId,
      fullName: 'Sara Updated',
    })

    expect(updated.id).toBe(employee.id)
    expect(updated.nationalCode).toBe('9876543210')
    expect(updated.fullName).toBe('Sara Updated')
  })

  it('rejects duplicate national codes across employees', async () => {
    await saveEmployee({ ...employeePayload, schoolId })

    await expect(saveEmployee({
      ...employeePayload,
      schoolId,
      fullName: 'Another Employee',
      employeeId: 'E-101',
    })).rejects.toMatchObject({
      statusMessage: 'errors.conflict.duplicateEmployeeNationalCode',
      data: { nationalCode: '9876543210' },
    })
  })
})
