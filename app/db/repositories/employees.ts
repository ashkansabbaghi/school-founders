import type { Employee } from '#shared/types/financial'
import { createAppError } from '#shared/errors/appError'
import {
  assertNationalCode,
  assertNonEmptyString,
  assertNonNegativeInteger,
  assertPositiveInteger,
} from '#shared/validation/financialValidation'
import { db } from '../database'
import {
  assertNoEmployeeDependents,
  assertSchoolExists,
} from '../validation'

export async function listEmployees(schoolId?: string): Promise<Employee[]> {
  if (!schoolId) {
    return db.employees.toArray()
  }

  return db.employees.where('schoolId').equals(schoolId).toArray()
}

export async function getEmployee(id: string): Promise<Employee | null> {
  return (await db.employees.get(id)) ?? null
}

export async function saveEmployee(input: {
  id?: string
  schoolId?: string
  fullName?: string
  nationalCode?: string
  employeeId?: string
  role?: string
  baseSalary?: number
  insuranceCost?: number
}): Promise<Employee> {
  const schoolId = assertNonEmptyString(input.schoolId, 'schoolId')
  await assertSchoolExists(schoolId)

  const employee: Employee = {
    id: input.id?.trim() || crypto.randomUUID(),
    schoolId,
    fullName: assertNonEmptyString(input.fullName, 'fullName'),
    nationalCode: assertNationalCode(input.nationalCode),
    employeeId: assertNonEmptyString(input.employeeId, 'employeeId'),
    role: assertNonEmptyString(input.role, 'role'),
    baseSalary: assertPositiveInteger(input.baseSalary, 'baseSalary'),
    insuranceCost: assertNonNegativeInteger(input.insuranceCost, 'insuranceCost'),
  }

  await db.employees.put(employee)
  return employee
}

export async function removeEmployee(id: string): Promise<void> {
  await assertNoEmployeeDependents(id)

  const removed = await db.transaction('rw', db.employees, async () => {
    const existing = await db.employees.get(id)

    if (!existing) {
      return false
    }

    await db.employees.delete(id)
    return true
  })

  if (!removed) {
    throw createAppError({ statusCode: 404, statusMessage: 'errors.notFound.employee' })
  }
}
